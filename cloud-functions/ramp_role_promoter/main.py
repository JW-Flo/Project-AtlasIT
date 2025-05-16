#!/usr/bin/env python3
import os
import requests

def get_ramp_token():
    client_id = os.environ["RAMP_CLIENT_ID"]
    client_secret = os.environ["RAMP_CLIENT_SECRET"]
    resp = requests.post(
        "https://api.ramp.com/developer/v1/token",
        auth=(client_id, client_secret),
        data={"grant_type":"client_credentials","scope":"roles:assign roles:revoke"}
    )
    resp.raise_for_status()
    return resp.json()["access_token"]

def revoke_ramp_token(token):
    client_id = os.environ["RAMP_CLIENT_ID"]
    client_secret = os.environ["RAMP_CLIENT_SECRET"]
    requests.post(
        "https://api.ramp.com/developer/v1/token/revoke",
        auth=(client_id, client_secret),
        data={"token": token}
    ).raise_for_status()

def assign_role(token, email, role_id):
    requests.post(
        "https://api.ramp.com/v1/roles/assign",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"user_email": email, "role_id": role_id}
    ).raise_for_status()

# map Okta group displayName to Ramp role_id
ROLE_MAP = {
    "Ramp_Admin": "admin",
    "Ramp_IT_Admin": "it_admin",
    "Ramp_Bookkeeper": "bookkeeper"
}

def handler(request):
    event = request.get_json(silent=True)
    if not event:
        return ('Bad Request: no JSON', 400)
    action = event.get('eventType', '')
    # extract target info
    user_email = None
    group_name = None
    for t in event.get('target', []):
        if t.get('type') == 'User':
            user_email = t.get('alternateId')
        if t.get('type') == 'Group':
            group_name = t.get('displayName')
    if not user_email or not group_name:
        return ('Bad Request: missing user or group', 400)
    token = get_ramp_token()
    try:
        if action.endswith('.add'):
            role = ROLE_MAP.get(group_name)
            if role:
                assign_role(token, user_email, role)
        elif action.endswith('.remove'):
            assign_role(token, user_email, 'employee')
        else:
            return ('Event not supported', 400)
    finally:
        revoke_ramp_token(token)
    return ('OK', 200)
