from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List

TECHNIQUES = [
    "dice", "chop", "mince", "slice", "peel", "grate", "zest", "crush", "mash", "boil", "simmer", "sear", "saute",
    "sauté", "fry", "bake", "roast", "grill", "steam", "poach", "whisk", "beat", "fold", "stir", "mix", "knead",
    "roll", "drain", "season", "toss", "melt", "preheat", "blend", "marinate", "rest", "serve", "garnish",
]
_ALIASES = {"sauté": "saute"}
MODEL = "claude-haiku-5-5"


def _norm_technique(t: str) -> str:
    t = t.strip().lower()
    return _ALIASES.get(t, t)


def keyword_analyze(step_text: str, recipe_ingredients: List[str]) -> Dict[str, Any]:
    """No-API fallback: first known cooking verb, and any recipe ingredient mentioned in the step."""
    words = re.findall(r"[a-zA-Zé]+", step_text.lower())
    technique = next((_norm_technique(w) for w in words if w in TECHNIQUES), "general")
    found = []
    for ing in recipe_ingredients:
        # match on the ingredient's last word, e.g. "4 cloves garlic" -> "garlic"
        key = re.findall(r"[a-zA-Z]+", ing.lower())
        if key and key[-1] in words:
            found.append(key[-1])
    return {"technique": technique, "ingredients": found, "caption": step_text.strip()}


def claude_analyze(step_text: str, recipe_ingredients: List[str]) -> Dict[str, Any]:
    import anthropic

    client = anthropic.Anthropic()
    prompt = (
        "Analyze one recipe step for a cooking video. Reply with JSON only, no prose:\n"
        '{"technique": "<single lowercase cooking verb such as dice, mince, sear, simmer, fold, whisk>",'
        ' "ingredients": ["<singular lowercase ingredient names the step acts on>"],'
        ' "caption": "<imperative on-screen caption, max 60 characters>"}\n\n'
        f"Recipe ingredients: {', '.join(recipe_ingredients)}\nStep: {step_text}"
    )
    msg = client.messages.create(model=MODEL, max_tokens=300, messages=[{"role": "user", "content": prompt}])
    text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    data = json.loads(text[text.index("{"): text.rindex("}") + 1])
    return {
        "technique": _norm_technique(str(data["technique"])),
        "ingredients": [str(i).lower() for i in data.get("ingredients", [])],
        "caption": str(data["caption"]).strip(),
    }


def analyze_step(step_text: str, recipe_ingredients: List[str]) -> Dict[str, Any]:
    if os.environ.get("ANTHROPIC_API_KEY"):
        try:
            return claude_analyze(step_text, recipe_ingredients)
        except Exception as e:  # noqa: BLE001 - fall back rather than fail the render
            print(f"[analyze] Claude failed ({e}); using keyword fallback", flush=True)
    return keyword_analyze(step_text, recipe_ingredients)
