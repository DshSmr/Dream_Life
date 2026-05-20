"""Transactional data wipe — activity-only or full app content reset."""

from __future__ import annotations

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models import (
    AIReview,
    CleaningZone,
    DailySnapshot,
    Event,
    FinanceTransaction,
    FocusSession,
    Goal,
    PomodoroSession,
    RecommendationFeedback,
    Task,
)
from app.services.realtime import publish_app_update


def _clear_logged_activity(db: Session) -> dict[str, int]:
    counts: dict[str, int] = {}
    counts["events"] = db.scalar(select(func.count()).select_from(Event)) or 0
    counts["focus_sessions"] = db.scalar(select(func.count()).select_from(FocusSession)) or 0
    counts["pomodoro_sessions"] = db.scalar(select(func.count()).select_from(PomodoroSession)) or 0
    counts["finance_transactions"] = (
        db.scalar(select(func.count()).select_from(FinanceTransaction)) or 0
    )
    counts["ai_reviews"] = db.scalar(select(func.count()).select_from(AIReview)) or 0
    counts["daily_snapshots"] = db.scalar(select(func.count()).select_from(DailySnapshot)) or 0
    counts["recommendation_feedback"] = (
        db.scalar(select(func.count()).select_from(RecommendationFeedback)) or 0
    )

    db.execute(delete(Event))
    db.execute(delete(FocusSession))
    db.execute(delete(PomodoroSession))
    db.execute(delete(FinanceTransaction))
    db.execute(delete(AIReview))
    db.execute(delete(DailySnapshot))
    db.execute(delete(RecommendationFeedback))
    return counts


def clear_app_history(db: Session) -> dict[str, int]:
    """
    Remove logged activity. Keeps goals, cleaning zones, and task list (resets completed → todo).
    """
    try:
        counts = _clear_logged_activity(db)
        db.execute(update(CleaningZone).values(last_cleaned_at=None))
        reset_tasks = db.execute(
            update(Task)
            .where(Task.status == "done")
            .values(status="todo", completed_at=None)
        )
        counts["tasks_reset"] = reset_tasks.rowcount or 0
        db.commit()
        publish_app_update("history_cleared")
        return counts
    except Exception:
        db.rollback()
        raise


def reset_all_app_data(db: Session) -> dict[str, int]:
    """
    Remove all app content for a demo reset. Keeps nothing in the DB except empty tables.
    Theme, language, and preferences remain on the client.
    """
    try:
        counts = _clear_logged_activity(db)
        counts["tasks"] = db.scalar(select(func.count()).select_from(Task)) or 0
        counts["goals"] = db.scalar(select(func.count()).select_from(Goal)) or 0
        counts["cleaning_zones"] = db.scalar(select(func.count()).select_from(CleaningZone)) or 0

        db.execute(delete(Task))
        db.execute(delete(Goal))
        db.execute(delete(CleaningZone))

        db.commit()
        publish_app_update("all_data_reset")
        return counts
    except Exception:
        db.rollback()
        raise
