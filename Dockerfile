# syntax=docker/dockerfile:1.7
#
# All-in-one image: builds the React frontend and bakes it into the Python
# backend. The result is a single container listening on $PORT that serves
# both the API (/api/*, /docs) and the SPA (/). Deploys as ONE service on
# Koyeb, Fly, Railway, Render Docker, or any VPS.
#
# Build:  docker build -t crm .
# Run:    docker run -p 8000:8000 -e DATABASE_URL=... -e SECRET_KEY=... crm

# ---------- 1. Build frontend ----------
FROM node:20-alpine AS frontend

WORKDIR /web
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
# Frontend calls same origin, so API URL is relative
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 2. Build backend deps ----------
FROM python:3.11-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev pkg-config \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ---------- 3. Final runtime ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    UPLOAD_DIR=/data/uploads PORT=8000 FRONTEND_DIST=/app/static \
    DATABASE_URL=sqlite:////data/crm.db

RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq5 default-mysql-client \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY --from=backend-builder /install /usr/local
COPY --chown=app:app backend/ /app/
COPY --from=frontend --chown=app:app /web/dist /app/static

RUN mkdir -p /data/uploads && chown -R app:app /app /data
VOLUME ["/data"]

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request,os; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/health', timeout=3).read()" || exit 1

CMD ["bash", "start.sh"]
