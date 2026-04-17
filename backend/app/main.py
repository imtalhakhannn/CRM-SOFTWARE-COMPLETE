from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base_class import Base
from app.db.bootstrap import ensure_database
from app.db.session import engine
import app.models  # noqa: F401  — ensure models registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_database()
    Base.metadata.create_all(bind=engine)
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


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "docs": "/docs", "api": settings.API_V1_PREFIX}


@app.get("/health")
def health():
    return {"status": "ok"}
