import pytest
from cloud_functions.ingest_alerts import fetch_alerts_from_datto, fetch_alerts_from_rocketcyber
import requests
from unittest.mock import patch

def test_basic_setup():
    """Basic test to ensure testing infrastructure works"""
    assert True

def test_fetch_alerts_from_datto():
    """Test fetching alerts from Datto API."""
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"id": 1, "alert": "Test Alert"}]
        result = fetch_alerts_from_datto("fake_token")
        assert result == [{"id": 1, "alert": "Test Alert"}]

def test_fetch_alerts_from_rocketcyber():
    """Test fetching alerts from RocketCyber API."""
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"id": 2, "alert": "Another Test Alert"}]
        result = fetch_alerts_from_rocketcyber("fake_token")
        assert result == [{"id": 2, "alert": "Another Test Alert"}]

def test_main_no_tokens():
    """Test main function with no tokens set."""
    with patch("os.environ.get", side_effect=lambda key: None):
        from cloud_functions.ingest_alerts import main
        result = main()
        assert result == {"alerts": []}

# Add more specific tests based on ingest_alerts.py functionality
