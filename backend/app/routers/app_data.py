from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.clear_history import clear_app_history, reset_all_app_data

router = APIRouter(tags=["app"])


class ClearHistoryResponse(BaseModel):
    ok: bool = True
    cleared: dict[str, int]
    message: str = "App history cleared."


@router.post("/app/clear-history", response_model=ClearHistoryResponse)
def post_clear_history(db: Session = Depends(get_db)) -> ClearHistoryResponse:
    try:
        cleared = clear_app_history(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not clear history.") from exc
    return ClearHistoryResponse(cleared=cleared)


@router.post("/app/reset-all-data", response_model=ClearHistoryResponse)
def post_reset_all_data(db: Session = Depends(get_db)) -> ClearHistoryResponse:
    try:
        cleared = reset_all_app_data(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not reset data.") from exc
    return ClearHistoryResponse(
        cleared=cleared,
        message="All app data reset.",
    )
