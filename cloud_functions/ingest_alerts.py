import os
import requests
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _get_session():
    """Create a requests session with retry/backoff logic."""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        method_whitelist=["GET", "POST"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def fetch_alerts_from_datto(token):
    """Fetch alerts from Datto EDR API with retries."""
    url = "https://api.datto.com/alerts"
    headers = {"Authorization": f"Bearer {token}"}
    session = _get_session()
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as err:
        logger.error(f"Datto API request failed: {err}")
        raise
    return response.json()

def fetch_alerts_from_rocketcyber(token):
    """Fetch alerts from RocketCyber API with retries."""
    url = "https://api.rocketcyber.com/alerts"
    headers = {"Authorization": f"Bearer {token}"}
    session = _get_session()
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as err:
        logger.error(f"RocketCyber API request failed: {err}")
        raise
    return response.json()

def main():
    """
    Ingest alerts from Datto EDR and RocketCyber APIs.
    All secrets/configs are loaded from environment variables for cloud deployment.
    """
    datto_token = os.environ.get("DATTO_EDR_TOKEN")
    rocketcyber_token = os.environ.get("ROCKETCYBER_API_TOKEN")

    alerts = []
    if datto_token:
        try:
            datto_alerts = fetch_alerts_from_datto(datto_token)
            alerts.extend(datto_alerts)
        except Exception as e:
            print(f"Error fetching Datto alerts: {e}")

    if rocketcyber_token:
        try:
            rocketcyber_alerts = fetch_alerts_from_rocketcyber(rocketcyber_token)
            alerts.extend(rocketcyber_alerts)
        except Exception as e:
            print(f"Error fetching RocketCyber alerts: {e}")

    return {"alerts": alerts}

if __name__ == "__main__":
    print(main())

def ingest_alerts(request):
    """HTTP Cloud Function entrypoint for ingesting alerts."""
    from flask import jsonify
    try:
        result = main()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
