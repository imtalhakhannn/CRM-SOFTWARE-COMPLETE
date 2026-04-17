from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate, ConversationRead, MessageCreate, MessageRead,
)

router = APIRouter()


@router.get("/", response_model=List[ConversationRead])
def list_conversations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    contact_id: Optional[int] = None,
):
    q = db.query(Conversation)
    if contact_id: q = q.filter(Conversation.contact_id == contact_id)
    return q.order_by(Conversation.id.desc()).all()


@router.post("/", response_model=ConversationRead, status_code=201)
def create_conversation(payload: ConversationCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    obj = Conversation(**payload.model_dump(), user_id=current.id)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.get("/{cid}", response_model=ConversationRead)
def get_conversation(cid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Conversation, cid)
    if not obj: raise HTTPException(404, "Not found")
    return obj


@router.post("/{cid}/messages", response_model=MessageRead, status_code=201)
def add_message(cid: int, payload: MessageCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    conv = db.get(Conversation, cid)
    if not conv: raise HTTPException(404, "Conversation not found")
    msg = Message(conversation_id=cid, **payload.model_dump())
    db.add(msg); db.commit(); db.refresh(msg)
    return msg
