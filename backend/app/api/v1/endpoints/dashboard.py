from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus, Workflow
from app.models.contact import Contact, ContactType, ProspectRating
from app.models.task import Appointment, Task, TaskStatus
from app.models.user import User
from app.schemas.dashboard import DashboardStats

router = APIRouter()


@router.get("/", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    today = date.today()
    month_start = today.replace(day=1)

    counts_by_type = dict(
        db.query(Contact.type, func.count(Contact.id)).group_by(Contact.type).all()
    )
    total_leads = counts_by_type.get(ContactType.LEAD, 0)
    total_prospects = counts_by_type.get(ContactType.PROSPECT, 0)
    total_clients = counts_by_type.get(ContactType.CLIENT, 0)

    new_this_month_by_type = dict(
        db.query(Contact.type, func.count(Contact.id))
        .filter(Contact.created_at >= month_start)
        .group_by(Contact.type)
        .all()
    )

    rating_rows = (
        db.query(Contact.rating, func.count(Contact.id))
        .filter(Contact.type == ContactType.PROSPECT)
        .group_by(Contact.rating)
        .all()
    )
    rating_counts = {r.value if r else "unrated": c for r, c in rating_rows}
    for r in ProspectRating:
        rating_counts.setdefault(r.value, 0)

    clients_by_user_rows = (
        db.query(User.full_name, func.count(Contact.id))
        .join(Contact, Contact.assigned_to_id == User.id)
        .filter(Contact.type == ContactType.CLIENT)
        .group_by(User.id)
        .order_by(func.count(Contact.id).desc())
        .limit(10)
        .all()
    )
    clients_by_user = [{"name": n, "count": c} for n, c in clients_by_user_rows]

    apps_by_wf_rows = (
        db.query(Workflow.name, func.count(Application.id))
        .outerjoin(Application, Application.workflow_id == Workflow.id)
        .filter(Application.status == ApplicationStatus.IN_PROGRESS)
        .group_by(Workflow.id)
        .all()
    )
    applications_by_workflow = [{"name": n, "count": c} for n, c in apps_by_wf_rows]

    start = datetime.combine(today, datetime.min.time())
    end = start + timedelta(days=1)
    tasks_today = (
        db.query(func.count(Task.id))
        .filter(Task.due_date >= start, Task.due_date < end, Task.status != TaskStatus.COMPLETED)
        .scalar() or 0
    )
    appointments_today = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.start_at >= start, Appointment.start_at < end)
        .scalar() or 0
    )

    return DashboardStats(
        total_leads=total_leads,
        total_prospects=total_prospects,
        total_clients=total_clients,
        prospects_new_this_month=new_this_month_by_type.get(ContactType.PROSPECT, 0),
        leads_new_this_month=new_this_month_by_type.get(ContactType.LEAD, 0),
        clients_ongoing=total_clients,
        rating_counts=rating_counts,
        clients_by_user=clients_by_user,
        applications_by_workflow=applications_by_workflow,
        tasks_today=tasks_today,
        appointments_today=appointments_today,
    )
