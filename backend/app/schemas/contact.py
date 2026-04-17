from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.contact import ContactType, ProspectRating


class ContactBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    type: ContactType = ContactType.LEAD
    rating: Optional[ProspectRating] = None
    source: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    passport_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    notes: Optional[str] = None
    branch_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    type: Optional[ContactType] = None
    rating: Optional[ProspectRating] = None
    source: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    passport_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    notes: Optional[str] = None
    branch_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class ContactRead(ContactBase):
    id: int
    full_name: str
    model_config = ConfigDict(from_attributes=True)


class ContactList(BaseModel):
    items: List[ContactRead]
    total: int
