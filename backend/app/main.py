import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base_class import Base
from app.db.bootstrap import ensure_database
from app.db.bootstrap_users import ensure_default_users
from app.db.session import engine
import app.models  # noqa: F401  — ensure models registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_database()
    Base.metadata.create_all(bind=engine)
    # Belt-and-braces: guarantees demo logins work even if seed.py crashed
    # during container start (broken migration, missing table, etc.).
    ensure_default_users()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Static frontend (single-container mode)
#
# If /app/static (or $FRONTEND_DIST) contains a built frontend, serve it.
# `/api/*`, `/docs`, `/openapi.json`, `/health` always go to FastAPI; anything
# else falls back to index.html so React Router can handle client routes.
# ---------------------------------------------------------------------------

_dist = Path(os.environ.get("FRONTEND_DIST", "/app/static"))
_index = _dist / "index.html"

if _index.exists():
    # Serve /assets/* directly from the built bundle
    app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/")
    def _spa_root():
        return FileResponse(_index)

    @app.get("/{full_path:path}")
    def _spa_fallback(full_path: str, request: Request):
        # API and docs paths must not be swallowed
        reserved = ("api/", "docs", "redoc", "openapi.json", "health")
        if any(full_path.startswith(p) for p in reserved):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        # Try to serve a real static file if one matches (e.g. favicon.ico)
        candidate = _dist / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_index)
else:
    @app.get("/")
    def _api_root():
        return {"name": settings.PROJECT_NAME, "docs": "/docs", "api": settings.API_V1_PREFIX}
