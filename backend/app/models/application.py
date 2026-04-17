import enum
from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Enum, Float, ForeignKey, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ApplicationStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    COMPLETED = "completed"


class Workflow(Base):
    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    color: Mapped[Optional[str]] = mapped_column(String(20))

    stages: Mapped[List["WorkflowStage"]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowStage.order"
    )


class WorkflowStage(Base):
    __tablename__ = "workflow_stages"

    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_final: Mapped[bool] = mapped_column(default=False)

    workflow: Mapped["Workflow"] = relationship(back_populates="stages")


class Application(Base):
    __tablename__ = "applications"

    reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.NEW, nullable=False, index=True
    )
    expected_start: Mapped[Optional[date]] = mapped_column(Date)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    notes: Mapped[Optional[str]] = mapped_column(Text)

    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"))
    partner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("partners.id", ondelete="SET NULL"))
    workflow_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workflows.id", ondelete="SET NULL"))
    current_stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workflow_stages.id", ondelete="SET NULL"))
    assigned_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    contact: Mapped["Contact"] = relationship(back_populates="applications")  # type: ignore[name-defined]
    product: Mapped[Optional["Product"]] = relationship()  # type: ignore[name-defined]
    service: Mapped[Optional["Service"]] = relationship()  # type: ignore[name-defined]
    partner: Mapped[Optional["Partner"]] = relationship()  # type: ignore[name-defined]
    workflow: Mapped[Optional["Workflow"]] = relationship()
    current_stage: Mapped[Optional["WorkflowStage"]] = relationship()

    documents: Mapped[List["Document"]] = relationship(  # type: ignore[name-defined]
        back_populates="application", cascade="all, delete-orphan"
    )
    tasks: Mapped[List["Task"]] = relationship(  # type: ignore[name-defined]
        back_populates="application", cascade="all, delete-orphan"
    )
