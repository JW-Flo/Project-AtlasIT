import pytest
from cloud_functions.ingest_alerts import (
    fetch_alerts_from_datto,
    fetch_alerts_from_rocketcyber,
)
from unittest.mock import patch, MagicMock


def _mock_response(alerts):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"alerts": alerts}
    return mock_resp


def test_basic_setup():
    """Basic test to ensure testing infrastructure works."""
    assert True


@patch("requests.Session.get")
def test_fetch_alerts_from_datto(mock_get):
    """Test fetching alerts from Datto API with mocked session."""
    sample = [{"id": 1, "alert": "Test Alert"}]
    mock_get.return_value = _mock_response(sample)
    result = fetch_alerts_from_datto("fake_token")
    assert result == sample


@patch("requests.Session.get")
def test_fetch_alerts_from_rocketcyber(mock_get):
    """Test fetching alerts from RocketCyber API with mocked session."""
    sample = [{"id": 2, "alert": "Another Test Alert"}]
    mock_get.return_value = _mock_response(sample)
    result = fetch_alerts_from_rocketcyber("fake_token")
    assert result == sample


@patch("os.environ.get", side_effect=lambda key: None)
@patch("cloud_functions.ingest_alerts.fetch_alerts_from_datto", return_value=[])
@patch("cloud_functions.ingest_alerts.fetch_alerts_from_rocketcyber", return_value=[])
def test_main_no_tokens(mock_rc, mock_dt, mock_env):
    """Test main function with no tokens set (returns empty list)."""
    from cloud_functions.ingest_alerts import main

    result = main()
    assert result == {"alerts": []}


# Add more specific tests based on ingest_alerts.py functionality
