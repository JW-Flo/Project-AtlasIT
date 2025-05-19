from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

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


@app.post("/api/onboard")
async def onboard(request: Request):
    data = await request.json()
    logging.info(f"[API] Onboarding request: {data}")
    # TODO: Call Okta, Slack, etc. here
    return {"status": "ok", "message": "Onboarding workflow triggered", "input": data}


@app.post("/api/offboard")
async def offboard(request: Request):
    data = await request.json()
    logging.info(f"[API] Offboarding request: {data}")
    # TODO: Call Okta, Google Vault, etc. here
    return {"status": "ok", "message": "Offboarding workflow triggered", "input": data}
