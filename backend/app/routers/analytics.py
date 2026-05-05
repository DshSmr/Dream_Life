from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud import get_daily_insight, get_daily_summary
from app.database import get_db
from app.schemas import DailyInsightRead, DailySummaryRead

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/daily-summary", response_model=DailySummaryRead)
def daily_summary_endpoint(
    db: Session = Depends(get_db),
    target_date: date = Query(default_factory=date.today),
):
    return get_daily_summary(db, target_date=target_date)


@router.get("/daily-insight", response_model=DailyInsightRead)
def daily_insight_endpoint(
    db: Session = Depends(get_db),
    target_date: date = Query(default_factory=date.today),
):
    return get_daily_insight(db, target_date=target_date)
