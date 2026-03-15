import importlib.util
from pathlib import Path
from unittest.mock import MagicMock


MODULE_PATH = Path(__file__).parent / "main.py"
_spec = importlib.util.spec_from_file_location("ramp_role_promoter_main", MODULE_PATH)
module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(module)


class _Request:
    def __init__(self, payload):
        self.payload = payload

    def get_json(self, silent=False):
        return self.payload


def _event(event_type="group.user_membership.add", email="user@example.com", group="Ramp_Admin"):
    return {
        "eventType": event_type,
        "target": [
            {"type": "User", "alternateId": email},
            {"type": "Group", "displayName": group},
        ],
    }


def test_handler_rejects_invalid_email_before_token_ops(monkeypatch):
    get_token = MagicMock(return_value="fake")
    monkeypatch.setattr(module, "get_ramp_token", get_token)

    response = module.handler(_Request(_event(email="not-an-email")))

    assert response == ("Bad Request: missing or invalid user/group", 400)
    get_token.assert_not_called()


def test_handler_assigns_role_for_add(monkeypatch):
    monkeypatch.setattr(module, "get_ramp_token", MagicMock(return_value="token"))
    assign_role = MagicMock()
    monkeypatch.setattr(module, "assign_role", assign_role)
    monkeypatch.setattr(module, "revoke_ramp_token", MagicMock())

    response = module.handler(_Request(_event(email="USER@EXAMPLE.COM ")))

    assert response == ("OK", 200)
    assign_role.assert_called_once_with("token", "user@example.com", "admin")


def test_handler_rejects_unsupported_event_before_token_ops(monkeypatch):
    get_token = MagicMock(return_value="fake")
    monkeypatch.setattr(module, "get_ramp_token", get_token)

    response = module.handler(_Request(_event(event_type="group.user_membership.unknown")))

    assert response == ("Event not supported", 400)
    get_token.assert_not_called()
