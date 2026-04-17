# syntax=docker/dockerfile:1.7
# ---------- builder ----------
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev default-libmysqlclient-dev pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ---------- runtime ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UPLOAD_DIR=/app/uploads \
    PORT=8000

WORKDIR /app

# Runtime libs needed by psycopg2 + mysqlclient
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq5 default-mysql-client \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r app && useradd -r -g app app \
 && mkdir -p /app/uploads && chown -R app:app /app

COPY --from=builder /install /usr/local
COPY --chown=app:app . /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request,sys; urllib.request.urlopen(f'http://127.0.0.1:{__import__(\"os\").environ.get(\"PORT\",\"8000\")}/health', timeout=3).read(); sys.exit(0)" || exit 1

CMD ["bash", "start.sh"]
