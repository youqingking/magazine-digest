"""Compatibility wrapper for play-store-launch/shared/play_store_model_client.py."""

from __future__ import annotations

from _play_store_launch_wrapper import load_boundary_module


_IMPL = load_boundary_module(
    "shared/play_store_model_client.py",
    "_play_store_launch_play_store_model_client",
)

for _name, _value in vars(_IMPL).items():
    if not (_name.startswith("__") and _name.endswith("__")):
        globals()[_name] = _value
