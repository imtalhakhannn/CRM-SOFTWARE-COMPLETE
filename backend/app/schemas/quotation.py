from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class QuotationItemCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    amount: float = 0.0


class QuotationItemRead(QuotationItemCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class QuotationCreate(BaseModel):
    contact_id: int
    issue_date: date
    valid_until: Optional[date] = None
    currency: str = "USD"
    status: str = "draft"
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    items: List[QuotationItemCreate] = []


class QuotationRead(BaseModel):
    id: int
    reference: str
    contact_id: int
    issue_date: date
    valid_until: Optional[date] = None
    currency: str
    status: str
    subtotal: float
    tax: float
    total: float
    notes: Optional[str] = None
    items: List[QuotationItemRead] = []
    model_config = ConfigDict(from_attributes=True)
