from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CheckInCreate(BaseModel):
    location: Optional[str] = None
    notes: Optional[str] = None


class CheckInRead(BaseModel):
    id: int
    user_id: int
    check_in_at: datetime
    check_out_at: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
