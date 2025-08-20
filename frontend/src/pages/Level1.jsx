// frontend/src/pages/Level1.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./level1.css";
import dockerBg from "../assets/docker-level1-bg.jpeg";
import { getOrCreatePlayerId } from "../utils/playerId";

// ----- Consts -----
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LEVEL = 1;

// ----- UI Text -----
const banner = [
  "DevOps Escape Room — Level 1 (Docker)",
  "Type 'help' for available commands.",
].join("\n");

const helpText = [
  "Available commands:",
  "  help                Show this help",
  "  clear               Clear terminal",
  "  hint                Show a contextual hint",
  "  docker images       List pulled images",
  "  docker pull <img>   Pull an image (e.g. docker pull nginx)",
  "  docker run --name <name> -p <host:cont> <image>",
  "  docker ps           List running containers",
  "  docker logs <name>  Show container logs",
].join("\n");

const hints = [
  "Hint #1: תתחילי עם docker pull nginx",
  "Hint #2: הריצי קונטיינר: docker run --name web -p 8080:80 nginx",
  "Hint #3: עכשיו הסתכלי בלוגים: docker logs web",
];

// ----- Initial local state -----
const initialState = {
  images: {},          // { nginx: true }
  containers: {},      // { web: { image, ports, running, logs:[] } }
  pulled: false,
  ran: false,
  sawLogs: false,
};

export default function Level1() {
  const [history, setHistory] = useState([banner]);
  const [cmd, setCmd] = useState("");
  const [state, setState] = useState(initialState);
  const [hintStep, setHintStep] = useState(0);
  const [playerId, setPlayerId] = useState(null);
  const inputRef = useRef(null);
  const firedRef = useRef(false);

  const done = useMemo(
    () => state.pulled && state.ran && state.sawLogs,
    [state]
  );

  // focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // load progress & reconstruct local CLI state
  useEffect(() => {
    (async () => {
      const pid = getOrCreatePlayerId();
      setPlayerId(pid);

      try {
        const res = await fetch(
          `${API_BASE}/api/progress?playerId=${pid}&level=${LEVEL}`
        );
        const data = await res.json();

        // בונים state מלא לפי השרת
        const next = {
          images: {},
          containers: {},
          pulled: !!data?.tasks?.pull,
          ran: !!data?.tasks?.run,
          sawLogs: !!data?.tasks?.logs,
        };

        // אם "pull" סומן – נוסיף את התמונה הלוקאלית
        if (next.pulled) {
          next.images["nginx"] = true;
        }

        // אם "run" סומן – נוודא שיש קונטיינר web תקין
        if (next.ran) {
          next.images["nginx"] = true; // ליתר ביטחון
          next.containers["web"] = {
            image: "nginx",
            ports: "8080:80",
            running: true,
            logs: [
              `[${new Date().toLocaleTimeString()}] Starting web from nginx`,
              "App listening on 0.0.0.0:80",
              "💡 flag{docker-stage-1-ok}",
            ],
          };
        }

        setState(next);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    })();
  }, []);

  // confetti when done
  useEffect(() => {
    if (!done || firedRef.current) return;
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
  }, [done]);

  // helpers
  const print = (text = "") => setHistory((h) => [...h, text]);

  async function updateTask(task, completed) {
    // task: "pull" | "run" | "logs"
    try {
      await fetch(`${API_BASE}/api/progress/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, level: LEVEL, task, completed }),
      });

      // עדכון לוקאלי מיידי + בניית objects אם צריך
      setState((s) => {
        const next = { ...s };

        if (task === "pull" && completed) {
          next.pulled = true;
          next.images = { ...next.images, nginx: true };
        }

        if (task === "run" && completed) {
          // ודאי שהתמונה קיימת
          next.images = { ...next.images, nginx: true };
          next.ran = true;
          next.containers = {
            ...next.containers,
            web: {
              image: "nginx",
              ports: "8080:80",
              running: true,
              logs: [
                `[${new Date().toLocaleTimeString()}] Starting web from nginx`,
                "App listening on 0.0.0.0:80",
                "💡 flag{docker-stage-1-ok}",
              ],
            },
          };
        }

        if (task === "logs" && completed) {
          next.sawLogs = true;
        }

        return next;
      });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }

  // command handling
  const handleSubmit = (e) => {
    e.preventDefault();
    const line = cmd.trim();
    if (!line) return;

    print(`$ ${line}`);
    setCmd("");

    if (line === "help") return print(helpText);
    if (line === "clear") return setHistory([]);
    if (line === "hint") {
      print(hints[Math.min(hintStep, hints.length - 1)]);
      setHintStep((h) => Math.min(h + 1, hints.length - 1));
      return;
    }

    if (line === "docker images") {
      const keys = Object.keys(state.images);
      return keys.length
        ? print(keys.map((k) => `${k}\tlatest`).join("\n"))
        : print("REPOSITORY\tTAG\n<none>\t\t<none>");
    }

    if (line.startsWith("docker pull")) {
      const parts = line.split(/\s+/);
      const image = parts[2];
      if (!image) return print("Error: missing image name. Try: docker pull nginx");

      setState((s) => ({
        ...s,
        images: { ...s.images, [image]: true },
        pulled: s.pulled || image === "nginx",
      }));

      if (image === "nginx") updateTask("pull", true);

      return print(`Pulling ${image}... done`);
    }

    if (line === "docker ps") {
      const keys = Object.keys(state.containers);
      if (!keys.length) return print("CONTAINER ID   IMAGE   STATUS\n<none>");
      const rows = keys
        .map((k) => {
          const c = state.containers[k];
          return `${k.slice(0, 12)}   ${c.image}   ${c.running ? "Up" : "Exited"}`;
        })
        .join("\n");
      return print(rows);
    }

    if (line.startsWith("docker run")) {
      // docker run --name web -p 8080:80 nginx
      const nameMatch = line.match(/--name\s+([a-zA-Z0-9-_]+)/);
      const portMatch = line.match(/-p\s+([0-9]+:[0-9]+)/);
      const image = line.split(/\s+/).pop();

      if (!nameMatch || !portMatch || !image) {
        return print("Usage: docker run --name web -p 8080:80 nginx");
      }
      const name = nameMatch[1];
      const ports = portMatch[1];

      if (!state.images[image]) {
        return print(`Unable to find image '${image}'. Try: docker pull ${image}`);
      }

      setState((s) => ({
        ...s,
        containers: {
          ...s.containers,
          [name]: {
            image,
            ports,
            running: true,
            logs: [
              `[${new Date().toLocaleTimeString()}] Starting ${name} from ${image}`,
              "App listening on 0.0.0.0:80",
              "💡 flag{docker-stage-1-ok}",
            ],
          },
        },
        ran:
          s.ran ||
          (name === "web" && ports === "8080:80" && image === "nginx"),
      }));

      if (name === "web" && ports === "8080:80" && image === "nginx") {
        updateTask("run", true);
      }

      return print(`Started container '${name}' (ports ${ports})`);
    }

    if (line.startsWith("docker logs")) {
      const parts = line.split(/\s+/);
      const name = parts[2];
      if (!name) return print("Usage: docker logs <name>");
      const c = state.containers[name];
      if (!c) return print(`No such container: ${name}`);

      setState((s) => ({ ...s, sawLogs: true }));
      updateTask("logs", true);

      return print(c.logs.join("\n"));
    }

    return print(`Command not found: ${line}\nType 'help' for help.`);
  };

  return (
    <section className="level-root" style={{ backgroundImage: `url(${dockerBg})` }}>
      <div className="level-wrap">
        <h2>Level 1 — Docker Puzzle</h2>
        <p className="muted">Finish the 3 tasks to unlock the next level.</p>

        <div className="status">
          <Step ok={state.pulled}>Pull nginx</Step>
          <Step ok={state.ran}>Run container: web @ 8080:80</Step>
          <Step ok={state.sawLogs}>Show logs: web</Step>
        </div>

        <div
          className={`terminal ${done ? "celebrate" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          <pre className="history">{history.join("\n")}</pre>
          <form onSubmit={handleSubmit} className="prompt">
            <span className="path">player@escape:~$</span>
            <input
              ref={inputRef}
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </form>
        </div>

        <div className="actions">
          <button className="btn" onClick={() => setHistory([])}>Clear</button>
          <button className="btn" onClick={() => print(helpText)}>Help</button>
          {done && <a className="btn primary" href="/Level2">Next: Level 2</a>}
        </div>
      </div>
    </section>
  );
}

function Step({ ok, children }) {
  return (
    <div className={`step ${ok ? "ok" : ""}`}>
      <span className="dot" />
      {children}
    </div>
  );
}