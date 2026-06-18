#!/usr/bin/env python3
"""Run the skill-local launch package assembler."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ASSEMBLER = Path(__file__).resolve().parent / "assemble_launch_package.py"


def main() -> int:
    parser = argparse.ArgumentParser(description="Assemble launch-package-agent outputs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Report output directory")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    command = [
        sys.executable,
        str(ASSEMBLER),
        "--root",
        str(root),
        "--output-dir",
        args.output_dir,
    ]
    return subprocess.run(command, cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
