# backend/main.py
import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from redis import Redis
from urllib.parse import urlparse
from dotenv import load_dotenv
import yaml
load_dotenv()

app = FastAPI(title="DevOps Escape Room API")

# CORS רחב לפיתוח
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# --- Redis client ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ru = urlparse(REDIS_URL)
r = Redis(host=ru.hostname, port=ru.port, db=int((ru.path or "/0").strip("/")), password=ru.password, decode_responses=True)

# -------- Models --------
class InitRes(BaseModel):
    ok: bool
    playerId: str

class ProgressUpdate(BaseModel):
    playerId: str
    level: int
    task: str      # "pull" | "run" | "logs"
    completed: bool

# --- הוסף/עדכן את המודל ---
class ProgressRes(BaseModel):
    playerId: str
    level: int
    tasks: dict
    done: bool
    yaml: str | None = None   # ← חדש: נחזיר גם YAML אם יש
# -------- Health / Welcome --------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/welcome")
def welcome():
    return {"message": "Welcome to the DevOps Escape Room"}

# -------- Player init (id מגיע מהלקוח) --------
@app.get("/api/player/init", response_model=InitRes)
def player_init(playerId: str = Query(..., min_length=3)):
    # נשמור hash בסיסי על שחקן אם לא קיים
    key = f"player:{playerId}"
    if not r.exists(key):
        r.hset(key, mapping={"createdAt": "now"})
    return InitRes(ok=True, playerId=playerId)

# -------- Progress: get --------
@app.get("/api/progress", response_model=ProgressRes)
def get_progress(playerId: str, level: int):
    pkey = f"progress:{playerId}:level:{level}"
    default = {
        "pull": "0", "run": "0", "logs": "0",   # level 1
        "validYaml": "0",                      # level 2
    }
    tasks = default.copy()
    if r.exists(pkey):
        data = r.hgetall(pkey)
        tasks.update(data)
    tasks_bool = {k: (v == "1" or v is True) for k, v in tasks.items()}

    # האם השלב הושלם?
    done = all(tasks_bool.values()) if level == 1 else tasks_bool.get("validYaml", False)

    # ← חדש: נחפש YAML שמור ונחזירו
    yml = r.hget(pkey, "yaml") if r.exists(pkey) else None

    return ProgressRes(playerId=playerId, level=level, tasks=tasks_bool, done=done, yaml=yml)

@app.post("/api/progress/update", response_model=ProgressRes)
def update_progress(body: ProgressUpdate):
    pkey = f"progress:{body.playerId}:level:{body.level}"
    r.hset(pkey, body.task, "1" if body.completed else "0")
    data = r.hgetall(pkey)
    # normalize
    tasks_bool = {k: (v == "1" or v is True) for k, v in data.items()}
    done = all(tasks_bool.values()) if body.level == 1 else tasks_bool.get("validYaml", False)
    return ProgressRes(playerId=body.playerId, level=body.level, tasks=tasks_bool, done=done)

# -------- Level 2: Validate YAML --------
class L2Body(BaseModel):
    playerId: str
    yaml: str

class L2Res(BaseModel):
    ok: bool
    errors: list[str]
    checks: dict

# למעלה בקובץ, ודאי שיש:
# import yaml

@app.post("/api/level/2/validate", response_model=L2Res)
def level2_validate(body: L2Body):
    errors: list[str] = []
    checks = {
        "apiVersion": False,
        "kindDeployment": False,
        "metadataName": False,
        "replicas": False,
        "image": False,
        "probes": False,
        "resources": False,
    }

    # פרסינג בטוח של YAML
    try:
        doc = yaml.safe_load(body.yaml) or {}
    except Exception as e:
        return L2Res(ok=False, errors=[f"YAML parse error: {e}"], checks=checks)

    # 1) apiVersion = apps/v1
    if isinstance(doc, dict) and doc.get("apiVersion") == "apps/v1":
        checks["apiVersion"] = True
    else:
        errors.append("apiVersion must be apps/v1")

    # 2) kind = Deployment
    if doc.get("kind") == "Deployment":
        checks["kindDeployment"] = True
    else:
        errors.append("kind must be Deployment")

    # 3) metadata.name
    meta = doc.get("metadata") or {}
    if isinstance(meta, dict) and meta.get("name"):
        checks["metadataName"] = True
    else:
        errors.append("metadata.name is required")

    # 4) replicas >= 2
    replicas = (doc.get("spec") or {}).get("replicas")
    if isinstance(replicas, int) and replicas >= 2:
        checks["replicas"] = True
    else:
        errors.append("spec.replicas must be >= 2")

    # 5) containers[0].image
    tpl = (doc.get("spec") or {}).get("template") or {}
    podspec = tpl.get("metadata") and tpl.get("spec") or tpl.get("spec") or {}
    containers = podspec.get("containers") or []
    c0 = containers[0] if isinstance(containers, list) and containers else {}
    if isinstance(c0, dict) and c0.get("image"):
        checks["image"] = True
    else:
        errors.append("containers[0].image is required")

    # 6) readinessProbe + livenessProbe
    has_probes = isinstance(c0, dict) and c0.get("readinessProbe") and c0.get("livenessProbe")
    if has_probes:
        checks["probes"] = True
    else:
        errors.append("readinessProbe and livenessProbe are required")

    # 7) resources.requests/limits (cpu,memory)
    res = c0.get("resources") if isinstance(c0, dict) else None
    def _has(obj, k1, k2):
        return isinstance(obj, dict) and isinstance(obj.get(k1), dict) and obj[k1].get(k2)

    has_resources = (
        _has(res, "requests", "cpu") and
        _has(res, "requests", "memory") and
        _has(res, "limits", "cpu") and
        _has(res, "limits", "memory")
    )
    if has_resources:
        checks["resources"] = True
    else:
        errors.append("resources.requests/limits (cpu,memory) are required")

    ok = all(checks.values())

    # אם עברו כל הבדיקות — נשמור ב-Redis: גם דגל success וגם את ה-YAML
    if body.playerId:
        pkey = f"progress:{body.playerId}:level:2"
        if ok:
            r.hset(pkey, mapping={"validYaml": "1", "yaml": body.yaml})
        # אם תרצי לשמור טיוטה גם כשלא תקין, הוסיפי:
        # else:
        #     r.hset(pkey, "yaml", body.yaml)

    return L2Res(ok=ok, errors=errors, checks=checks)