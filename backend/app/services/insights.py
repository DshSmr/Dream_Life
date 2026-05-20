import json
from collections.abc import Mapping
from urllib import error, request


def build_rule_based_daily_insight(summary: Mapping[str, int | float | str], focus_minutes: int) -> dict:
    tasks_completed = int(summary["tasks_completed"])
    balance_delta = float(summary["balance_delta"])
    cleanings_done = int(summary["cleanings_done"])

    has_activity = (
        tasks_completed > 0
        or cleanings_done > 0
        or focus_minutes >= 15
        or balance_delta != 0
    )

    if not has_activity:
        headline = "A calm day"
        summary_text = "Things felt relatively calm today."
    else:
        headline = "Small steps today"
        reflection_parts: list[str] = []
        if tasks_completed > 0 and cleanings_done > 0:
            reflection_parts.append(
                "You moved through a few small tasks today and kept home routines going."
            )
        elif tasks_completed > 0:
            reflection_parts.append("You moved through a few small tasks today.")
        elif cleanings_done > 0:
            reflection_parts.append("Home routines had some gentle attention today.")
        elif focus_minutes >= 15:
            reflection_parts.append("There was room for quiet focus today.")
        else:
            reflection_parts.append("Today unfolded gently, one small moment at a time.")

        detail_parts: list[str] = []
        if tasks_completed > 0:
            detail_parts.append(
                f"{tasks_completed} task{'s' if tasks_completed != 1 else ''} completed"
            )
        if focus_minutes >= 15:
            detail_parts.append(f"{focus_minutes} min of focus")
        if cleanings_done > 0:
            detail_parts.append(
                f"{cleanings_done} home care moment{'s' if cleanings_done != 1 else ''}"
            )
        summary_text = reflection_parts[0]
        if detail_parts:
            summary_text = f"{summary_text} {' · '.join(detail_parts)}"

    recommendations: list[str] = []
    if focus_minutes < 60:
        recommendations.append(
            "If tomorrow feels open, a short focus block can be enough."
        )
    if tasks_completed == 0:
        recommendations.append("One small task tomorrow can help the day feel lighter.")
    if cleanings_done == 0:
        recommendations.append("A single home care moment can keep the rhythm gentle.")
    if balance_delta < 0:
        recommendations.append("A quiet look at spending tomorrow may feel grounding.")
    if not recommendations:
        recommendations.append("The same gentle rhythm can carry into tomorrow.")

    return {
        "date": str(summary["date"]),
        "headline": headline,
        "summary": summary_text,
        "recommendations": recommendations,
    }


def build_openai_daily_insight(
    summary: Mapping[str, int | float | str], focus_minutes: int, api_key: str, model: str
) -> dict:
    prompt = {
        "date": str(summary["date"]),
        "tasks_completed": int(summary["tasks_completed"]),
        "focus_minutes": focus_minutes,
        "cleanings_done": int(summary["cleanings_done"]),
        "income_total": float(summary["income_total"]),
        "expense_total": float(summary["expense_total"]),
        "balance_delta": float(summary["balance_delta"]),
    }
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a calm, reflective life companion (Dream Life tone). "
                    "Write emotionally safe, non-judgmental copy. Reflection first; numbers second if needed. "
                    "Avoid productivity scoring, urgency, or analytics jargon. "
                    "Return strict JSON with keys: headline (string), summary (string), recommendations (array of 1-4 strings)."
                ),
            },
            {
                "role": "user",
                "content": f"Create a daily insight from this data: {json.dumps(prompt)}",
            },
        ],
        "temperature": 0.3,
    }
    req = request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with request.urlopen(req, timeout=20) as response:
        body = json.loads(response.read().decode("utf-8"))
    content = body["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    return {
        "date": str(summary["date"]),
        "headline": parsed.get("headline", "Daily insight"),
        "summary": parsed.get("summary", "No summary generated."),
        "recommendations": parsed.get("recommendations", []),
    }


def build_daily_insight(
    summary: Mapping[str, int | float | str],
    focus_minutes: int,
    provider: str = "rule_based",
    openai_api_key: str | None = None,
    openai_model: str = "gpt-4o-mini",
) -> dict:
    if provider == "openai" and openai_api_key:
        try:
            return build_openai_daily_insight(
                summary=summary,
                focus_minutes=focus_minutes,
                api_key=openai_api_key,
                model=openai_model,
            )
        except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError):
            # Fallback keeps the app stable when external AI API fails.
            return build_rule_based_daily_insight(summary=summary, focus_minutes=focus_minutes)
    return build_rule_based_daily_insight(summary=summary, focus_minutes=focus_minutes)
