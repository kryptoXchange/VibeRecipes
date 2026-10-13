from __future__ import annotations

import subprocess
from typing import List, Sequence, Tuple


def title_card(seconds: float, out_path: str) -> str:
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=0x553322:s=1280x720:r=30:d={seconds}",
         "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", out_path],
        check=True, capture_output=True,
    )
    return out_path


def build_clips(step_texts: Sequence[str], tmpdir: str, seconds: float = 3) -> Tuple[List[str], List[int]]:
    """Stitched strategy. The clip library isn't built yet, so every step falls back to a
    title card and is reported as a library gap (1-based step positions)."""
    clips = [title_card(seconds, f"{tmpdir}/stitch{i}.mp4") for i, _ in enumerate(step_texts, start=1)]
    gaps = list(range(1, len(step_texts) + 1))
    return clips, gaps
