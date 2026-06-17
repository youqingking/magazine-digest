"""Compatibility loader for Phase 1 Play Store launch boundary scripts."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def boundary_root() -> Path:
    return Path(__file__).resolve().parents[2] / "play-store-launch"


def install_boundary_paths() -> None:
    root = boundary_root()
    for relative in ("shared", "validators", "workflow"):
        path = str(root / relative)
        if path not in sys.path:
            sys.path.insert(0, path)


def load_boundary_module(relative_path: str, module_name: str):
    install_boundary_paths()
    target = boundary_root() / relative_path
    spec = importlib.util.spec_from_file_location(module_name, target)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load Play Store launch boundary module: {target}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module
