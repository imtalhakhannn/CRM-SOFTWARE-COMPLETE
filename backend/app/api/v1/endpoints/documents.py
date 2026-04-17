import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentRead

router = APIRouter()


def _upload_root() -> Path:
    p = Path(settings.UPLOAD_DIR).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


@router.get("/", response_model=List[DocumentRead])
def list_documents(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    contact_id: Optional[int] = None,
    application_id: Optional[int] = None,
):
    q = db.query(Document)
    if contact_id: q = q.filter(Document.contact_id == contact_id)
    if application_id: q = q.filter(Document.application_id == application_id)
    return q.order_by(Document.id.desc()).all()


@router.post("/", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    contact_id: Optional[int] = Form(None),
    application_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB")

    root = _upload_root()
    ext = Path(file.filename or "").suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = root / stored_name
    with open(dest, "wb") as f:
        f.write(contents)

    doc = Document(
        name=name or (file.filename or stored_name),
        original_filename=file.filename or stored_name,
        stored_path=str(dest),
        mime_type=file.content_type,
        size_bytes=len(contents),
        category=category,
        contact_id=contact_id,
        application_id=application_id,
        uploaded_by_id=current.id,
    )
    db.add(doc); db.commit(); db.refresh(doc)
    return doc


@router.get("/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    doc = db.get(Document, doc_id)
    if not doc or not os.path.exists(doc.stored_path):
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(
        doc.stored_path,
        media_type=doc.mime_type or "application/octet-stream",
        filename=doc.original_filename,
    )


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        if os.path.exists(doc.stored_path):
            os.remove(doc.stored_path)
    except OSError:
        pass
    db.delete(doc); db.commit()
