#!/usr/bin/env python3
import os, sys
from dotenv import load_dotenv
from git import Repo
from datetime import datetime
import schedule
import time

# — Load environment variables and context —
load_dotenv()
CTX_PATH = os.environ.get("CTX_PATH") or os.path.expanduser(
    "~/autonomous_agent_fix/context/agent-context.txt"
)
with open(CTX_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()

# — Import original agent logic —
sys.path.insert(0, os.path.dirname(__file__))
import autonomous_ai_agent_module as original

# — Override original prompt and run —
if hasattr(original, "SYSTEM_PROMPT"):
    original.SYSTEM_PROMPT = SYSTEM_PROMPT
if hasattr(original, "main"):
    original.main()
else:
    print("Error: original agent has no main()", file=sys.stderr)
    sys.exit(1)


def find_commit_hash(desired_time):
    repo = Repo(os.getcwd())
    commits = list(repo.iter_commits('main'))
    for commit in commits:
        commit_time = datetime.fromtimestamp(commit.committed_date)
        if commit_time <= desired_time:
            return commit.hexsha
    return None


def revert_to_commit(commit_hash):
    repo = Repo(os.getcwd())
    try:
        repo.git.revert(commit_hash, no_edit=True)
        print(f"Reverted to commit {commit_hash}")
    except Exception as e:
        print(f"Failed to revert to commit {commit_hash}: {e}")
        sys.exit(1)


def verify_revert(commit_hash):
    repo = Repo(os.getcwd())
    current_commit = repo.head.commit.hexsha
    if current_commit == commit_hash:
        print(f"Revert to commit {commit_hash} verified")
    else:
        print(f"Revert to commit {commit_hash} not verified")
        sys.exit(1)


def commit_and_push_changes():
    repo = Repo(os.getcwd())
    try:
        repo.git.add(all=True)
        repo.index.commit("chore: run_ai_agent applied safe cleanup patch")
        repo.remote("origin").push(repo.active_branch.name)
        print("Changes committed and pushed successfully")
    except Exception as e:
        print(f"Git push failed: {e}")
        sys.exit(1)


def schedule_revert():
    schedule_time = "01:15"
    schedule.every().day.at(schedule_time).do(main)
    while True:
        schedule.run_pending()
        time.sleep(1)
