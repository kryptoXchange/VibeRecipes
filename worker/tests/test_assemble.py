import json
import shutil
import subprocess

import pytest

from generators.mock import MockGenerator
from pipeline.assemble import assemble

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not installed")


def test_assemble_mock_clips(tmp_path):
    gen = MockGenerator()
    clips = [gen.generate("chop onion", 1, str(tmp_path / f"c{i}.mp4")).path for i in range(2)]
    out = assemble(clips, ["Chop the onion", "Heat the pan"], str(tmp_path / "out.mp4"))
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out],
        check=True, capture_output=True, text=True).stdout)
    assert 1.8 < float(probe["format"]["duration"]) < 2.5
