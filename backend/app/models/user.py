import enum
from typing import List, Optional

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    CONSULTANT = "consultant"
    AGENT = "agent"
    VIEWER = "viewer"


class Branch(Base):
    __tablename__ = "branches"

    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    email: Mapped[Optional[str]] = mapped_column(String(120))

    users: Mapped[List["User"]] = relationship(back_populates="branch")


class Team(Base):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    branch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))

    members: Mapped[List["User"]] = relationship(back_populates="team")


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CONSULTANT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))

    branch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    team_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"))

    branch: Mapped[Optional["Branch"]] = relationship(back_populates="users")
    team: Mapped[Optional["Team"]] = relationship(back_populates="members")

    assigned_contacts: Mapped[List["Contact"]] = relationship(  # type: ignore[name-defined]
        back_populates="assigned_to", foreign_keys="Contact.assigned_to_id"
    )
    tasks: Mapped[List["Task"]] = relationship(  # type: ignore[name-defined]
        back_populates="assignee", foreign_keys="Task.assignee_id"
    )
