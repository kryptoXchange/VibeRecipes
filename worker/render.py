from __future__ import annotations

import os
import subprocess
import tempfile
import time
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.types.json import Jsonb

import storage
from generators.mock import MockGenerator
from pipeline.analyze import analyze_step
from pipeline.assemble import assemble
from pipeline.library import find_clip, save_ai_clip
from pipeline.stitch import title_card

STEP_SECONDS = 3
PROVIDER = "mock"
# Set FORCE_FRESH_AI=1 to skip the AI library and always generate new clips (for testing/comparison).
FORCE_FRESH_AI = os.environ.get("FORCE_FRESH_AI") == "1"


def _caption(text: str, limit: int = 60) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _load_steps(conn: psycopg.Connection, recipe_id: str) -> List[Dict[str, Any]]:
    ingredients = conn.execute('SELECT ingredients FROM "Recipe" WHERE id = %s', (recipe_id,)).fetchone()[0]
    names = [i["name"] for i in ingredients]
    steps = []
    for pos, text, analysis in conn.execute(
            'SELECT position, text, analysis FROM "Step" WHERE "recipeId" = %s ORDER BY position', (recipe_id,)).fetchall():
        if not analysis:  # analyze once, cache on the step
            analysis = analyze_step(text, names)
            conn.execute('UPDATE "Step" SET analysis = %s WHERE "recipeId" = %s AND position = %s',
                         (Jsonb(analysis), recipe_id, pos))
        steps.append({"position": pos, "text": text, "analysis": analysis})
    conn.commit()
    return steps


def _fetch(conn, source: str, step: Dict[str, Any], tmp: str) -> Optional[Dict[str, Any]]:
    a = step["analysis"]
    hit = find_clip(conn, source, a["technique"], a["ingredients"])
    if hit is None:
        return None
    path = os.path.join(tmp, f"{source}{step['position']}.mp4")
    storage.download(hit["file"], path)
    return {"path": path, "source": source, "clipId": hit["id"]}


def _generate_ai(conn, step: Dict[str, Any], tmp: str) -> Dict[str, Any]:
    a = step["analysis"]
    prompt = f"Close-up cooking tutorial shot, {a['technique']} {', '.join(a['ingredients']) or 'ingredients'}: {step['text']}"
    gen = MockGenerator()  # TODO: swap for a real provider adapter
    path = os.path.join(tmp, f"gen{step['position']}.mp4")
    clip = gen.generate(prompt, STEP_SECONDS, path)
    ingredient = a["ingredients"][0] if a["ingredients"] else None
    key = f"clips/ai/{os.path.basename(tmp)}-{step['position']}.mp4"
    storage.upload_clip(path, key)
    clip_id = save_ai_clip(conn, file_key=key, technique=a["technique"], ingredient=ingredient,
                           description=step["text"], duration_s=clip.seconds, prompt=prompt,
                           provider=PROVIDER, cost_usd=clip.cost_usd)
    conn.commit()
    return {"path": path, "source": "ai", "clipId": clip_id, "cost": clip.cost_usd}


def render_video(conn: psycopg.Connection, video_id: str, recipe_id: str, strategy: str) -> Dict[str, Any]:
    """Build one video for a recipe. Returns fields to persist on the Video row."""
    started = time.time()
    steps = _load_steps(conn, recipe_id)
    cost = 0.0
    chosen: List[Dict[str, Any]] = []
    with tempfile.TemporaryDirectory() as tmp:
        for step in steps:
            if strategy == "stitched":
                # real library first, then AI library, then a placeholder
                c = _fetch(conn, "real", step, tmp) or _fetch(conn, "ai", step, tmp)
            elif strategy == "ai":
                # reuse an existing AI clip, otherwise generate (and save) a new one
                c = None if FORCE_FRESH_AI else _fetch(conn, "ai", step, tmp)
                if c is None:
                    c = _generate_ai(conn, step, tmp)
                    cost += c["cost"]
            else:
                raise ValueError(f"unknown strategy {strategy}")
            if c is None:
                c = {"path": title_card(STEP_SECONDS, os.path.join(tmp, f"ph{step['position']}.mp4")),
                     "source": "placeholder", "clipId": None}
            chosen.append(c)

        out = os.path.join(tmp, "out.mp4")
        assemble([c["path"] for c in chosen],
                 [_caption(s["analysis"].get("caption") or s["text"]) for s in steps], out)
        duration = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out],
            check=True, capture_output=True, text=True).stdout.strip())
        url = storage.upload_video(out, f"videos/{video_id}.mp4")

    return {
        "url": url,
        "costUsd": cost,
        "durationS": duration,
        "renderSeconds": time.time() - started,
        "libraryGaps": [s["position"] for s, c in zip(steps, chosen) if c["source"] == "placeholder"],
        "stepSources": [{"position": s["position"], "source": c["source"], "clipId": c["clipId"]}
                        for s, c in zip(steps, chosen)],
    }
