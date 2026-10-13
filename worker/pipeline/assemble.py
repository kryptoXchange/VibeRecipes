from __future__ import annotations

import os
import subprocess
import tempfile
from typing import Sequence

W, H, FPS = 1280, 720, 30
MAX_CLIP_SECONDS = 8


def _caption_png(label: str, path: str) -> None:
    """Render a caption banner as a transparent PNG (avoids needing FFmpeg's drawtext/libfreetype)."""
    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.load_default(size=36)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    l, t, r, b = d.textbbox((0, 0), label, font=font)
    tw, th, pad = r - l, b - t, 14
    x, y = (W - tw) // 2, H - th - 50
    d.rectangle((x - pad, y - pad, x + tw + pad, y + th + pad), fill=(0, 0, 0, 160))
    d.text((x - l, y - t), label, font=font, fill=(255, 255, 255, 255))
    img.save(path)


def normalize(src: str, dst: str, caption: str, step_number: int) -> None:
    """Re-encode to a common format and burn in the step number + caption."""
    png = dst + ".png"
    _caption_png(f"Step {step_number}: {caption}", png)
    fc = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,fps={FPS}[v];[v][1:v]overlay=0:0,format=yuv420p[out]"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-t", str(MAX_CLIP_SECONDS), "-i", src, "-i", png, "-filter_complex", fc, "-map", "[out]", "-map", "0:a?",
         "-c:v", "libx264", "-c:a", "aac", "-ar", "44100", "-ac", "2", dst],
        check=True, capture_output=True,
    )


def assemble(clips: Sequence[str], captions: Sequence[str], out_path: str) -> str:
    """Normalize each clip with its caption, then concat into one MP4."""
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for i, (clip, cap) in enumerate(zip(clips, captions), start=1):
            dst = os.path.join(tmp, f"part{i}.mp4")
            normalize(clip, dst, cap, i)
            parts.append(dst)
        listfile = os.path.join(tmp, "list.txt")
        with open(listfile, "w") as f:
            f.writelines(f"file '{p}'\n" for p in parts)
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", out_path],
            check=True, capture_output=True,
        )
    return out_path
