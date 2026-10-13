from __future__ import annotations

import subprocess

from .base import ClipGenerator, GeneratedClip


class MockGenerator(ClipGenerator):
    """Placeholder clip (solid color + prompt text) so the pipeline runs with no provider or cost."""

    def generate(self, prompt: str, seconds: float, out_path: str) -> GeneratedClip:
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=0x334455:s=1280x720:r=30:d={seconds}",
             "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", out_path],
            check=True, capture_output=True,
        )
        return GeneratedClip(path=out_path, seconds=seconds, cost_usd=0.0)
