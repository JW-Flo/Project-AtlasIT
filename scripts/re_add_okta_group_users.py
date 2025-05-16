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
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    data = resp.json()
    return [evt["target"][0]["id"] for evt in data if "target" in evt]

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
    for uid in removed:
        res = re_add_user(cfg, uid)
        if res.status_code == 204:
            print(f"Re-added user {uid}")
        else:
            print(f"Failed to re-add {uid}: {res.status_code} {res.text}")

if __name__ == "__main__":
    main()
