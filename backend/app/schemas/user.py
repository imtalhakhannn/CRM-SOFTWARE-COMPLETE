from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CONSULTANT
    branch_id: Optional[int] = None
    team_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    branch_id: Optional[int] = None
    team_id: Optional[int] = None
    password: Optional[str] = None


class UserRead(UserBase):
    id: int
    is_active: bool
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BranchCreate(BranchBase):
    pass


class BranchRead(BranchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    branch_id: Optional[int] = None


class TeamCreate(TeamBase):
    pass


class TeamRead(TeamBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
