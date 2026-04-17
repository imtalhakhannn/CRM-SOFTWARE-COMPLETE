from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    id: int
    name: str
    original_filename: str
    mime_type: Optional[str] = None
    size_bytes: int
    category: Optional[str] = None
    contact_id: Optional[int] = None
    application_id: Optional[int] = None
    uploaded_by_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
