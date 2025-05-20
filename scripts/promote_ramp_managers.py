#!/usr/bin/env python3
"""Retroactively promote managers to Ramp admin roles if they belong to admin Okta groups.

Prerequisites (all via env):
  OKTA_DOMAIN          flosports.okta.com
  OKTA_API_TOKEN       Okta API token with okta.users.read okta.groups.read scopes
  RAMP_CLIENT_ID / RAMP_CLIENT_SECRET  for OAuth2 client-credentials
  RAMP_ADMIN_GROUPS    comma-separated list of Okta group names considered Ramp admins
"""
import os, sys, requests, json

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


if __name__ == "__main__":
    main()
