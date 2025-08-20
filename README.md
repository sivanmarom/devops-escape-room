
DevOps Escape Room (Work in Progress)

This repository contains an early prototype of a gamified DevOps Escape Room.
The idea is to create an interactive, puzzle-like environment where users can progress through different levels, each one simulating a real DevOps challenge.

At this stage, the project is still in its early development phase. Only the first two levels are implemented, focusing on Docker basics and Kubernetes configuration. More levels (Terraform, CI/CD pipelines, monitoring, scaling, etc.) are planned as the project evolves.

⸻

🎯 Purpose

The goal of this project is to:
	•	Learn and practice DevOps technologies in a hands-on and engaging way.
	•	Build a strong foundation in Docker, Kubernetes, and beyond.
	•	Experiment with full-stack development (React frontend + FastAPI backend).
	•	Showcase growth and progress in both technical and DevOps skills.

⸻

🚀 Current Features
	•	Level 1 — Docker CLI Puzzle
A simulated terminal where the player must complete tasks such as docker pull, docker run, and docker logs.
	•	Level 2 — Kubernetes YAML Challenge
A minimal Deployment YAML is provided, and the player must make it production-ready by adding replicas, probes, and resource limits.
Includes server-side validation and progress saving.
	•	Progress Tracking
Each player has a unique ID, and their progress is stored in Redis, so it persists across sessions.

⸻

🧱 Tech Stack
	•	Frontend: React (Vite) + modern CSS styling
	•	Backend: FastAPI (Python)
	•	Database: Redis (progress tracking)
	•	Infra (Local): Docker Compose for running dependencies

⸻

⚙️ Getting Started

1. Run Redis

docker run -d -p 6379:6379 redis:alpine

2. Start the Backend

cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 5000

3. Start the Frontend

cd frontend
npm install
npm run dev

Frontend runs on: http://localhost:5173
Backend runs on: http://localhost:5000

⸻

📌 Roadmap
	•	Level 1: Docker puzzle
	•	Level 2: Kubernetes deployment puzzle
	•	Level 3: Terraform basics
	•	Level 4: CI/CD pipeline debugging
	•	Level 5: Monitoring and alerts
	•	Level 6: Scaling & Chaos Engineering

⸻

📝 Note

This is an early-stage personal learning project.
I am still exploring best practices in full-stack development and DevOps, and this repository is part of my journey to learn, practice, and improve. The project will grow step by step, and feedback is always welcome.

⸻

