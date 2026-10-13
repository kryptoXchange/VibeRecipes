# Cooking: recipe to step-by-step video

See the plan in `~/.claude/plans/` for architecture. Layout:

- `apps/web` Next.js app and Prisma schema (`prisma/schema.prisma`)
- `worker` Python video pipeline (FFmpeg, `ClipGenerator` adapters)
- `infra` docker-compose for Postgres, Redis, SeaweedFS

## Prereqs
Node 20+, Docker, FFmpeg, Python 3.9+.

## Start
    cp .env.example .env
    docker compose -f infra/docker-compose.yml up -d
    cd worker && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && pytest

## Run
    docker compose -f infra/docker-compose.yml up -d
    cd apps/web && npm install && npx prisma migrate dev && npx tsx prisma/seed.ts && npm run dev
    # in another terminal:
    cd worker && . .venv/bin/activate && python main.py   # renders queued videos

The web app creates `Video` rows with status `queued`; the worker polls Postgres,
renders them with FFmpeg, uploads to the S3 store, and sets `done` or `failed`.
