"""Agents = Users with role=agent. Simple wrapper list endpoint."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.contact import Contact
from app.models.user import User, UserRole
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/", response_model=List[UserRead])
def list_agents(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(User).filter(User.role == UserRole.AGENT).order_by(User.full_name).all()


@router.get("/stats")
def agents_with_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """For each agent, return contact count assigned."""
    rows = (
        db.query(User.id, User.full_name, User.email, func.count(Contact.id))
        .outerjoin(Contact, Contact.assigned_to_id == User.id)
        .filter(User.role == UserRole.AGENT)
        .group_by(User.id)
        .order_by(func.count(Contact.id).desc())
        .all()
    )
    return [{"id": i, "full_name": n, "email": e, "contact_count": c} for i, n, e, c in rows]
