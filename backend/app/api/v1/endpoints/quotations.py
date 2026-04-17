import secrets
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.quotation import Quotation, QuotationItem
from app.models.user import User
from app.schemas.quotation import QuotationCreate, QuotationRead

router = APIRouter()


@router.get("/", response_model=List[QuotationRead])
def list_quotations(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Quotation).order_by(Quotation.id.desc()).all()


@router.post("/", response_model=QuotationRead, status_code=201)
def create_quotation(payload: QuotationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    data = payload.model_dump()
    items = data.pop("items", [])
    q = Quotation(reference="QT-" + secrets.token_hex(3).upper(), **data)
    for it in items:
        q.items.append(QuotationItem(**it))
    db.add(q); db.commit(); db.refresh(q)
    return q


@router.get("/{qid}", response_model=QuotationRead)
def get_quotation(qid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Quotation, qid)
    if not obj: raise HTTPException(404, "Not found")
    return obj


@router.delete("/{qid}", status_code=204)
def delete_quotation(qid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Quotation, qid)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
