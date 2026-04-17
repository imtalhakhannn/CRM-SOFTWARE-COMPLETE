from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    body: str
    sender: str = "user"


class MessageRead(BaseModel):
    id: int
    body: str
    sender: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    subject: str
    channel: str = "email"
    contact_id: Optional[int] = None


class ConversationRead(BaseModel):
    id: int
    subject: str
    channel: str
    contact_id: Optional[int] = None
    user_id: Optional[int] = None
    messages: List[MessageRead] = []
    model_config = ConfigDict(from_attributes=True)
