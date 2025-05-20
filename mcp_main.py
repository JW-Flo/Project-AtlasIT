import time
import logging
import os
import requests
import subprocess
from together import Together

logging.basicConfig(
    filename="mcp.log", level=logging.INFO, format="%(asctime)s [MCP] %(message)s"
)

REQUIRED_VARS = [
    "JIRA_USER",
    "JIRA_TOKEN",
    "JIRA_URL",
    "CONFLUENCE_USER",
    "CONFLUENCE_TOKEN",
    "CONFLUENCE_URL",
    "TOGETHER_API_KEY",
    "CROWDSTRIKE_CLIENT_ID",
    "CROWDSTRIKE_CLIENT_SECRET",
    "CROWDSTRIKE_API_BASE_URL",
]
missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
if missing:
    logging.error(f"Missing required environment variables: {missing}")
    exit(1)


def get_crowdstrike_token():
    url = f"{os.environ['CROWDSTRIKE_API_BASE_URL'].rstrip('/')}/oauth2/token"
    data = {
        "client_id": os.environ["CROWDSTRIKE_CLIENT_ID"],
        "client_secret": os.environ["CROWDSTRIKE_CLIENT_SECRET"],
    }
    try:
        resp = requests.post(url, data=data)
        resp.raise_for_status()
        token = resp.json().get("access_token")
        logging.info("[CrowdStrike] Token retrieved successfully.")
        return token
    except Exception as e:
        logging.error(f"[CrowdStrike] Token retrieval failed: {e}")
        return None


# In-memory task queue (replace with persistent queue/db for production)
tasks = [
    {
        "id": 1,
        "type": "onboard",
        "jira": "IG-19",
        "confluence": "5102633082",
        "summary": "Setup Terraform backend",
        "details": "Automated onboarding for Terraform backend",
        "status": "pending",
        "agent": "qwen",
    }
]


def update_confluence(page_id, content, title=None):
    conf_url = os.environ.get("CONFLUENCE_URL", "https://flocasts.atlassian.net/wiki")
    conf_user = os.environ.get("CONFLUENCE_USER")
    conf_token = os.environ.get("CONFLUENCE_TOKEN")
    if not conf_user or not conf_token:
        logging.error("Missing Confluence credentials")
        return
    url = f"{conf_url}/rest/api/content/{page_id}"
    auth = (conf_user, conf_token)
    headers = {"Content-Type": "application/json"}
    # Get current version
    try:
        page = requests.get(url, headers=headers, auth=auth).json()
        version = page["version"]["number"] + 1
        body = {
            "version": {"number": version},
            "body": {"storage": {"value": content, "representation": "storage"}},
        }
        if title:
            body["title"] = title
        resp = requests.put(url, json=body, headers=headers, auth=auth)
        resp.raise_for_status()
        logging.info(f"[autoDoc] Confluence updated: {page_id}")
    except Exception as err:
        logging.error(f"[autoDoc] Confluence update failed: {err}")


def agent_qwen(task):
    api_key = os.environ.get("TOGETHER_API_KEY")
    if not api_key:
        logging.error("Missing Together API key")
        return "Agent error: missing Together API key"
    client = Together(api_key=api_key)
    prompt = (
        f"Generate Confluence documentation in valid HTML (Confluence storage format) for the following workflow. "
        f"Title: {task['summary']}\n"
        f"Details: {task['details']}\n"
        f"Output ONLY the HTML body, no markdown, no explanations."
    )
    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen2-VL-72B-Instruct",
            messages=[{"role": "user", "content": prompt}],
        )
        result = response.choices[0].message.content
        logging.info(f"[Qwen Agent] Output: {result}")
        return result
    except Exception as e:
        logging.error(f"Qwen agent call failed: {e}")
        return f"Agent error: {e}"


def smart_commit(task, result):
    # Compose Smart Commit message
    issue_key = task.get("jira", "")
    msg = (
        f"feat: {task['summary']} {issue_key} #comment Automated by MCP: {result} #done"
    )
    try:
        subprocess.run(["git", "add", "-A"], check=True)
        subprocess.run(["git", "commit", "-m", msg], check=True)
        subprocess.run(["git", "push"], check=True)
        logging.info(f"[Smart Commit] Committed and pushed: {msg}")
    except Exception as e:
        logging.error(f"[Smart Commit] Commit or push failed: {e}")


def main():
    logging.info("MCP orchestrator started.")
    while True:
        for task in tasks:
            if task["status"] == "pending":
                logging.info(f"Processing task: {task}")
                if task["agent"] == "qwen":
                    result = agent_qwen(task)
                else:
                    result = f"Task {task['id']} completed by agent {task['agent']}"
                # Update Confluence
                try:
                    update_confluence(
                        task["confluence"], result, title=task.get("summary")
                    )
                except Exception as e:
                    logging.error(f"Confluence update failed: {e}")
                task["status"] = "done"
                logging.info(f"Task {task['id']} marked as done.")
                smart_commit(task, result)
        time.sleep(10)


if __name__ == "__main__":
    main()
