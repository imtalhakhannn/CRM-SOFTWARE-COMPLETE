from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CourseMaterial(Base):
    __tablename__ = "course_materials"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(80))  # training/sop/template/guide
    description: Mapped[Optional[str]] = mapped_column(Text)
    content: Mapped[Optional[str]] = mapped_column(Text)  # rich text / markdown
    video_url: Mapped[Optional[str]] = mapped_column(String(500))
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("documents.id", ondelete="SET NULL"))

    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
