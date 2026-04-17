from typing import Any, Dict, List

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_leads: int
    total_prospects: int
    total_clients: int
    prospects_new_this_month: int
    leads_new_this_month: int
    clients_ongoing: int
    rating_counts: Dict[str, int]
    clients_by_user: List[Dict[str, Any]]
    applications_by_workflow: List[Dict[str, Any]]
    tasks_today: int
    appointments_today: int
