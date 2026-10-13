from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

import psycopg

# Strict by default: "mince ginger" will not reuse a "mince garlic" clip. Generic clips
# (ingredient NULL) always match on technique.
ALLOW_LOOSE_INGREDIENT_MATCH = False

FIND_SQL = """
SELECT id, file, "durationS", ingredient
FROM "ClipAsset"
WHERE source = %(source)s::"ClipSource" AND status = 'approved' AND technique = %(technique)s
  AND (%(loose)s OR ingredient IS NULL OR ingredient = ANY(%(ingredients)s))
ORDER BY (ingredient = ANY(%(ingredients)s)) DESC NULLS LAST, "createdAt" DESC
LIMIT 1
"""


def find_clip(conn: psycopg.Connection, source: str, technique: str, ingredients: List[str]) -> Optional[Dict[str, Any]]:
    """Best approved clip for a step: exact ingredient match first, then generic clips."""
    row = conn.execute(FIND_SQL, {
        "source": source, "technique": technique, "ingredients": ingredients,
        "loose": ALLOW_LOOSE_INGREDIENT_MATCH,
    }).fetchone()
    if row is None:
        return None
    return {"id": row[0], "file": row[1], "durationS": row[2], "ingredient": row[3]}


def save_ai_clip(conn: psycopg.Connection, *, file_key: str, technique: str, ingredient: Optional[str],
                 description: str, duration_s: float, prompt: str, provider: str, cost_usd: float) -> str:
    clip_id = str(uuid.uuid4())
    conn.execute(
        'INSERT INTO "ClipAsset" (id, source, status, file, technique, ingredient, description, tags, '
        '"durationS", prompt, provider, "costUsd") '
        "VALUES (%s, 'ai', 'approved', %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (clip_id, file_key, technique, ingredient, description, [technique] + ([ingredient] if ingredient else []),
         duration_s, prompt, provider, cost_usd),
    )
    return clip_id
