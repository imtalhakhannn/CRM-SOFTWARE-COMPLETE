from fastapi import APIRouter

from app.api.v1.endpoints import (
    accounts,
    agents,
    applications,
    auth,
    campaigns,
    checkin,
    classroom,
    contacts,
    conversations,
    dashboard,
    documents,
    notifications,
    quotations,
    reports,
    services,
    tasks,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(services.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(quotations.router, prefix="/quotations", tags=["quotations"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(classroom.router, prefix="/classroom", tags=["classroom"])
api_router.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
