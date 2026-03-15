#!/usr/bin/env python3
import os
import re

import requests

REQUEST_TIMEOUT_SECONDS = 10
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def get_ramp_token(session=requests):
    client_id = os.environ["RAMP_CLIENT_ID"]
    client_secret = os.environ["RAMP_CLIENT_SECRET"]
    resp = session.post(
        "https://api.ramp.com/developer/v1/token",
        auth=(client_id, client_secret),
        data={"grant_type": "client_credentials", "scope": "roles:assign roles:revoke"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def revoke_ramp_token(token, session=requests):
    client_id = os.environ["RAMP_CLIENT_ID"]
    client_secret = os.environ["RAMP_CLIENT_SECRET"]
    session.post(
        "https://api.ramp.com/developer/v1/token/revoke",
        auth=(client_id, client_secret),
        data={"token": token},
        timeout=REQUEST_TIMEOUT_SECONDS,
    ).raise_for_status()


def assign_role(token, email, role_id, session=requests):
    session.post(
        "https://api.ramp.com/v1/roles/assign",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"user_email": email, "role_id": role_id},
        timeout=REQUEST_TIMEOUT_SECONDS,
    ).raise_for_status()

# map Okta group displayName to Ramp role_id
ROLE_MAP = {
    "Ramp_Admin": "admin",
    "Ramp_IT_Admin": "it_admin",
    "Ramp_Bookkeeper": "bookkeeper",
}


def _extract_user_group(event):
    user_email = None
    group_name = None
    for target in event.get("target", []):
        if target.get("type") == "User":
            user_email = target.get("alternateId")
        if target.get("type") == "Group":
            group_name = target.get("displayName")
    return user_email, group_name


def _is_valid_email(value):
    return isinstance(value, str) and EMAIL_RE.match(value) is not None


def handler(request):
    event = request.get_json(silent=True)
    if not isinstance(event, dict):
        return ("Bad Request: no JSON", 400)

    action = event.get("eventType", "")
    user_email, group_name = _extract_user_group(event)
    if isinstance(user_email, str):
        user_email = user_email.strip().lower()

    if not _is_valid_email(user_email) or not isinstance(group_name, str) or not group_name.strip():
        return ("Bad Request: missing or invalid user/group", 400)

    if not (action.endswith(".add") or action.endswith(".remove")):
        return ("Event not supported", 400)
    token = get_ramp_token()
    try:
        if action.endswith(".add"):
            role = ROLE_MAP.get(group_name)
            if role:
                assign_role(token, user_email, role)
        elif action.endswith(".remove"):
            # Secure default: remove privileged role by downscoping to baseline employee role.
            assign_role(token, user_email, "employee")
    finally:
        revoke_ramp_token(token)

    return ("OK", 200)
