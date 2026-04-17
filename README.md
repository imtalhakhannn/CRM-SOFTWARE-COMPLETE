# CRM Software

> 🚀 **Want to deploy this live for free?** See [DEPLOY.md](DEPLOY.md) — Neon + Render + Vercel in ~15 min, no credit card.


Agentcis-style CRM — **FastAPI backend** + **React (Vite + TypeScript) frontend** — with auth, role-based permissions, document upload, dashboard, and full CRUD for the core modules.

## Screenshots (reference)

The design is modelled after the Agentcis dashboard you provided: dark sidebar, stats cards, tasks/appointments/reminders, clients-by-user bar list, and a workflow pie chart.

## Features delivered in this version

**Backend (FastAPI + SQLAlchemy 2):**
- JWT auth (login/register/me) with bcrypt password hashing
- Roles: `super_admin`, `admin`, `manager`, `consultant`, `agent`, `viewer`
- Entities: Users, Branches, Teams, Contacts (lead/prospect/client), Services, Partners, Products, Applications (with Workflows & Stages), Tasks, Appointments, Conversations/Messages, Quotations, Documents
- Full CRUD REST APIs for all core modules
- Document upload / download / delete attached to contacts or applications
- Dashboard aggregate endpoint (totals, prospect ratings, clients-by-user, applications-by-workflow, today’s tasks/appointments)
- SQLite out of the box, Postgres-ready via `DATABASE_URL`

**Frontend (React + Vite + TS + Tailwind + TanStack Query + Zustand):**
- Login page (token persisted in localStorage) with protected routes
- Sidebar matching the reference screenshot (17 modules)
- Dashboard with stats cards, rating icons, bar list, recharts pie
- Contacts: list + filters + search + create modal + detail page with tabs (Overview / Applications / Tasks / Documents) and file upload
- Applications: list + create modal with workflow/contact selection
- Tasks: list + complete + create modal
- Catalog: Services, Partners, Products with CRUD modals
- Remaining modules (Conversations, Quotations, Accounts, Teams, Agents, Classroom, Campaign, Reports, Office Check-In) render a scaffold placeholder — the backend APIs are already in place; copy the Contacts page pattern to build UIs for them.

---

## Project layout

```
CRM-SOFTWARE/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # auth, users, contacts, applications, tasks, documents, dashboard...
│   │   ├── core/                  # config, security (JWT + bcrypt)
│   │   ├── db/                    # Base class, session
│   │   ├── models/                # SQLAlchemy models
│   │   └── schemas/               # Pydantic schemas
│   ├── uploads/                   # uploaded documents live here
│   ├── seed.py                    # seeds admin user + sample data
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                   # axios client + typed endpoints
    │   ├── components/            # Sidebar, Topbar, Modal, PageHeader
    │   ├── layouts/AppLayout.tsx
    │   ├── pages/                 # Dashboard, Contacts, Applications, Tasks, Catalog, Auth
    │   ├── store/auth.ts          # Zustand + localStorage
    │   └── types/
    ├── package.json
    └── vite.config.ts
```

---

## Backend — setup & run

Requires Python 3.10+ (3.11 recommended).

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env

python seed.py              # creates DB, admin, workflows, sample contacts
uvicorn app.main:app --reload --port 8000
```

- API root: http://localhost:8000/
- OpenAPI docs: http://localhost:8000/docs
- Default accounts:
  - `admin@crm.io` / `admin123`
  - `consultant@crm.io` / `consultant123`

### Database options

The `.env` defaults to **MySQL on localhost:3306** with user `root` and password `imTalha18@` (URL-encoded as `imTalha18%40`). Before first run, create the database:

```sql
-- in MySQL shell / Workbench
CREATE DATABASE IF NOT EXISTS crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or from a terminal:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Alternative connection strings in `.env`:

```
# SQLite (zero setup)
DATABASE_URL=sqlite:///./crm.db
# Postgres
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/crm
# MySQL (current default — '@' in password is URL-encoded as %40)
DATABASE_URL=mysql+pymysql://root:imTalha18%40@localhost:3306/crm?charset=utf8mb4
```

Tables are created automatically on startup via `Base.metadata.create_all`. For real migrations, add Alembic (directory scaffold included under `backend/alembic/`).

---

## Frontend — setup & run

Requires Node 18+.

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

Open http://localhost:5173 and sign in with the seeded admin account.

---

## Core API reference

All endpoints are prefixed with `/api/v1`. Send `Authorization: Bearer <token>`.

| Area          | Endpoints (selection) |
| ------------- | --------------------- |
| Auth          | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users         | `GET/POST /users/`, `GET/POST /users/branches/`, `GET/POST /users/teams/` |
| Contacts      | `GET/POST /contacts/`, `GET/PATCH/DELETE /contacts/{id}`, `POST /contacts/{id}/convert?to_type=client` |
| Catalog       | `GET/POST /catalog/services|partners|products/` and `PATCH/DELETE /{id}` |
| Applications  | `GET/POST /applications/`, `GET/PATCH/DELETE /applications/{id}`, `GET/POST /applications/workflows/` |
| Tasks         | `GET/POST /tasks/`, `PATCH/DELETE /tasks/{id}`, `GET/POST /tasks/appointments/` |
| Documents     | `GET/POST /documents/` (multipart), `GET /documents/{id}/download`, `DELETE /documents/{id}` |
| Conversations | `GET/POST /conversations/`, `POST /conversations/{id}/messages` |
| Quotations    | `GET/POST /quotations/`, `GET/DELETE /quotations/{id}` |
| Dashboard     | `GET /dashboard/` |

### Document upload (example)

```bash
curl -X POST http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@passport.pdf" \
  -F "name=Passport" \
  -F "category=identity" \
  -F "contact_id=1"
```

---

## Roadmap / where to extend

Each placeholder page in `frontend/src/App.tsx` corresponds to a module whose backend API is already built. To flesh them out, copy the `ContactsPage` / `ApplicationsPage` pattern:

1. Add a TanStack `useQuery` for the list endpoint.
2. Add a create modal wired with `useMutation`.
3. Optionally a detail page with tabs (see `ContactDetailPage`).

Suggested next features:
- Drag-and-drop pipeline view for applications per workflow stage
- Email/SMS integration for Conversations
- Invoice/receipt PDF export for Quotations & Accounts
- Reports module with date-range filters (aggregate over existing data)
- Role-based row-level security and branch scoping
- Audit log table
- S3/Azure Blob backend for document storage (swap `uploads/` path)

---

## License

Use internally in your team as you see fit.
