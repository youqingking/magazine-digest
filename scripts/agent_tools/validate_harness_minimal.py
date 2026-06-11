#!/usr/bin/env python3
"""Validate the minimal agent harness landing.

This check is intentionally narrow: it proves the additive harness files exist,
that only the three approved local skills are present, and that current git
changes stay inside the harness landing allowlist.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


EXPECTED_SKILLS = {
    "owner-card",
    "reality-object-compiler",
    "repo-audit",
}

REQUIRED_FILES = (
    "AGENTS.md",
    "docs/agents/AGENT_REGISTRY.md",
    "docs/harness/HARNESS_LANDING_PLAN.md",
    "docs/harness/HARNESS_OPERATING_NOTE.md",
    "scripts/agent_tools/validate_harness_minimal.py",
    ".agents/skills/owner-card/SKILL.md",
    ".agents/skills/reality-object-compiler/SKILL.md",
    ".agents/skills/repo-audit/SKILL.md",
)

ALLOWED_PREFIXES = (
    "AGENTS.md",
    "docs/harness/",
    "docs/agents/",
    ".agents/skills/repo-audit/",
    ".agents/skills/owner-card/",
    ".agents/skills/reality-object-compiler/",
    "scripts/agent_tools/",
    "evals/agents/",
    "codex_prompts/",
)


def as_posix(path: str) -> str:
    return path.replace("\\", "/")


def is_allowed(path: str) -> bool:
    normalized = as_posix(path)
    return any(
        normalized == prefix.rstrip("/") or normalized.startswith(prefix)
        for prefix in ALLOWED_PREFIXES
    )


def parse_porcelain_path(line: str) -> str | None:
    if not line:
        return None

    payload = line[3:] if len(line) > 3 else ""
    if " -> " in payload:
        payload = payload.split(" -> ", 1)[1]
    return payload.strip().strip('"') or None


def changed_paths(root: Path) -> tuple[list[str], str | None]:
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "-uall"],
            cwd=root,
            text=True,
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        return [], f"git status unavailable: {exc}"

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        return [], f"git status failed: {detail}"

    paths: list[str] = []
    for line in result.stdout.splitlines():
        path = parse_porcelain_path(line)
        if path:
            paths.append(as_posix(path))
    return paths, None


def validate(root: Path) -> list[str]:
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if not (root / relative).is_file():
            errors.append(f"missing required file: {relative}")

    skills_root = root / ".agents" / "skills"
    if skills_root.exists():
        found = {
            child.name
            for child in skills_root.iterdir()
            if child.is_dir() and not child.name.startswith(".")
        }
        if found != EXPECTED_SKILLS:
            expected = ", ".join(sorted(EXPECTED_SKILLS))
            actual = ", ".join(sorted(found)) or "(none)"
            errors.append(
                f"unexpected skill set under .agents/skills: expected [{expected}], found [{actual}]"
            )
    else:
        errors.append("missing skills directory: .agents/skills")

    paths, git_error = changed_paths(root)
    if git_error:
        errors.append(git_error)
    else:
        disallowed = [path for path in paths if not is_allowed(path)]
        if disallowed:
            errors.append(
                "git working tree has changes outside allowed harness paths: "
                + ", ".join(disallowed)
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate the minimal repo harness landing."
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=".",
        help="Repository root to validate.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("HARNESS MINIMAL VALIDATION: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("HARNESS MINIMAL VALIDATION: PASS")
    print("- required files are present")
    print("- only approved core skills are present")
    print("- current git changes are limited to harness-allowed paths")
    return 0


if __name__ == "__main__":
    sys.exit(main())
