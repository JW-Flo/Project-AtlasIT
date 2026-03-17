#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv
from git import Repo
from datetime import datetime
import schedule
import time

def load_config():
    load_dotenv()
    return {
        "OKTA_DOMAIN": os.getenv("OKTA_DOMAIN"),
        "API_TOKEN": os.getenv("OKTA_API_TOKEN"),
        "GROUP_ID": os.getenv("GROUP_ID"),
        "START_TIME": os.getenv("START_TIME"),
        "END_TIME": os.getenv("END_TIME"),
    }

def get_removed_users(cfg):
    url = f"https://{cfg['OKTA_DOMAIN']}/api/v1/logs"
    headers = {"Authorization": f"SSWS {cfg['API_TOKEN']}", "Accept": "application/json"}
    params = {"filter": (
        f"eventType eq \"group.user_membership.remove\" "
        f"and target.id eq \"{cfg['GROUP_ID']}\" "
        f"and published gt \"{cfg['START_TIME']}\" "
        f"and published lt \"{cfg['END_TIME']}\""
    )}
    removed = []
    next_url = url
    while next_url:
        resp = requests.get(next_url, headers=headers, params=params if next_url == url else None)
        resp.raise_for_status()
        data = resp.json()
        for evt in data:
            user = None
            for t in evt.get("target", []):
                if t.get("type") == "User":
                    user = {"id": t.get("id"), "email": t.get("alternateId")}
            if user:
                removed.append(user)
        # Okta pagination: look for 'next' link
        next_url = None
        if 'link' in resp.headers:
            for link in resp.headers['link'].split(','):
                if 'rel="next"' in link:
                    import re
                    match = re.search(r'<([^>]+)>; rel="next"', link)
                    if match:
                        next_url = match.group(1)
                    break
    return removed

def re_add_user(cfg, user_id):
    url = f"https://{cfg['OKTA_DOMAIN']}/api/v1/groups/{cfg['GROUP_ID']}/users/{user_id}"
    headers = {"Authorization": f"SSWS {cfg['API_TOKEN']}", "Accept": "application/json", "Content-Type": "application/json"}
    resp = requests.put(url, headers=headers)
    return resp

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
        repo.index.commit("chore: re_add_okta_group_users applied safe cleanup patch")
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
    cfg = load_config()
    removed = get_removed_users(cfg)
    if not removed:
        print("No users removed in the specified timeframe.")
        return
    print(f"Found {len(removed)} users removed from the group.")
    for user in removed:
        res = re_add_user(cfg, user["id"])
        if res.status_code == 204:
            print(f"Re-added user {user['email']} (id: {user['id']})")
        else:
            print(f"Failed to re-add {user['email']} (id: {user['id']}): {res.status_code} {res.text}")

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
