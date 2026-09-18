from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_alert_history_valid_limit():
    response = client.get("/api/alerts?limit=10")

    assert response.status_code == 200

    data = response.json()

    assert "count" in data
    assert "alerts" in data
    assert isinstance(data["alerts"], list)


def test_alert_history_invalid_limit():
    response = client.get("/api/alerts?limit=0")

    assert response.status_code == 422


def test_alert_history_limit_too_high():
    response = client.get("/api/alerts?limit=101")

    assert response.status_code == 422
