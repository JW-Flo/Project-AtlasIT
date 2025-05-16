#!/usr/bin/env python3
import os, sys
import logging
from openai import OpenAI
from github import Github

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

if __name__=="__main__":
    main()
