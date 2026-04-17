import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus, Workflow, WorkflowStage
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate, ApplicationRead, ApplicationUpdate,
    WorkflowCreate, WorkflowRead, WorkflowStageCreate, WorkflowStageRead,
)

router = APIRouter()


def _make_ref() -> str:
    return "APP-" + secrets.token_hex(4).upper()


@router.get("/", response_model=List[ApplicationRead])
def list_applications(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: Optional[ApplicationStatus] = None,
    contact_id: Optional[int] = None,
    workflow_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
):
    q = db.query(Application)
    if status: q = q.filter(Application.status == status)
    if contact_id: q = q.filter(Application.contact_id == contact_id)
    if workflow_id: q = q.filter(Application.workflow_id == workflow_id)
    return q.order_by(Application.id.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ApplicationRead, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = Application(reference=_make_ref(), **payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.get("/{app_id}", response_model=ApplicationRead)
def get_application(app_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Application, app_id)
    if not obj: raise HTTPException(404, "Application not found")
    return obj


@router.patch("/{app_id}", response_model=ApplicationRead)
def update_application(app_id: int, payload: ApplicationUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Application, app_id)
    if not obj: raise HTTPException(404, "Application not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.get(Application, app_id)
    if not obj: raise HTTPException(404, "Application not found")
    db.delete(obj); db.commit()


# Workflows
@router.get("/workflows/", response_model=List[WorkflowRead])
def list_workflows(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Workflow).all()


@router.post("/workflows/", response_model=WorkflowRead, status_code=201)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wf = Workflow(name=payload.name, description=payload.description, color=payload.color)
    for s in payload.stages:
        wf.stages.append(WorkflowStage(name=s.name, order=s.order, is_final=s.is_final))
    db.add(wf); db.commit(); db.refresh(wf)
    return wf


@router.post("/workflows/{wf_id}/stages", response_model=WorkflowStageRead, status_code=201)
def add_stage(wf_id: int, payload: WorkflowStageCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wf = db.get(Workflow, wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    stage = WorkflowStage(workflow_id=wf_id, **payload.model_dump())
    db.add(stage); db.commit(); db.refresh(stage)
    return stage
