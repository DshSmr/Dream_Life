"""GET /habits/detected — habit detection API."""

from fastapi.testclient import TestClient

from app.main import app


def test_habits_detected_returns_200():
    client = TestClient(app)
    response = client.get("/habits/detected?days=45")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
