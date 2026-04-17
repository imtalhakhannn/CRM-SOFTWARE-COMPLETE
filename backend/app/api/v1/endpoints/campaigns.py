from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.contact import Contact
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate

router = APIRouter()


@router.get("/", response_model=List[CampaignRead])
def list_campaigns(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Campaign).order_by(Campaign.id.desc()).all()


@router.post("/", response_model=CampaignRead, status_code=201)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    c = Campaign(**payload.model_dump(), created_by_id=current.id)
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.patch("/{cid}", response_model=CampaignRead)
def update_campaign(cid: int, payload: CampaignUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.get(Campaign, cid)
    if not c: raise HTTPException(404, "Campaign not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return c


@router.delete("/{cid}", status_code=204)
def delete_campaign(cid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.get(Campaign, cid)
    if not c: raise HTTPException(404, "Campaign not found")
    db.delete(c); db.commit()


@router.post("/{cid}/send", response_model=CampaignRead)
def send_campaign(cid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Simulate sending: counts the target audience and marks the campaign as sent.
    A real implementation would queue email/SMS via a provider."""
    c = db.get(Campaign, cid)
    if not c: raise HTTPException(404, "Campaign not found")
    recipients = db.query(Contact).count()
    c.recipient_count = recipients
    c.delivered_count = recipients
    c.status = CampaignStatus.SENT
    c.sent_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(c)
    return c
