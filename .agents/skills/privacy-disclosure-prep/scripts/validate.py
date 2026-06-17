#!/usr/bin/env python3
"""Run the privacy-disclosure-prep validator from the launch boundary."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


VALIDATOR = "play-store-launch/validators/validate_privacy_disclosure_prep.py"


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate privacy-disclosure-prep outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    return subprocess.run([sys.executable, VALIDATOR, str(root)], cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
