#!/usr/bin/env python3
"""Run the launch-info-collector validator from the launch boundary."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


VALIDATOR = "play-store-launch/validators/validate_launch_info_collector.py"


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate launch-info-collector outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    return subprocess.run([sys.executable, VALIDATOR, str(root)], cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
