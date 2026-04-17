import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus, Payment
from app.models.user import User
from app.schemas.invoice import (
    InvoiceCreate, InvoiceRead, InvoiceUpdate, PaymentCreate, PaymentRead,
)

router = APIRouter()


def _ref() -> str:
    return "INV-" + secrets.token_hex(3).upper()


def _recalc_invoice(inv: Invoice) -> None:
    inv.amount_paid = sum((p.amount for p in inv.payments), 0.0)
    if inv.amount_paid >= inv.total and inv.total > 0:
        inv.status = InvoiceStatus.PAID
    elif inv.amount_paid > 0:
        inv.status = InvoiceStatus.PARTIALLY_PAID


@router.get("/invoices/", response_model=List[InvoiceRead])
def list_invoices(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: Optional[InvoiceStatus] = None,
    contact_id: Optional[int] = None,
):
    q = db.query(Invoice)
    if status: q = q.filter(Invoice.status == status)
    if contact_id: q = q.filter(Invoice.contact_id == contact_id)
    return q.order_by(Invoice.id.desc()).all()


@router.post("/invoices/", response_model=InvoiceRead, status_code=201)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    data = payload.model_dump()
    items = data.pop("items", [])
    inv = Invoice(reference=_ref(), **data)
    for it in items:
        inv.items.append(InvoiceItem(**it))
    db.add(inv); db.commit(); db.refresh(inv)
    return inv


@router.get("/invoices/{iid}", response_model=InvoiceRead)
def get_invoice(iid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    inv = db.get(Invoice, iid)
    if not inv: raise HTTPException(404, "Invoice not found")
    return inv


@router.patch("/invoices/{iid}", response_model=InvoiceRead)
def update_invoice(iid: int, payload: InvoiceUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    inv = db.get(Invoice, iid)
    if not inv: raise HTTPException(404, "Invoice not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(inv, k, v)
    db.commit(); db.refresh(inv)
    return inv


@router.delete("/invoices/{iid}", status_code=204)
def delete_invoice(iid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    inv = db.get(Invoice, iid)
    if not inv: raise HTTPException(404, "Invoice not found")
    db.delete(inv); db.commit()


@router.post("/invoices/{iid}/payments", response_model=PaymentRead, status_code=201)
def add_payment(iid: int, payload: PaymentCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    inv = db.get(Invoice, iid)
    if not inv: raise HTTPException(404, "Invoice not found")
    pay = Payment(invoice_id=iid, **payload.model_dump())
    db.add(pay); db.flush()
    db.refresh(inv)
    _recalc_invoice(inv)
    db.commit(); db.refresh(pay)
    return pay


@router.get("/invoices/{iid}/payments", response_model=List[PaymentRead])
def list_payments(iid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Payment).filter(Payment.invoice_id == iid).order_by(Payment.paid_on.desc()).all()
