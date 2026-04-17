from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.contact import Contact, ContactType
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactList, ContactRead, ContactUpdate

router = APIRouter()


@router.get("/", response_model=ContactList)
def list_contacts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    type: Optional[ContactType] = None,
    search: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
):
    q = db.query(Contact)
    if type:
        q = q.filter(Contact.type == type)
    if assigned_to_id:
        q = q.filter(Contact.assigned_to_id == assigned_to_id)
    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                Contact.first_name.ilike(like),
                Contact.last_name.ilike(like),
                Contact.email.ilike(like),
                Contact.phone.ilike(like),
            )
        )
    total = q.count()
    items = q.order_by(Contact.id.desc()).offset(skip).limit(limit).all()
    return ContactList(items=[ContactRead.model_validate(i) for i in items], total=total)


@router.post("/", response_model=ContactRead, status_code=201)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(contact_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(contact, k, v)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()


@router.post("/{contact_id}/convert", response_model=ContactRead)
def convert_contact(
    contact_id: int,
    to_type: ContactType,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.type = to_type
    db.commit()
    db.refresh(contact)
    return contact
