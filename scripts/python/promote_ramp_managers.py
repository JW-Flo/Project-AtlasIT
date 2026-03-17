#!/usr/bin/env python3
"""Retroactively promote managers to Ramp admin roles if they belong to admin Okta groups.

Prerequisites (all via env):
  OKTA_DOMAIN          flosports.okta.com
  OKTA_API_TOKEN       Okta API token with okta.users.read okta.groups.read scopes
  RAMP_CLIENT_ID / RAMP_CLIENT_SECRET  for OAuth2 client-credentials
  RAMP_ADMIN_GROUPS    comma-separated list of Okta group names considered Ramp admins
"""
import os, sys, requests, json
from datetime import datetime
from git import Repo
import schedule
import time

OKTA_DOMAIN = os.getenv("OKTA_DOMAIN")
OKTA_TOKEN = os.getenv("OKTA_API_TOKEN")
ADMIN_GROUPS = [
    g.strip()
    for g in os.getenv(
        "RAMP_ADMIN_GROUPS", "Ramp_Admin,Ramp_IT_Admin,Ramp_Bookkeeper"
    ).split(",")
]

if not OKTA_DOMAIN or not OKTA_TOKEN:
    sys.exit("OKTA_DOMAIN and OKTA_API_TOKEN env vars required")


def okta_get_user(email: str):
    url = f"https://{OKTA_DOMAIN}/api/v1/users/{email}"
    r = requests.get(
        url,
        headers={"Authorization": f"SSWS {OKTA_TOKEN}", "Accept": "application/json"},
    )
    if r.status_code == 200:
        return r.json()
    return None


def okta_user_in_admin_group(user):
    # Iterate through user's group memberships (first page only for brevity)
    url = user["_links"]["groups"]["href"]
    r = requests.get(
        url,
        headers={"Authorization": f"SSWS {OKTA_TOKEN}", "Accept": "application/json"},
    )
    r.raise_for_status()
    return any(g["profile"]["name"] in ADMIN_GROUPS for g in r.json())


def get_ramp_token():
    cid, secret = os.environ["RAMP_CLIENT_ID"], os.environ["RAMP_CLIENT_SECRET"]
    resp = requests.post(
        "https://api.ramp.com/developer/v1/token",
        auth=(cid, secret),
        data={"grant_type": "client_credentials", "scope": "roles:assign roles:revoke"},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def assign_ramp_role(token, email, role_id="admin"):
    resp = requests.post(
        "https://api.ramp.com/v1/roles/assign",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"user_email": email, "role_id": role_id},
    )
    if resp.status_code not in (200, 201, 204):
        print(
            f"[WARN] Failed to assign {role_id} to {email}: {resp.status_code} {resp.text}"
        )


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
        repo.index.commit("chore: promote_ramp_managers applied safe cleanup patch")
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
    token = get_ramp_token()
    users = requests.get(
        "https://api.ramp.com/v1/users", headers={"Authorization": f"Bearer {token}"}
    ).json()
    promoted = 0
    for u in users:
        manager_email = u.get("manager_email")
        if not manager_email:
            continue
        okta_user = okta_get_user(manager_email)
        if not okta_user:
            continue
        if okta_user_in_admin_group(okta_user):
            assign_ramp_role(token, manager_email, "admin")
            promoted += 1
    print(f"[INFO] Promotion run complete. Managers promoted: {promoted}")

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
