#!/usr/bin/env python3
"""Run the skill-local Google Data safety preparer."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


PREPARER = Path(__file__).resolve().parent / "prepare_data_safety.py"


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare Google Data safety evidence outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Report output directory")
    parser.add_argument("--evidence-json", action="append", default=[], help="Additional evidence JSON path")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    command = [
        sys.executable,
        str(PREPARER),
        "--root",
        str(root),
        "--output-dir",
        args.output_dir,
    ]
    for evidence_json in args.evidence_json:
        command.extend(["--evidence-json", evidence_json])
    return subprocess.run(command, cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
