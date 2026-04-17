from app.schemas.user import (
    UserCreate, UserUpdate, UserRead, Token, LoginRequest,
    BranchCreate, BranchRead, TeamCreate, TeamRead,
)
from app.schemas.contact import ContactCreate, ContactUpdate, ContactRead, ContactList
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceRead,
    PartnerCreate, PartnerUpdate, PartnerRead,
    ProductCreate, ProductUpdate, ProductRead,
)
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationRead,
    WorkflowCreate, WorkflowRead, WorkflowStageCreate, WorkflowStageRead,
)
from app.schemas.task import TaskCreate, TaskUpdate, TaskRead, AppointmentCreate, AppointmentRead
from app.schemas.document import DocumentRead
from app.schemas.conversation import ConversationCreate, ConversationRead, MessageCreate, MessageRead
from app.schemas.quotation import QuotationCreate, QuotationRead, QuotationItemCreate
from app.schemas.invoice import InvoiceCreate, InvoiceRead, InvoiceUpdate, PaymentCreate, PaymentRead
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.schemas.classroom import CourseMaterialCreate, CourseMaterialRead, CourseMaterialUpdate
from app.schemas.checkin import CheckInCreate, CheckInRead
from app.schemas.dashboard import DashboardStats

__all__ = [name for name in dir() if not name.startswith("_")]
