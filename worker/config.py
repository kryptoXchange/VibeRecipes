from __future__ import annotations

import os
from pathlib import Path


def _load_env() -> None:
    """Load ../.env if present (no python-dotenv dependency)."""
    env = Path(__file__).resolve().parent.parent / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


_load_env()

DATABASE_URL = os.environ["DATABASE_URL"]
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "http://localhost:8333")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", "any")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY", "any")
S3_BUCKET = os.environ.get("S3_BUCKET", "cooking")
# Where browsers fetch uploaded videos from.
S3_PUBLIC_URL = os.environ.get("S3_PUBLIC_URL", f"{S3_ENDPOINT}/{S3_BUCKET}")
POLL_SECONDS = 2.0
