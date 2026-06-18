"""Compatibility wrapper for play-store-launch/workflow/play_store_launch_readiness.py."""

from __future__ import annotations

from _play_store_launch_wrapper import load_boundary_module


_IMPL = load_boundary_module(
    "workflow/play_store_launch_readiness.py",
    "_play_store_launch_play_store_launch_readiness",
)

for _name, _value in vars(_IMPL).items():
    if not (_name.startswith("__") and _name.endswith("__")):
        globals()[_name] = _value
