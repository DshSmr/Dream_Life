from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.crud import get_ai_review_by_date, list_ai_reviews, upsert_ai_review
from app.database import get_db
from app.models import AIReview
from app.schemas import DailyReviewRead, DailyReviewRequest, MonthlyReviewRead, MonthlyReviewRequest
from app.services.ai_context import build_daily_ai_context, build_monthly_ai_context
from app.services.daily_review import build_daily_review
from app.services.monthly_review import build_monthly_review

router = APIRouter(prefix="/ai", tags=["ai"])

_AI_DB_HINT = (
    "Database schema may be out of date. From the backend folder run: alembic upgrade head "
    "(requires PostgreSQL running and DATABASE_URL set)."
)


def _raise_ai_db_unavailable(exc: Exception) -> None:
    raise HTTPException(status_code=503, detail=_AI_DB_HINT) from exc


def _parse_bound_iso(value: str) -> datetime:
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


def _review_read_from_row(row: AIReview, *, from_storage: bool) -> DailyReviewRead:
    return DailyReviewRead(
        date=row.review_date.isoformat(),
        title=row.title,
        summary=row.summary,
        wins=list(row.wins or []),
        concerns=list(row.concerns or []),
        tomorrowPlan=list(row.tomorrow_plan or []),
        fallback=bool(row.fallback),
        id=row.id,
        created_at=row.created_at if isinstance(row.created_at, datetime) else None,
        from_storage=from_storage,
    )


@router.post("/daily-review", response_model=DailyReviewRead)
def create_daily_review(payload: DailyReviewRequest, db: Session = Depends(get_db)) -> DailyReviewRead:
    """
    Returns a stored review when one already exists for the date (unless `regenerate` is true).
    New generations are upserted — at most one row per calendar day.
    """
    try:
        target_date = payload.review_day or date.today()
        if not payload.regenerate:
            existing = get_ai_review_by_date(db, target_date)
            if existing:
                return _review_read_from_row(existing, from_storage=True)

        context = build_daily_ai_context(db, target_date)
        result, _ = build_daily_review(context)
        row = upsert_ai_review(
            db,
            review_date=target_date,
            title=result["title"],
            summary=result["summary"],
            wins=result["wins"],
            concerns=result["concerns"],
            tomorrow_plan=result["tomorrowPlan"],
            fallback=bool(result.get("fallback", False)),
        )
        return _review_read_from_row(row, from_storage=False)
    except (ProgrammingError, OperationalError) as exc:
        _raise_ai_db_unavailable(exc)



@router.get("/reviews", response_model=list[DailyReviewRead])
def list_stored_reviews(
    db: Session = Depends(get_db),
    limit: int = Query(60, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[DailyReviewRead]:
    try:
        rows = list_ai_reviews(db, limit=limit, offset=offset)
    except (ProgrammingError, OperationalError) as exc:
        _raise_ai_db_unavailable(exc)
    return [_review_read_from_row(r, from_storage=True) for r in rows]


@router.get("/reviews/{review_date}", response_model=DailyReviewRead)
def get_stored_review(review_date: date, db: Session = Depends(get_db)) -> DailyReviewRead:
    try:
        row = get_ai_review_by_date(db, review_date)
    except (ProgrammingError, OperationalError) as exc:
        _raise_ai_db_unavailable(exc)
    if row is None:
        raise HTTPException(status_code=404, detail="No AI review stored for this date.")
    return _review_read_from_row(row, from_storage=True)


@router.post("/monthly-review", response_model=MonthlyReviewRead)
def create_monthly_review(payload: MonthlyReviewRequest, db: Session = Depends(get_db)) -> MonthlyReviewRead:
    """
    On-demand month summary (not persisted). Send the same local month bounds the dashboard uses
    (`monthFrom` / `monthTo` from `getLocalMonthRangeIso`).
    """
    try:
        month_start = _parse_bound_iso(payload.month_from)
        month_end = _parse_bound_iso(payload.month_to)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="Invalid monthFrom / monthTo ISO datetime strings."
        ) from exc
    if month_end <= month_start:
        raise HTTPException(status_code=400, detail="monthTo must be after monthFrom.")
    try:
        context = build_monthly_ai_context(db, month_start, month_end)
        result, _ = build_monthly_review(context)
    except (ProgrammingError, OperationalError) as exc:
        _raise_ai_db_unavailable(exc)
    return MonthlyReviewRead(
        monthLabel=result["monthLabel"],
        title=result["title"],
        summary=result["summary"],
        wins=result["wins"],
        risks=result["risks"],
        patterns=result["patterns"],
        nextMonthFocus=result["nextMonthFocus"],
        fallback=bool(result.get("fallback", False)),
    )
