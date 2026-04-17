from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskStatus


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: str = "medium"
    assignee_id: Optional[int] = None
    contact_id: Optional[int] = None
    application_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None


class TaskRead(TaskBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: datetime
    end_at: datetime
    location: Optional[str] = None
    is_done: bool = False
    user_id: Optional[int] = None
    contact_id: Optional[int] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentRead(AppointmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
