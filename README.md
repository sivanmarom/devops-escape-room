# DevOps Escape Room (Work in Progress)

[![Build Status](https://img.shields.io/badge/CI-GitHub%20Actions-planned)]()
[![Dockerized](https://img.shields.io/badge/Docker-compose-blue)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)]()

An early prototype of a **gamified DevOps Escape Room**.  
The project creates an interactive, puzzle-like environment where users solve challenges that simulate real-world DevOps tasks.

---

## 🎯 Purpose
- Learn and practice DevOps technologies in a hands-on, engaging way.  
- Build a strong foundation in **Docker**, **Kubernetes**, and beyond.  
- Experiment with **full-stack development** (React frontend + FastAPI backend).  
- Showcase growth and progress in technical and DevOps skills.  

---

## 🚀 Current Features
- **Level 1 — Docker CLI Puzzle**  
  A simulated terminal where the player must complete tasks such as `docker pull`, `docker run`, and `docker logs`.  

- **Level 2 — Kubernetes YAML Challenge**  
  A minimal Deployment YAML is provided. The player must make it production-ready by adding replicas, probes, and resource limits.  
  Includes **server-side validation** and **progress saving**.  

- **Progress Tracking**  
  Each player has a unique ID, and their progress is stored in **Redis**, persisting across sessions.  

---

## 🧱 Tech Stack
- **Frontend:** React (Vite) + modern CSS  
- **Backend:** FastAPI (Python)  
- **Database:** Redis (progress tracking)  
- **Infra (Local):** Docker Compose  

---

## ⚙️ Getting Started

### 1. Run Redis
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend → http://localhost:5173  
- Backend → http://localhost:5000  

---

## 🔄 Reset Progress (for testing)

To reset a player's progress, use the following `curl` commands.  
Replace `PLAYER_ID` with your actual playerId.

### Reset Level 1
```bash
curl -X POST "http://localhost:5000/api/progress/update"   -H "Content-Type: application/json"   -d '{"playerId":"PLAYER_ID","level":1,"task":"pull","completed":false}'

curl -X POST "http://localhost:5000/api/progress/update"   -H "Content-Type: application/json"   -d '{"playerId":"PLAYER_ID","level":1,"task":"run","completed":false}'

curl -X POST "http://localhost:5000/api/progress/update"   -H "Content-Type: application/json"   -d '{"playerId":"PLAYER_ID","level":1,"task":"logs","completed":false}'
```

### Reset Level 2
```bash
curl -X POST "http://localhost:5000/api/progress/update"   -H "Content-Type: application/json"   -d '{"playerId":"PLAYER_ID","level":2,"task":"validYaml","completed":false}'
```

---

## 🗺️ Roadmap
- **Level 3:** Terraform basics  
- **Level 4:** CI/CD pipeline debugging  
- **Level 5:** Monitoring and alerts  
- **Level 6:** Scaling & Chaos Engineering  

---

## 📝 Note
This is an **early-stage personal learning project**.  
I am still exploring best practices in **full-stack development** and **DevOps**.  
The project will evolve step by step, and feedback is always welcome.  

---

## 📄 License
MIT

## 💬 Contact
- 📧 [Sivmarom@gmail.com](mailto:Sivmarom@gmail.com)  
- 🔗 [LinkedIn](https://www.linkedin.com/in/sivan-marom/)  
- 💻 [GitHub](https://github.com/sivanmarom)  
