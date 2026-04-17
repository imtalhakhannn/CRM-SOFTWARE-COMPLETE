import enum
from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ContactType(str, enum.Enum):
    LEAD = "lead"
    PROSPECT = "prospect"
    CLIENT = "client"


class ProspectRating(str, enum.Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    FLAGGED = "flagged"
    DEAD = "dead"


class Contact(Base):
    __tablename__ = "contacts"

    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(120))
    email: Mapped[Optional[str]] = mapped_column(String(160), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    alt_phone: Mapped[Optional[str]] = mapped_column(String(40))

    type: Mapped[ContactType] = mapped_column(Enum(ContactType), default=ContactType.LEAD, nullable=False, index=True)
    rating: Mapped[Optional[ProspectRating]] = mapped_column(Enum(ProspectRating))
    source: Mapped[Optional[str]] = mapped_column(String(120))

    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    nationality: Mapped[Optional[str]] = mapped_column(String(80))
    passport_number: Mapped[Optional[str]] = mapped_column(String(40))

    address: Mapped[Optional[str]] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(80))
    state: Mapped[Optional[str]] = mapped_column(String(80))
    country: Mapped[Optional[str]] = mapped_column(String(80))
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))

    notes: Mapped[Optional[str]] = mapped_column(Text)

    branch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    assigned_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    assigned_to: Mapped[Optional["User"]] = relationship(  # type: ignore[name-defined]
        back_populates="assigned_contacts", foreign_keys=[assigned_to_id]
    )

    applications: Mapped[List["Application"]] = relationship(  # type: ignore[name-defined]
        back_populates="contact", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(  # type: ignore[name-defined]
        back_populates="contact", cascade="all, delete-orphan"
    )
    tasks: Mapped[List["Task"]] = relationship(  # type: ignore[name-defined]
        back_populates="contact", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name or ''}".strip()
