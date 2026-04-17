from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.checkin import CheckIn
from app.models.user import User
from app.schemas.checkin import CheckInCreate, CheckInRead

router = APIRouter()


@router.get("/", response_model=List[CheckInRead])
def list_checkins(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    user_id: Optional[int] = None,
    limit: int = 50,
):
    q = db.query(CheckIn)
    if user_id: q = q.filter(CheckIn.user_id == user_id)
    return q.order_by(CheckIn.check_in_at.desc()).limit(limit).all()


@router.get("/me/current", response_model=Optional[CheckInRead])
def my_open_checkin(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    """Return the user's open check-in (not yet checked-out), or null."""
    return (
        db.query(CheckIn)
        .filter(CheckIn.user_id == current.id, CheckIn.check_out_at.is_(None))
        .order_by(CheckIn.check_in_at.desc())
        .first()
    )


@router.post("/in", response_model=CheckInRead, status_code=201)
def check_in(payload: CheckInCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    open_one = (
        db.query(CheckIn)
        .filter(CheckIn.user_id == current.id, CheckIn.check_out_at.is_(None))
        .first()
    )
    if open_one:
        raise HTTPException(400, "Already checked in")
    c = CheckIn(
        user_id=current.id,
        check_in_at=datetime.now(timezone.utc),
        location=payload.location,
        notes=payload.notes,
    )
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.post("/out", response_model=CheckInRead)
def check_out(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    c = (
        db.query(CheckIn)
        .filter(CheckIn.user_id == current.id, CheckIn.check_out_at.is_(None))
        .order_by(CheckIn.check_in_at.desc())
        .first()
    )
    if not c:
        raise HTTPException(400, "No open check-in to close")
    c.check_out_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(c)
    return c
