from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.task import Appointment, Task, TaskStatus
from app.models.user import User
from app.schemas.task import (
    AppointmentCreate, AppointmentRead,
    TaskCreate, TaskRead, TaskUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[TaskRead])
def list_tasks(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: Optional[TaskStatus] = None,
    assignee_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    application_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
):
    q = db.query(Task)
    if status: q = q.filter(Task.status == status)
    if assignee_id: q = q.filter(Task.assignee_id == assignee_id)
    if contact_id: q = q.filter(Task.contact_id == contact_id)
    if application_id: q = q.filter(Task.application_id == application_id)
    # MySQL-compatible NULLS LAST: NULL rows sort after non-NULL rows
    return (
        q.order_by(Task.due_date.is_(None), Task.due_date.asc())
        .offset(skip).limit(limit).all()
    )


@router.post("/", response_model=TaskRead, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    data = payload.model_dump()
    if not data.get("assignee_id"):
        data["assignee_id"] = current.id
    obj = Task(**data)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Task, task_id)
    if not obj: raise HTTPException(404, "Task not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Task, task_id)
    if not obj: raise HTTPException(404, "Task not found")
    db.delete(obj); db.commit()


# Appointments
@router.get("/appointments/", response_model=List[AppointmentRead])
def list_appointments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    user_id: Optional[int] = None,
    contact_id: Optional[int] = None,
):
    q = db.query(Appointment)
    if user_id: q = q.filter(Appointment.user_id == user_id)
    if contact_id: q = q.filter(Appointment.contact_id == contact_id)
    return q.order_by(Appointment.start_at).all()


@router.post("/appointments/", response_model=AppointmentRead, status_code=201)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    data = payload.model_dump()
    if not data.get("user_id"):
        data["user_id"] = current.id
    obj = Appointment(**data)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.delete("/appointments/{aid}", status_code=204)
def delete_appointment(aid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Appointment, aid)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
