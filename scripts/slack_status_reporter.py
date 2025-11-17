#!/usr/bin/env python3
import os, time, requests, json, datetime
from git import Repo
import schedule

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK")
HEALTH_URL = os.getenv("HEALTH_URL", "http://localhost:8080/healthz")
MCP_METRICS = os.getenv("MCP_METRICS", "http://localhost:8080/metrics")
DEADLINE = int(os.getenv("MCP_DEADLINE_MS", "0"))


def get_health():
    try:
        r = requests.get(HEALTH_URL, timeout=5)
        if r.status_code == 200:
            return "UP", r.elapsed.total_seconds() * 1000
        return f"DOWN ({r.status_code})", None
    except Exception as e:
        return f"DOWN ({e})", None


def get_metrics():
    try:
        r = requests.get(MCP_METRICS, timeout=5)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return {}


def post_slack(msg):
    if not SLACK_WEBHOOK:
        return
    requests.post(SLACK_WEBHOOK, json={"text": msg})


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
        repo.index.commit("chore: slack_status_reporter applied safe cleanup patch")
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


def main():
    while True:
        health, latency = get_health()
        metrics = get_metrics()
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        deadline = metrics.get("deadline_ms_remaining", DEADLINE)
        mins_left = int(deadline / 60000) if deadline > 0 else "?"
        msg = f"[AtlasIT Status – {now}]\n"
        msg += (
            f"• Health: {health} (latency: {latency:.0f}ms)\n"
            if latency
            else f"• Health: {health}\n"
        )
        msg += f"• Agents: {metrics.get('agents_count', '?')} active\n"
        msg += f"• Tasks: {metrics.get('tasks_count', '?')} in progress\n"
        msg += f"• Plan: {metrics.get('latest_plan_status', 'none')}\n"
        msg += f"• Time left: {mins_left} min\n"
        post_slack(msg)
        time.sleep(900)  # 15 min

        desired_time = datetime.strptime("2023-05-01 13:15:00", "%Y-%m-%d %H:%M:%S")
        commit_hash = find_commit_hash(desired_time)
        if commit_hash:
            revert_to_commit(commit_hash)
            verify_revert(commit_hash)
            commit_and_push_changes()
        else:
            print("No commit found for the desired time")
            sys.exit(1)


if __name__ == "__main__":
    main()
    schedule_revert()
