from typing import List, Optional

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Service(Base):
    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(40), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    base_price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[List["Product"]] = relationship(back_populates="service")


class Partner(Base):
    __tablename__ = "partners"

    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    type: Mapped[Optional[str]] = mapped_column(String(80))  # university, insurance, visa, etc
    country: Mapped[Optional[str]] = mapped_column(String(80))
    website: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(160))
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    address: Mapped[Optional[str]] = mapped_column(String(255))
    commission_rate: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[List["Product"]] = relationship(back_populates="partner")


class Product(Base):
    """A product is a specific offering (e.g. a Course at a University partner)."""

    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(60))
    description: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    duration_months: Mapped[Optional[int]]
    level: Mapped[Optional[str]] = mapped_column(String(80))  # Bachelors/Masters/etc
    intake: Mapped[Optional[str]] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"))
    partner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("partners.id", ondelete="SET NULL"))

    service: Mapped[Optional["Service"]] = relationship(back_populates="products")
    partner: Mapped[Optional["Partner"]] = relationship(back_populates="products")
