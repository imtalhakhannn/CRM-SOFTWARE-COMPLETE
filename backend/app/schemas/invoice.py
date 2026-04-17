from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.invoice import InvoiceStatus


class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    amount: float = 0.0


class InvoiceItemRead(InvoiceItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PaymentBase(BaseModel):
    paid_on: date
    amount: float
    method: str = "cash"
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int
    invoice_id: int
    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    contact_id: int
    application_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    currency: str = "USD"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    items: List[InvoiceItemBase] = []


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceRead(BaseModel):
    id: int
    reference: str
    contact_id: int
    application_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    currency: str
    status: InvoiceStatus
    subtotal: float
    tax: float
    total: float
    amount_paid: float
    notes: Optional[str] = None
    items: List[InvoiceItemRead] = []
    payments: List[PaymentRead] = []
    model_config = ConfigDict(from_attributes=True)
