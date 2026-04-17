from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Document(Base):
    __tablename__ = "documents"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[Optional[str]] = mapped_column(String(80))  # passport/transcript/etc

    contact_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    application_id: Mapped[Optional[int]] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"))
    uploaded_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    contact: Mapped[Optional["Contact"]] = relationship(back_populates="documents")  # type: ignore[name-defined]
    application: Mapped[Optional["Application"]] = relationship(back_populates="documents")  # type: ignore[name-defined]
