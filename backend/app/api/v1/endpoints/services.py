from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.service import Partner, Product, Service
from app.models.user import User
from app.schemas.service import (
    PartnerCreate, PartnerRead, PartnerUpdate,
    ProductCreate, ProductRead, ProductUpdate,
    ServiceCreate, ServiceRead, ServiceUpdate,
)

router = APIRouter()


# Services
@router.get("/services/", response_model=List[ServiceRead])
def list_services(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Service).order_by(Service.name).all()


@router.post("/services/", response_model=ServiceRead, status_code=201)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = Service(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.patch("/services/{sid}", response_model=ServiceRead)
def update_service(sid: int, payload: ServiceUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Service, sid)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/services/{sid}", status_code=204)
def delete_service(sid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Service, sid)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()


# Partners
@router.get("/partners/", response_model=List[PartnerRead])
def list_partners(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Partner).order_by(Partner.name).all()


@router.post("/partners/", response_model=PartnerRead, status_code=201)
def create_partner(payload: PartnerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = Partner(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.patch("/partners/{pid}", response_model=PartnerRead)
def update_partner(pid: int, payload: PartnerUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Partner, pid)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/partners/{pid}", status_code=204)
def delete_partner(pid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Partner, pid)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()


# Products
@router.get("/products/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Product).order_by(Product.name).all()


@router.post("/products/", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = Product(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.patch("/products/{pid}", response_model=ProductRead)
def update_product(pid: int, payload: ProductUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Product, pid)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/products/{pid}", status_code=204)
def delete_product(pid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Product, pid)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
