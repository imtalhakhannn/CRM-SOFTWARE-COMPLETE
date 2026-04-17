import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Task(Base):
    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low/medium/high

    assignee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    contact_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    application_id: Mapped[Optional[int]] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"))

    assignee: Mapped[Optional["User"]] = relationship(  # type: ignore[name-defined]
        back_populates="tasks", foreign_keys=[assignee_id]
    )
    contact: Mapped[Optional["Contact"]] = relationship(back_populates="tasks")  # type: ignore[name-defined]
    application: Mapped[Optional["Application"]] = relationship(back_populates="tasks")  # type: ignore[name-defined]


class Appointment(Base):
    __tablename__ = "appointments"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255))
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)

    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    contact_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"))
