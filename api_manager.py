import asyncio
import os
from typing import Any, Dict, Optional

import requests
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

AUTOMATION_BASE_URL = os.getenv("AUTOMATION_BASE_URL")
AUTOMATION_API_KEY = os.getenv("AUTOMATION_API_KEY")


async def trigger_workflow(workflow_type: str, subject_ref: str, payload: Dict[str, Any]):
    if not AUTOMATION_BASE_URL or not AUTOMATION_API_KEY:
        logging.debug("Automation bridge disabled", extra={"workflow": workflow_type})
        return None

    url = f"{AUTOMATION_BASE_URL.rstrip('/')}/api/v1/workflows/execute"
    headers = {
        "x-api-key": AUTOMATION_API_KEY,
        "Content-Type": "application/json",
    }

    def _send():
        try:
            response = requests.post(
                url,
                headers=headers,
                json={
                    "type": workflow_type,
                    "subjectRef": subject_ref,
                    "overrides": payload,
                },
                timeout=8,
            )
            body: Optional[Dict[str, Any]] = None
            try:
                body = response.json()
            except requests.JSONDecodeError:
                body = None
            return {
                "status": response.status_code,
                "body": body,
            }
        except Exception as exc:  # pragma: no cover - network resilience
            logging.error("Failed to trigger automation workflow", exc_info=exc)
            return None

    return await asyncio.to_thread(_send)


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
    subject = (
        data.get("userId")
        or data.get("user", {}).get("id")
        or data.get("email")
        or "unknown"
    )
    await trigger_workflow("joiner", subject, data)
    return {"status": "ok", "message": "Onboarding workflow triggered", "input": data}


@app.post("/api/offboard")
async def offboard(request: Request):
    data = await request.json()
    log_task("Offboard User", "api-manager", data)
    logging.info(f"[API] Offboarding request: {data}")
    subject = (
        data.get("userId")
        or data.get("user", {}).get("id")
        or data.get("email")
        or "unknown"
    )
    await trigger_workflow("leaver", subject, data)
    return {"status": "ok", "message": "Offboarding workflow triggered", "input": data}


@app.get("/api/tasks")
async def get_tasks():
    return tasks
