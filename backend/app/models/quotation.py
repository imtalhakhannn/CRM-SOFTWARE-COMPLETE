from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Quotation(Base):
    __tablename__ = "quotations"

    reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    issue_date: Mapped[date] = mapped_column(Date)
    valid_until: Mapped[Optional[date]] = mapped_column(Date)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/sent/accepted/rejected
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    items: Mapped[List["QuotationItem"]] = relationship(
        back_populates="quotation", cascade="all, delete-orphan"
    )


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id", ondelete="CASCADE"))
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    amount: Mapped[float] = mapped_column(Float, default=0.0)

    quotation: Mapped["Quotation"] = relationship(back_populates="items")
