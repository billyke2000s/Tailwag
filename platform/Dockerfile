FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TZ=UTC
RUN apt-get update && apt-get install -y --no-install-recommends git libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 libjpeg62-turbo ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python scripts/fetch-core.py && SECRET_KEY=build-only-not-a-runtime-secret DEBUG=true python manage.py collectstatic --noinput && useradd --uid 10001 --create-home care && chown -R care:care /app
USER care
ENV ASM3_CONF=/app/runtime/asm3.conf
EXPOSE 8000 5000
CMD ["sh","scripts/entrypoint.sh","public"]
