import os, sys
import subprocess
import schedule
import time
from datetime import datetime

try:
    from together import Together
except ImportError:
    print(
        "[ERROR] Missing required module: together. Please install with `pip install together`.",
        file=sys.stderr,
    )
    exit(1)

api_key = os.getenv("TOGETHER_API_KEY")
if not api_key:
    print("[ERROR] TOGETHER_API_KEY must be set in environment.", file=sys.stderr)
    exit(1)

client = Together(api_key=api_key)

try:
    response = client.code_interpreter.run(
        code='print("Welcome to Together Code Interpreter!")', language="python"
    )
    print(f"Status: {response.data.status}")
    for output in response.data.outputs:
        print(f"{output.type}: {output.data}")
except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    exit(1)


def find_commit_hash(desired_time):
    p = subprocess.run(
        ["git", "log", "--pretty=format:%H %ct"],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git log failed: {p.stderr}", file=sys.stderr)
        exit(1)
    for line in p.stdout.splitlines():
        commit_hash, commit_time = line.split()
        commit_time = datetime.fromtimestamp(int(commit_time))
        if commit_time <= desired_time:
            return commit_hash
    return None


def revert_to_commit(commit_hash):
    p = subprocess.run(
        ["git", "revert", "--no-commit", commit_hash],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git revert failed: {p.stderr}", file=sys.stderr)
        exit(1)
    print(f"Reverted to commit {commit_hash}")


def verify_revert(commit_hash):
    p = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git rev-parse failed: {p.stderr}", file=sys.stderr)
        exit(1)
    current_commit = p.stdout.strip()
    if current_commit == commit_hash:
        print(f"Revert to commit {commit_hash} verified")
    else:
        print(f"[ERROR] Revert to commit {commit_hash} not verified", file=sys.stderr)
        exit(1)


def commit_and_push_changes():
    p = subprocess.run(
        ["git", "add", "."],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git add failed: {p.stderr}", file=sys.stderr)
        exit(1)
    p = subprocess.run(
        ["git", "commit", "-m", "Revert to the desired state"],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git commit failed: {p.stderr}", file=sys.stderr)
        exit(1)
    p = subprocess.run(
        ["git", "push"],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        print(f"[ERROR] git push failed: {p.stderr}", file=sys.stderr)
        exit(1)
    print("Changes committed and pushed successfully")


def schedule_revert():
    schedule_time = "01:15"
    schedule.every().day.at(schedule_time).do(main)
    while True:
        schedule.run_pending()
        time.sleep(1)


def main():
    desired_time = datetime.strptime("2023-05-01 13:15:00", "%Y-%m-%d %H:%M:%S")
    commit_hash = find_commit_hash(desired_time)
    if commit_hash:
        revert_to_commit(commit_hash)
        verify_revert(commit_hash)
        commit_and_push_changes()
    else:
        print("[ERROR] No commit found for the desired time", file=sys.stderr)
        exit(1)


if __name__ == "__main__":
    main()
    schedule_revert()
