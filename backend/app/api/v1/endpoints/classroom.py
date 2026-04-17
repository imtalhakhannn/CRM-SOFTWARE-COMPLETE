from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.classroom import CourseMaterial
from app.models.user import User
from app.schemas.classroom import CourseMaterialCreate, CourseMaterialRead, CourseMaterialUpdate

router = APIRouter()


@router.get("/", response_model=List[CourseMaterialRead])
def list_materials(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(CourseMaterial).order_by(CourseMaterial.id.desc()).all()


@router.post("/", response_model=CourseMaterialRead, status_code=201)
def create_material(payload: CourseMaterialCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    m = CourseMaterial(**payload.model_dump(), created_by_id=current.id)
    db.add(m); db.commit(); db.refresh(m)
    return m


@router.get("/{mid}", response_model=CourseMaterialRead)
def get_material(mid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    m = db.get(CourseMaterial, mid)
    if not m: raise HTTPException(404, "Not found")
    return m


@router.patch("/{mid}", response_model=CourseMaterialRead)
def update_material(mid: int, payload: CourseMaterialUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    m = db.get(CourseMaterial, mid)
    if not m: raise HTTPException(404, "Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit(); db.refresh(m)
    return m


@router.delete("/{mid}", status_code=204)
def delete_material(mid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    m = db.get(CourseMaterial, mid)
    if not m: raise HTTPException(404, "Not found")
    db.delete(m); db.commit()
