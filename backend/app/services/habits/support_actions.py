"""Suggested actions for auto-detected habits (drive navigation, API mutations, daily plan)."""

from __future__ import annotations

from typing import Any


def enrich_detected_habit(row: dict[str, Any]) -> dict[str, Any]:
    """
    Adds `suggestedActions` and strips detector-only `supportMeta`.
    Each habit maps to one primary support action (navigate | mutation | plan_item).
    """
    meta = dict(row.pop("supportMeta", {}) or {})
    hid = str(row.get("id") or "")
    actions: list[dict[str, Any]] = []

    if hid == "habit-morning-focus":
        actions.append(
            {
                "id": f"{hid}-start-focus-25",
                "habitId": hid,
                "label": "Try an earlier focus block tomorrow",
                "type": "mutation",
                "target": "focus_session_start",
                "payload": {"label": "Morning focus (25m)"},
            }
        )

    elif hid == "habit-cleaning-consistency":
        actions.append(
            {
                "id": f"{hid}-daily-plan-clean",
                "habitId": hid,
                "label": "Add a small cleaning pass to today",
                "type": "plan_item",
                "target": "daily_plan",
                "payload": {
                    "planItemId": "habit-support-cleaning-rhythm",
                    "title": "A small cleaning pass today",
                    "category": "cleaning",
                    "priority": "medium",
                },
            }
        )

    elif hid.startswith("habit-spend-"):
        cat = str(meta.get("topExpenseCategory") or "spending").strip() or "spending"
        actions.append(
            {
                "id": f"{hid}-review-expenses",
                "habitId": hid,
                "label": f"Review “{cat}” expenses",
                "type": "navigate",
                "target": "/finance/dashboard",
                "payload": {"category": cat},
            }
        )

    elif hid.startswith("habit-task-hour-"):
        peak = int(meta.get("peakHourUtc") or 14)
        actions.append(
            {
                "id": f"{hid}-plan-before-window",
                "habitId": hid,
                "label": "Start with one important task in the morning",
                "type": "plan_item",
                "target": "daily_plan",
                "payload": {
                    "planItemId": "habit-support-task-rhythm",
                    "title": "One important task for the morning",
                    "category": "task",
                    "priority": "high",
                },
            }
        )

    row["suggestedActions"] = actions
    return row
