from fastapi.testclient import TestClient

from app.main import app


def test_clear_history_endpoint(monkeypatch):
    monkeypatch.setattr(
        "app.routers.app_data.clear_app_history",
        lambda _db: {
            "events": 12,
            "focus_sessions": 3,
            "pomodoro_sessions": 1,
            "finance_transactions": 5,
            "ai_reviews": 2,
            "daily_snapshots": 4,
            "recommendation_feedback": 0,
            "tasks_reset": 2,
        },
    )

    client = TestClient(app)
    response = client.post("/app/clear-history")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["cleared"]["events"] == 12


def test_reset_all_data_endpoint(monkeypatch):
    monkeypatch.setattr(
        "app.routers.app_data.reset_all_app_data",
        lambda _db: {
            "events": 5,
            "tasks": 3,
            "goals": 2,
            "cleaning_zones": 4,
        },
    )

    client = TestClient(app)
    response = client.post("/app/reset-all-data")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["cleared"]["goals"] == 2
