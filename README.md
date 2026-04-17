# CRM Software

## 🚀 One-click deploy — zero database setup

All-in-one Docker image that bundles React frontend + FastAPI backend + **SQLite**.
**No database provisioning, no credit card, one URL.**

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/imtalhakhannn/CRM-SOFTWARE-COMPLETE&branch=main&name=crm&builder=dockerfile&ports=8000;http;/&env[SECRET_KEY]=replace-me-with-a-long-random-string&env[BACKEND_CORS_ORIGINS]=*&instance_type=nano)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/imtalhakhannn/CRM-SOFTWARE-COMPLETE)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/imtalhakhannn/CRM-SOFTWARE-COMPLETE)

### ✅ Render (currently the only truly free option, no credit card)

> ⚠️ **Koyeb now requires a credit card** ($10 verification hold). **Use Render instead** — same 3-click flow, still 100% free.

1. Go to **https://render.com** → **Sign up with GitHub**
2. On the dashboard: **New +** → **Blueprint** → select your `CRM-SOFTWARE-COMPLETE` repo
3. Render reads `render.yaml` and pre-fills everything → click **Apply**

Wait ~4 min while Render builds the Docker image → you get a URL like `https://crm-YOU.onrender.com`.
Open it → log in with `admin@crm.io` / `admin123` → **send the link to your client** 🎉

First request after 15 min idle takes ~30 s (free-tier cold start). Then it's instant.

### Want persistent data later?

The SQLite file at `/data/crm.db` is ephemeral on free tiers (wiped on redeploy). Swap in free Postgres when you need persistence:

1. Koyeb dashboard → Create Database Service → free Postgres
2. Copy connection string, prepend `postgresql+psycopg2://`
3. Add env var `DATABASE_URL=…` on the CRM service → redeploy

More guides: [DEPLOY-DOCKER.md](DEPLOY-DOCKER.md) · [DEPLOY.md](DEPLOY.md)

---



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
