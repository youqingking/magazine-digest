#!/usr/bin/env python3
"""Run the skill-local launch-info collector."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


COLLECTOR = Path(__file__).resolve().parent / "collect_launch_info.py"


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect launch-info-collector outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Report output directory")
    parser.add_argument("--source-json", action="append", default=[], help="Explicit launch-info JSON path")
    parser.add_argument("--source", action="append", default=[], help="Explicit product/launch text source")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    command = [
        sys.executable,
        str(COLLECTOR),
        "--root",
        str(root),
        "--output-dir",
        args.output_dir,
    ]
    for source_json in args.source_json:
        command.extend(["--source-json", source_json])
    for source in args.source:
        command.extend(["--source", source])
    return subprocess.run(command, cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
