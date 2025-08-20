import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

import { getOrCreatePlayerId } from "../utils/playerId";
import bg from "../assets/room-bg.jpg";
import doorPng from "../assets/door-double.png";

export default function Landing() {
  const [doorOpen, setDoorOpen] = useState(false);
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const toggleDoor = () => setDoorOpen(v => !v);
  const handleEnter = () => navigate("/Level1");

  useEffect(() => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const pid = getOrCreatePlayerId();
  setPlayerId(pid);

  // רישום שחקן בשקט; לא חוסם UI
  fetch(`${API_BASE}/api/player/init?playerId=${pid}`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) console.warn("Player init failed:", res);
    })
    .catch(err => console.warn("Player init error:", err));
}, []);

  return (
    <section className="landing" style={{ backgroundImage: `url(${bg})` }}>
      <div className="landing__veil" />

      <div className="landing__hero">
        <h1>DevOps Escape Room</h1>
        <p>Solve Docker → K8s → Terraform puzzles and escape!</p>
      </div>

      <div className="door">
        <div
          className={`door__frame ${doorOpen ? "is-open" : ""}`}
          style={{ "--door-img": `url(${doorPng})` }}
        >
          {/* שני עלים */}
          <div className="door__leaf door__leaf--left" />
          <div className="door__leaf door__leaf--right" />

          {/* הכפתור שמופיע מאחורי הדלת כשנפתחת */}
          <button className="btn btn--enter" onClick={handleEnter}>
            Enter → Level 1
          </button>
        </div>

        {/* הכפתור של פתיחה/סגירה – נשאר מתחת לדלת */}
        <div className="door__controls">
          <button className="btn" onClick={toggleDoor}>
            {doorOpen ? "Close the Door" : "Open the Door"}
          </button>
        </div>
      </div>
    </section>
  );
}