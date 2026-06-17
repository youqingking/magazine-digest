#!/usr/bin/env python3
"""Compatibility wrapper for play-store-launch/validators/validate_privacy_disclosure_prep.py."""

from __future__ import annotations

from _play_store_launch_wrapper import load_boundary_module


_IMPL = load_boundary_module(
    "validators/validate_privacy_disclosure_prep.py",
    "_play_store_launch_validate_privacy_disclosure_prep",
)

for _name, _value in vars(_IMPL).items():
    if not (_name.startswith("__") and _name.endswith("__")):
        globals()[_name] = _value


if __name__ == "__main__":
    raise SystemExit(main())
