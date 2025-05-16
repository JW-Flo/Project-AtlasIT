#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

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

if __name__ == "__main__":
    main()
