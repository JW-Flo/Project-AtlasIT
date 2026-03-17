from fastapi import FastAPI, Request
from onboarding_agent import onboarding_agent

app = FastAPI()


@app.post("/onboard")
async def onboard(request: Request):
    user_info = await request.json()
    result = onboarding_agent(user_info)
    return {"result": result}
