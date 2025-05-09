import os
import requests

def main():
    """
    Ingest alerts from Datto EDR and RocketCyber APIs.
    All secrets/configs are loaded from environment variables for cloud deployment.
    """
    datto_token = os.environ.get("DATTO_EDR_TOKEN")
    rocketcyber_token = os.environ.get("ROCKETCYBER_API_TOKEN")

    alerts = []
    if datto_token:
        alerts.append({"source": "Datto EDR", "status": "stubbed"})
    if rocketcyber_token:
        alerts.append({"source": "RocketCyber", "status": "stubbed"})

    return {"alerts": alerts}

if __name__ == "__main__":
    print(main())
