#!/usr/bin/env python3
"""
Agent Fixer: reads AI context, asks OpenAI for a cautious unified-diff patch,
applies it via the system 'patch' tool, commits & pushes back to GitHub.
"""
import os, sys, logging, subprocess
from datetime import datetime
import schedule
import time

# Dependency checks
try:
    from dotenv import load_dotenv
except ImportError:
    print(
        "[ERROR] Missing required module: python-dotenv. Please install with `pip install python-dotenv`.",
        file=sys.stderr,
    )
    exit(1)
try:
    from openai import OpenAI
except ImportError:
    print(
        "[ERROR] Missing required module: openai. Please install with `pip install openai`.",
        file=sys.stderr,
    )
    exit(1)
try:
    from git import Repo
except ImportError:
    print(
        "[ERROR] Missing required module: gitpython. Please install with `pip install gitpython`.",
        file=sys.stderr,
    )
    exit(1)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def apply_patch(patch_text):
    p = subprocess.run(
        ["patch", "-p1"], input=patch_text, text=True, capture_output=True
    )
    if p.returncode != 0:
        logging.error("❌ patch failed:\n%s", p.stderr)
        sys.exit(1)
    logging.info("⚙️  patch applied successfully")


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
        logging.info(f"Reverted to commit {commit_hash}")
    except Exception as e:
        logging.error(f"Failed to revert to commit {commit_hash}: {e}")
        sys.exit(1)


def verify_revert(commit_hash):
    repo = Repo(os.getcwd())
    current_commit = repo.head.commit.hexsha
    if current_commit == commit_hash:
        logging.info(f"Revert to commit {commit_hash} verified")
    else:
        logging.error(f"Revert to commit {commit_hash} not verified")
        sys.exit(1)


def commit_and_push_changes():
    repo = Repo(os.getcwd())
    try:
        repo.git.add(all=True)
        repo.index.commit("chore: agent_fixer applied safe cleanup patch")
        repo.remote("origin").push(repo.active_branch.name)
        logging.info("Changes committed and pushed successfully")
    except Exception as e:
        logging.error(f"Git push failed: {e}")
        sys.exit(1)


def schedule_revert():
    schedule_time = "01:15"
    schedule.every().day.at(schedule_time).do(main)
    while True:
        schedule.run_pending()
        time.sleep(1)


def main():
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY") or ""
    if not api_key:
        logging.error("OPENAI_API_KEY is not set")
        sys.exit(1)

    ctx_file = os.path.join(os.getcwd(), "context", ".ai-agent-context.txt")
    if not os.path.exists(ctx_file):
        logging.error(f"Context file missing at {ctx_file}")
        sys.exit(1)
    context = open(ctx_file).read()

    try:
        repo = Repo(os.getcwd())
    except Exception as e:
        logging.error(f"Git repo error: {e}")
        sys.exit(1)
    if repo.bare:
        logging.error("Not a git repository")
        sys.exit(1)
    branch = repo.active_branch.name
    logging.info(f"Current branch: {branch}")

    try:
        client = OpenAI(api_key=api_key)
    except Exception as e:
        logging.error(f"OpenAI client error: {e}")
        sys.exit(1)
    system_prompt = (
        "You are the Ignite Autonomous Agent, a Senior DevOps AI Engineer. "
        "Generate a unified-diff patch that only makes safe changes:\n"
        "- Back up then remove any stale .github/workflows/*.yml not referenced.\n"
        "- Ensure all .sh scripts start with '#!/usr/bin/env bash' + 'set -euo pipefail'.\n"
        "- Move any wrangler.toml or wrangler.jsonc not matching dispatch config to backup/.\n"
        "- Move any index.js at repo root not using 'env.dispatcher' to backup/.\n"
        "- Add clear start/finish logging to CI helper scripts.\n"
        "Output **only** the diff patch."
    )
    user_prompt = f"Branch: {branch}\n\nContext:\n{context}"

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
        )
        patch = resp.choices[0].message.content
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        sys.exit(1)

    if not patch.lstrip().startswith("diff"):
        logging.error("No valid diff returned:\n%s", patch)
        sys.exit(1)

    apply_patch(patch)

    desired_time = datetime.strptime("2023-05-01 13:15:00", "%Y-%m-%d %H:%M:%S")
    commit_hash = find_commit_hash(desired_time)
    if commit_hash:
        revert_to_commit(commit_hash)
        verify_revert(commit_hash)
        commit_and_push_changes()
    else:
        logging.error("No commit found for the desired time")
        sys.exit(1)

    logging.info("✅ Safe patch applied and pushed successfully!")


if __name__ == "__main__":
    main()
    schedule_revert()
