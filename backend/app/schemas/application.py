from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.application import ApplicationStatus


class WorkflowStageBase(BaseModel):
    name: str
    order: int = 0
    is_final: bool = False


class WorkflowStageCreate(WorkflowStageBase):
    pass


class WorkflowStageRead(WorkflowStageBase):
    id: int
    workflow_id: int
    model_config = ConfigDict(from_attributes=True)


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None


class WorkflowCreate(WorkflowBase):
    stages: List[WorkflowStageCreate] = []


class WorkflowRead(WorkflowBase):
    id: int
    stages: List[WorkflowStageRead] = []
    model_config = ConfigDict(from_attributes=True)


class ApplicationBase(BaseModel):
    title: str
    status: ApplicationStatus = ApplicationStatus.NEW
    expected_start: Optional[date] = None
    amount: float = 0.0
    currency: str = "USD"
    notes: Optional[str] = None
    contact_id: int
    product_id: Optional[int] = None
    service_id: Optional[int] = None
    partner_id: Optional[int] = None
    workflow_id: Optional[int] = None
    current_stage_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    expected_start: Optional[date] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    product_id: Optional[int] = None
    service_id: Optional[int] = None
    partner_id: Optional[int] = None
    workflow_id: Optional[int] = None
    current_stage_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class ApplicationRead(ApplicationBase):
    id: int
    reference: str
    model_config = ConfigDict(from_attributes=True)
