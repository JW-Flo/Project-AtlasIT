from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime

app = FastAPI()

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

tasks = []


def log_task(name, owner, input_data):
    task = {
        "id": f"task-{len(tasks)+1}",
        "name": name,
        "status": "running",
        "owner": owner,
        "startedAt": datetime.utcnow().isoformat() + "Z",
        "input": input_data,
    }
    tasks.append(task)
    return task


@app.post("/api/onboard")
async def onboard(request: Request):
    data = await request.json()
    log_task("Onboard User", "api-manager", data)
    logging.info(f"[API] Onboarding request: {data}")
    # TODO: Call Okta, Slack, etc. here
    return {"status": "ok", "message": "Onboarding workflow triggered", "input": data}


@app.post("/api/offboard")
async def offboard(request: Request):
    data = await request.json()
    log_task("Offboard User", "api-manager", data)
    logging.info(f"[API] Offboarding request: {data}")
    # TODO: Call Okta, Google Vault, etc. here
    return {"status": "ok", "message": "Offboarding workflow triggered", "input": data}


@app.get("/api/tasks")
async def get_tasks():
    return tasks
