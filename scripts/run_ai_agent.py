#!/usr/bin/env python3
import os, sys
import logging
from openai import OpenAI
from github import Github
import requests

# — Setup logging —
logging.basicConfig(level=logging.DEBUG,
                    format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("agent")

# — Load system prompt from shared context —
CTX = os.path.expanduser(
    "/Users/jw/Projects/Project-Ignite/context/agent-context.txt"
)
with open(CTX) as f:
    SYSTEM_PROMPT = f.read()

# — Grab all credentials from environment (CI or local) —
OPENAI_API_KEY        = os.environ["OPENAI_API_KEY"]
GH_PAT                = os.environ["GH_PAT"]
OKTA_API_TOKEN_SA     = os.environ.get("OKTA_API_TOKEN_SA", "")
OKTA_DOMAIN           = os.environ.get("OKTA_DOMAIN", "")
RAMP_CLIENT_ID        = os.environ.get("RAMP_CLIENT_ID", "")
RAMP_CLIENT_SECRET    = os.environ.get("RAMP_CLIENT_SECRET", "")

# — Initialize clients —
client = OpenAI(api_key=OPENAI_API_KEY)
gh     = Github(GH_PAT)

# — Repo fetch function (if needed) —
REPO_NAME = "JW-Flo/Project-Ignite"
repo      = gh.get_repo(REPO_NAME)
def fetch_repo_files(path=""):
    contents, files = repo.get_contents(path), []
    while contents:
        item = contents.pop(0)
        if item.type == "dir":
            contents.extend(repo.get_contents(item.path))
        else:
            files.append(f"### {item.path}\n```{item.decoded_content.decode()}```")
    return "\n\n".join(files)

# Function to interact with Cloudflare API
def setup_cloudflare_worker(api_token, account_id, worker_name, script):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/javascript"
    }
    response = requests.put(url, headers=headers, data=script)
    if response.status_code == 200:
        logger.info("Cloudflare Worker deployed successfully.")
    else:
        logger.error(f"Failed to deploy Cloudflare Worker: {response.text}")

# Function to update GitHub Actions workflows
def update_workflow_file(repo, file_path, new_content):
    file = repo.get_contents(file_path)
    repo.update_file(file.path, "Update workflow file", new_content, file.sha)
    logger.info("Workflow file updated successfully.")

# — Main —
def main():
    resp = client.chat.completions.create(
        model=os.environ.get("MODEL", "gpt-4o"),
        messages=[
            {"role":"system", "content": SYSTEM_PROMPT},
            {"role":"user",   "content":"Begin project orchestration"}
        ],
        function_call="auto"
    )
    logger.info("Received response")
    print(resp.choices[0].message.content)

    # Example: Deploy a Cloudflare Worker
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    worker_name = "example-worker"
    script = "console.log('Hello, Cloudflare!');"
    setup_cloudflare_worker(api_token, account_id, worker_name, script)

    # Example: Update a workflow file
    workflow_path = ".github/workflows/cloudflare-workers.yml"
    new_workflow_content = """name: Updated Workflow

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Run tests
        run: npm test
"""
    update_workflow_file(repo, workflow_path, new_workflow_content)

    logger.info("AI agent tasks completed.")

if __name__=="__main__":
    main()
