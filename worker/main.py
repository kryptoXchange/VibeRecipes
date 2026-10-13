from __future__ import annotations

import time
import traceback

import psycopg
from psycopg.types.json import Jsonb

import config
import storage
from render import render_video

CLAIM_SQL = """
UPDATE "Video" SET status = 'running'
WHERE id = (
  SELECT id FROM "Video" WHERE status = 'queued'
  ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED
)
RETURNING id, "recipeId", strategy::text
"""


def process_one(conn: psycopg.Connection) -> bool:
    row = conn.execute(CLAIM_SQL).fetchone()
    conn.commit()
    if row is None:
        return False
    video_id, recipe_id, strategy = row
    print(f"[worker] rendering {video_id} ({strategy})", flush=True)
    try:
        r = render_video(conn, video_id, recipe_id, strategy)
        conn.execute(
            'UPDATE "Video" SET status = \'done\', url = %s, "costUsd" = %s, "durationS" = %s, '
            '"renderSeconds" = %s, "libraryGaps" = %s, "stepSources" = %s, error = NULL WHERE id = %s',
            (r["url"], r["costUsd"], r["durationS"], r["renderSeconds"],
             Jsonb(r["libraryGaps"]), Jsonb(r["stepSources"]), video_id),
        )
        print(f"[worker] done {video_id} in {r['renderSeconds']:.1f}s", flush=True)
    except Exception as e:  # noqa: BLE001
        traceback.print_exc()
        conn.execute('UPDATE "Video" SET status = \'failed\', error = %s WHERE id = %s', (str(e)[:500], video_id))
    conn.commit()
    return True


def main() -> None:
    storage.ensure_bucket()
    with psycopg.connect(config.DATABASE_URL) as conn:
        print("[worker] waiting for jobs", flush=True)
        while True:
            if not process_one(conn):
                time.sleep(config.POLL_SECONDS)


if __name__ == "__main__":
    main()
