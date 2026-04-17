from typing import Optional

from pydantic import BaseModel, ConfigDict


class CourseMaterialBase(BaseModel):
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    document_id: Optional[int] = None


class CourseMaterialCreate(CourseMaterialBase):
    pass


class CourseMaterialUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class CourseMaterialRead(CourseMaterialBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
