#!/usr/bin/env python3
import os, time, requests, json, datetime

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


def main():
    while True:
        health, latency = get_health()
        metrics = get_metrics()
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        deadline = metrics.get("deadline_ms_remaining", DEADLINE)
        mins_left = int(deadline / 60000) if deadline > 0 else "?"
        msg = f"[Project Ignite Status – {now}]\n"
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


if __name__ == "__main__":
    main()
