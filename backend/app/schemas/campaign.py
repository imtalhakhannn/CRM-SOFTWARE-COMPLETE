from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.campaign import CampaignStatus


class CampaignBase(BaseModel):
    name: str
    type: str = "email"
    status: CampaignStatus = CampaignStatus.DRAFT
    subject: Optional[str] = None
    content: Optional[str] = None
    target_filter: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    target_filter: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class CampaignRead(CampaignBase):
    id: int
    sent_at: Optional[datetime] = None
    recipient_count: int
    delivered_count: int
    opened_count: int
    created_by_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
