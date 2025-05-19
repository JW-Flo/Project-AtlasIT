import os
import json
from flask import Flask, render_template, jsonify, request, redirect, url_for
import sys
import datetime
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from cloud_functions.ingest_alerts import main as ingest_alerts
except ImportError:
    ingest_alerts = None

app = Flask(__name__)

# --- Sensitive Config: All secrets are loaded from environment variables ---
OKTA_DOMAIN = os.environ.get("OKTA_DOMAIN")
OKTA_API_TOKEN = os.environ.get("OKTA_API_TOKEN_SA")
ROCKETCYBER_API_TOKEN = os.environ.get("ROCKETCYBER_API_TOKEN")
DATTO_EDR_TOKEN = os.environ.get("DATTO_EDR_TOKEN")
ZIP_API_KEY = os.environ.get("ZIP_API_KEY")
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID_SANDBOX")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY_SANDBOX")
AWS_REGION = os.environ.get("AWS_REGION")
LIVE_DATA_URL = os.environ.get(
    "IGNITE_LIVE_API"
)  # e.g., https://ignite-api.example.com

# Sample data for demo purposes
SAMPLE_ALERTS = [
    {
        "id": "alert-001",
        "timestamp": "2025-05-09T08:30:00Z",
        "severity": "high",
        "source": "Datto EDR",
        "title": "Suspicious PowerShell Activity",
        "description": "PowerShell command with base64 encoded payload detected",
        "affected_device": "DESKTOP-8A7B2C3",
        "status": "open",
    },
    {
        "id": "alert-002",
        "timestamp": "2025-05-09T07:45:00Z",
        "severity": "medium",
        "source": "RocketCyber",
        "title": "Multiple Failed Login Attempts",
        "description": "10+ failed login attempts detected from IP 192.168.1.155",
        "affected_device": "LAPTOP-9X8Y7Z6",
        "status": "open",
    },
    {
        "id": "alert-003",
        "timestamp": "2025-05-08T23:15:00Z",
        "severity": "critical",
        "source": "Datto EDR",
        "title": "Potential Ransomware Activity",
        "description": "Multiple file encryption operations detected on network share",
        "affected_device": "SERVER-DC01",
        "status": "investigating",
    },
]

# Sample contractor data for demo purposes
SAMPLE_CONTRACTORS = [
    {
        "id": "C001",
        "name": "Jane Smith",
        "email": "jane.smith@contractor.com",
        "department": "IT Development",
        "project": "Cloud Migration",
        "start_date": "2024-12-15",
        "end_date": "2025-06-15",
        "access_level": "Standard",
        "status": "Active",
        "days_remaining": 37,
    },
    {
        "id": "C002",
        "name": "Michael Johnson",
        "email": "michael.j@techpartners.com",
        "department": "Security",
        "project": "SOC Implementation",
        "start_date": "2025-01-10",
        "end_date": "2025-05-15",
        "access_level": "Elevated",
        "status": "Active",
        "days_remaining": 6,
    },
    {
        "id": "C003",
        "name": "David Williams",
        "email": "d.williams@consultants.io",
        "department": "Data Science",
        "project": "ML Model Training",
        "start_date": "2025-03-01",
        "end_date": "2025-05-10",
        "access_level": "Standard",
        "status": "Expiring Soon",
        "days_remaining": 1,
    },
    {
        "id": "C004",
        "name": "Sarah Johnson",
        "email": "s.johnson@contractor.com",
        "department": "IT Development",
        "project": "API Integration",
        "start_date": "2025-02-15",
        "end_date": "2025-05-08",
        "access_level": "Standard",
        "status": "Expired",
        "days_remaining": -1,
    },
]

CONTRACTOR_NOT_FOUND = "Contractor not found"


@app.route("/")
def index():
    return render_template("dashboard.html")


@app.route("/contractors")
def contractors():
    return render_template("contractors.html")


@app.route("/contractor/<contractor_id>")
def contractor_detail(contractor_id):
    if LIVE_DATA_URL:
        try:
            r = requests.get(f"{LIVE_DATA_URL}/contractor/{contractor_id}", timeout=5)
            if r.status_code == 200:
                return render_template("contractor_detail.html", contractor=r.json())
        except Exception:
            pass
    contractor = next((c for c in SAMPLE_CONTRACTORS if c["id"] == contractor_id), None)
    if contractor:
        return render_template("contractor_detail.html", contractor=contractor)
    return CONTRACTOR_NOT_FOUND, 404


@app.route("/api/alerts")
def get_alerts():
    if LIVE_DATA_URL:
        try:
            r = requests.get(f"{LIVE_DATA_URL}/alerts", timeout=5)
            if r.status_code == 200:
                return jsonify(r.json())
        except Exception:
            pass  # fallback
    # Fall back to sample data
    try:
        # real_data = ingest_alerts(None)
        # return jsonify(real_data)
        return jsonify(SAMPLE_ALERTS)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stats")
def get_stats():
    # Calculate some basic stats for the dashboard
    stats = {
        "total_alerts": len(SAMPLE_ALERTS),
        "critical_alerts": sum(
            1 for alert in SAMPLE_ALERTS if alert["severity"] == "critical"
        ),
        "high_alerts": sum(1 for alert in SAMPLE_ALERTS if alert["severity"] == "high"),
        "medium_alerts": sum(
            1 for alert in SAMPLE_ALERTS if alert["severity"] == "medium"
        ),
        "low_alerts": sum(1 for alert in SAMPLE_ALERTS if alert["severity"] == "low"),
        "open_alerts": sum(1 for alert in SAMPLE_ALERTS if alert["status"] == "open"),
        "investigating_alerts": sum(
            1 for alert in SAMPLE_ALERTS if alert["status"] == "investigating"
        ),
        "closed_alerts": sum(
            1 for alert in SAMPLE_ALERTS if alert["status"] == "closed"
        ),
    }
    return jsonify(stats)


@app.route("/api/contractors")
def get_contractors():
    if LIVE_DATA_URL:
        try:
            r = requests.get(f"{LIVE_DATA_URL}/contractors", timeout=5)
            if r.status_code == 200:
                return jsonify(r.json())
        except Exception:
            pass  # fallback
    return jsonify(SAMPLE_CONTRACTORS)


@app.route("/api/contractor-stats")
def get_contractor_stats():
    stats = {
        "total_contractors": len(SAMPLE_CONTRACTORS),
        "active": sum(1 for c in SAMPLE_CONTRACTORS if c["status"] == "Active"),
        "expiring_soon": sum(
            1 for c in SAMPLE_CONTRACTORS if c["status"] == "Expiring Soon"
        ),
        "expired": sum(1 for c in SAMPLE_CONTRACTORS if c["status"] == "Expired"),
        "by_department": {},
    }

    # Count contractors by department
    for contractor in SAMPLE_CONTRACTORS:
        dept = contractor["department"]
        if dept not in stats["by_department"]:
            stats["by_department"][dept] = 0
        stats["by_department"][dept] += 1

    return jsonify(stats)


@app.route("/api/extend-contract", methods=["POST"])
def extend_contract():
    # In a real app, this would update a database
    contractor_id = request.json.get("id")
    days = request.json.get("days", 30)

    for contractor in SAMPLE_CONTRACTORS:
        if contractor["id"] == contractor_id:
            # Parse the end date and add days
            end_date = datetime.datetime.strptime(contractor["end_date"], "%Y-%m-%d")
            new_end_date = end_date + datetime.timedelta(days=days)
            contractor["end_date"] = new_end_date.strftime("%Y-%m-%d")
            contractor["days_remaining"] += days
            contractor["status"] = "Active"
            return jsonify({"success": True, "contractor": contractor})

    return jsonify({"success": False, "message": CONTRACTOR_NOT_FOUND}), 404


@app.route("/api/offboard-contractor", methods=["POST"])
def offboard_contractor():
    # In a real app, this would update a database and trigger offboarding procedures
    contractor_id = request.json.get("id")

    for i, contractor in enumerate(SAMPLE_CONTRACTORS):
        if contractor["id"] == contractor_id:
            contractor["status"] = "Offboarded"
            return jsonify({"success": True})

    return jsonify({"success": False, "message": CONTRACTOR_NOT_FOUND}), 404


@app.route("/cicd")
def cicd_dashboard():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>CI/CD Pipeline Monitor</title>
        <style>
            body { font-family: sans-serif; background: #181c20; color: #f3f3f3; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 40px auto; background: #23272b; border-radius: 8px; box-shadow: 0 2px 8px #0003; padding: 32px; }
            h1 { color: #7ed957; }
            pre { background: #111; color: #7ed957; padding: 12px; border-radius: 6px; }
            .section { margin-bottom: 32px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>CI/CD Pipeline Monitor</h1>
            <div class="section">
                <h2>Status Metrics</h2>
                <pre id="metrics">Loading...</pre>
            </div>
            <div class="section">
                <h2>Task List</h2>
                <pre id="tasks">Loading...</pre>
            </div>
            <div class="section">
                <button id="pauseBtn">Pause</button>
                <button id="resumeBtn">Resume</button>
            </div>
        </div>
        <script>
        async function fetchMetrics() {
            const r = await fetch('/api/cicd/metrics');
            document.getElementById('metrics').textContent = JSON.stringify(await r.json(), null, 2);
        }
        async function fetchTasks() {
            const r = await fetch('/api/cicd/tasks');
            document.getElementById('tasks').textContent = JSON.stringify(await r.json(), null, 2);
        }
        async function fetchState() {
            const r = await fetch('/api/cicd/state');
            const data = await r.json();
            document.title = data.paused ? 'MCP PAUSED' : 'MCP RUNNING';
        }
        document.getElementById('pauseBtn').onclick = () => fetch('/api/cicd/pause', {method:'POST'});
        document.getElementById('resumeBtn').onclick = () => fetch('/api/cicd/resume', {method:'POST'});
        function refresh() {
            fetchMetrics();
            fetchTasks();
            fetchState();
        }
        setInterval(refresh, 5000);
        refresh();
        </script>
    </body>
    </html>
    """


@app.route("/api/cicd/metrics")
def cicd_metrics():
    try:
        r = requests.get(
            os.environ.get("MCP_METRICS", "http://localhost:8080/metrics"), timeout=5
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/api/cicd/tasks")
def cicd_tasks():
    try:
        r = requests.get(
            os.environ.get("MCP_TASKS", "http://localhost:8080/task/list"), timeout=5
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/api/cicd/state")
def cicd_state():
    try:
        r = requests.get(
            os.environ.get("MCP_STATE", "http://localhost:8080/state"), timeout=5
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/api/cicd/pause", methods=["POST"])
def cicd_pause():
    try:
        r = requests.post(
            os.environ.get("MCP_PAUSE", "http://localhost:8080/control/pause"),
            timeout=5,
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/api/cicd/resume", methods=["POST"])
def cicd_resume():
    try:
        r = requests.post(
            os.environ.get("MCP_RESUME", "http://localhost:8080/control/resume"),
            timeout=5,
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
