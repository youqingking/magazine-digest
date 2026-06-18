"""Path bootstrap for Play Store launch validators."""

from __future__ import annotations

import sys
from pathlib import Path


def install_boundary_paths(current_file: str) -> None:
    boundary_root = Path(current_file).resolve().parents[1]
    for relative in ("shared", "validators", "workflow"):
        path = str(boundary_root / relative)
        if path not in sys.path:
            sys.path.insert(0, path)
