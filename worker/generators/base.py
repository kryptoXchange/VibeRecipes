from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class GeneratedClip:
    path: str
    seconds: float
    cost_usd: float


class ClipGenerator(ABC):
    """Provider-agnostic AI video interface. Implement one per provider."""

    @abstractmethod
    def generate(self, prompt: str, seconds: float, out_path: str) -> GeneratedClip: ...
