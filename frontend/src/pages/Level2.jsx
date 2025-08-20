// frontend/src/pages/Level2.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./level2.css";
import { getOrCreatePlayerId } from "../utils/playerId";
import k8sbg from "../assets/k8s-level2-bg.jpeg";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LEVEL = 2;

// Starter YAML (intentionally minimal – user must add probes + resources + scale)
const STARTER_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:latest
          ports:
            - containerPort: 80
`;

// A passing solution for the "Paste Solution" button
const PASSING_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:latest
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "250m"
              memory: "256Mi"
`;

export default function Level2() {
  const [playerId, setPlayerId] = useState(null);
  const [yamlText, setYamlText] = useState(STARTER_YAML);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null); // { ok, checks:{}, errors:[] }
  const [serverDone, setServerDone] = useState(false);

  // fire confetti only once
  const firedRef = useRef(false);

  // Load player + existing progress
  useEffect(() => {
    const pid = getOrCreatePlayerId();
    setPlayerId(pid);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/progress?playerId=${pid}&level=${LEVEL}`);
        const data = await res.json();

        if (data?.tasks?.validYaml) {
          setServerDone(true);
          // אם הבקאנד מחזיר yaml ששמרת — נטען אותו
          if (typeof data.yaml === "string" && data.yaml.trim().length) {
            setYamlText(data.yaml);
          }
        }
      } catch {
        /* ignore for UX */
      }
    })();
  }, []);

  const passed = useMemo(() => serverDone || !!result?.ok, [serverDone, result]);

  // make checks stay green when serverDone=true (even before running validate again)
  const checks =
    result?.checks ||
    (serverDone
      ? {
          apiVersion: true,
          kindDeployment: true,
          metadataName: true,
          replicas: true,
          image: true,
          probes: true,
          resources: true,
        }
      : {});

  // Confetti on success (once)
  useEffect(() => {
    if (!passed || firedRef.current) return;
    firedRef.current = true;

    const duration = 2200;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
      confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 90,
        startVelocity: 45,
        gravity: 1.0,
        origin: { y: 0.55 },
      });
    }, 500);
  }, [passed]);

  async function validateYaml() {
    if (!playerId) return;
    setValidating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/level/2/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, yaml: yamlText }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        setServerDone(true); // נשאר ירוק גם לאחר רענון
      }
    } catch (err) {
      setResult({ ok: false, errors: ["Network error"], checks: {} });
    } finally {
      setValidating(false);
    }
  }

  return (
    <section
      className="l2-root"
      style={{ backgroundImage: `url(${k8sbg})`
      }}
    >
      <div className="l2-wrap">
        <header className="l2-hero">
          <h2>Level 2 — Kubernetes YAML</h2>
          <p>Make the Deployment production-ready. Validate when you think it’s correct.</p>
        </header>

        <div className="l2-grid">
          {/* Editor */}
          <div className="card editor">
            <div className="card-head">
              <strong>deployment.yaml</strong>
              <span className="hint">Add probes · resources · scale</span>
            </div>
            <textarea
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              spellCheck={false}
            />
            <div className="editor-actions">
              <button className="btn" onClick={() => setYamlText(PASSING_YAML)}>
                Paste Solution
              </button>
              <button className="btn primary" onClick={validateYaml} disabled={validating}>
                {validating ? "Validating…" : "Validate"}
              </button>
              {passed && (
                <a className="btn success" href="/level3">
                  Next: Level 3 →
                </a>
              )}
            </div>
          </div>

          {/* Checklist / Results */}
          <div className="card panel">
            <div className="card-head">
              <strong>Checks</strong>
              <span className={`pill ${passed ? "pill-ok" : "pill-bad"}`}>
                {passed ? "All checks passed" : "Not passed"}
              </span>
            </div>

            <ul className="checklist">
              <Rule ok={checks.apiVersion}>apiVersion = <code>apps/v1</code></Rule>
              <Rule ok={checks.kindDeployment}>kind = <code>Deployment</code></Rule>
              <Rule ok={checks.metadataName}>metadata.name exists</Rule>
              <Rule ok={checks.replicas}>replicas ≥ 2</Rule>
              <Rule ok={checks.image}>containers[0].image exists</Rule>
              <Rule ok={checks.probes}>readinessProbe + livenessProbe present</Rule>
              <Rule ok={checks.resources}>resources.requests + limits present</Rule>
            </ul>

            {result && (
              <div className={`result ${result.ok ? "ok" : "bad"}`}>
                {result.ok ? "✅ Looks good! Progress saved." : "❌ Still missing something."}
                {!result.ok && result.errors?.length > 0 && (
                  <pre className="errors">{result.errors.join("\n")}</pre>
                )}
              </div>
            )}

            <footer className="tips">
              <div>Tips:</div>
              <ul>
                <li>Set <code>spec.replicas</code> to at least <code>2</code>.</li>
                <li>Add <code>readinessProbe</code> and <code>livenessProbe</code> for port <code>80</code>.</li>
                <li>Include <code>resources.requests</code> and <code>resources.limits</code> (CPU/Memory).</li>
              </ul>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rule({ ok, children }) {
  return (
    <li className={ok ? "ok" : ""}>
      <span className="dot" />
      <span>{children}</span>
    </li>
  );
}