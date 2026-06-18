#!/usr/bin/env python3
"""Run the google-play-listing gate for the current repository."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and validate google-play-listing draft outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root.")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Output directory.")
    parser.add_argument("--listing-json", action="append", default=[], help="Optional listing JSON path. Can be passed multiple times.")
    parser.add_argument("--asset-dir", action="append", default=[], help="Optional store asset directory. Can be passed multiple times.")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    script = Path(__file__).with_name("listing_gate.py")
    command = [
        sys.executable,
        str(script),
        "--root",
        str(root),
        "--output-dir",
        args.output_dir,
    ]
    for listing_json in args.listing_json:
        command.extend(["--listing-json", listing_json])
    for asset_dir in args.asset_dir:
        command.extend(["--asset-dir", asset_dir])
    return subprocess.run(command, cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
