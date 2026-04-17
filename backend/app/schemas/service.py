from typing import Optional

from pydantic import BaseModel, ConfigDict


class ServiceBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    base_price: float = 0.0
    currency: str = "USD"
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceRead(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PartnerBase(BaseModel):
    name: str
    type: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    commission_rate: float = 0.0
    notes: Optional[str] = None
    is_active: bool = True


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    commission_rate: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PartnerRead(PartnerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    price: float = 0.0
    currency: str = "USD"
    duration_months: Optional[int] = None
    level: Optional[str] = None
    intake: Optional[str] = None
    is_active: bool = True
    service_id: Optional[int] = None
    partner_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    duration_months: Optional[int] = None
    level: Optional[str] = None
    intake: Optional[str] = None
    is_active: Optional[bool] = None
    service_id: Optional[int] = None
    partner_id: Optional[int] = None


class ProductRead(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
