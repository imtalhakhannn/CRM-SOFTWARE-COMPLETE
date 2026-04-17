from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Branch, Team, User, UserRole
from app.schemas.user import (
    BranchCreate, BranchRead, TeamCreate, TeamRead,
    UserCreate, UserRead, UserUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(User).all()


@router.post("/", response_model=UserRead, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        branch_id=payload.branch_id,
        team_id=payload.team_id,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


# Branches
@router.get("/branches/", response_model=List[BranchRead])
def list_branches(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Branch).all()


@router.post("/branches/", response_model=BranchRead, status_code=201)
def create_branch(
    payload: BranchCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    branch = Branch(**payload.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


# Teams
@router.get("/teams/", response_model=List[TeamRead])
def list_teams(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Team).all()


@router.post("/teams/", response_model=TeamRead, status_code=201)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    team = Team(**payload.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team
