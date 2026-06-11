#!/usr/bin/env python3
"""Validate reusable Phase A factory assets without touching runtime state."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REQUIRED_FILES = {
    "docs/factory/NO_CREDENTIAL_EXPO_RUNTIME_FOUNDATION_PATTERN.md": (
        "Runtime Object Freeze",
        "Content Package Contract",
        "Command Safety Matrix",
        "Expo Shell",
        "Dependency Workflow",
        "Runtime Data Port",
        "Fixture Adapter",
        "Supabase Seam",
        "PR Gate",
    ),
    "docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md": (
        "Copy",
        "Rename",
        "Regenerate",
        "App-Specific",
        "Product Key Changes",
        "What Not To Generalize",
    ),
    "codex_prompts/FACTORY_GOAL_NO_CREDENTIAL_EXPO_FOUNDATION.md": (
        "Objective",
        "Read First",
        "Allowed Work",
        "Forbidden Work",
        "Required Assets",
        "Validation",
        "Completion Report",
    ),
    ".agents/skills/no-credential-expo-foundation/SKILL.md": (
        "Workflow",
        "Audit Checklist",
        "Creation Checklist",
        "Validation",
        "Stop Conditions",
    ),
    "docs/factory/PHASE_A_EFFICIENCY_BASELINE.md": (
        "Goal Count",
        "Major Validators",
        "Reusable Modules",
        "Non-Reusable Decisions",
        "Expected Reuse Percentage",
    ),
}

REQUIRED_TERMS = (
    "no-credential",
    "Expo",
    "Expo Router",
    "product_key",
    "Supabase",
    "RevenueCat",
    "push",
    "fixture",
    "generated-output",
    "npm.cmd ci",
    "git diff --check",
    "git status --short",
    "NEED_HUMAN",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    combined: list[str] = []

    for relative, headings in REQUIRED_FILES.items():
        path = root / relative
        if not path.is_file():
            errors.append(f"missing required factory asset: {relative}")
            continue

        text = read_text(path)
        combined.append(text)
        for heading in headings:
            if f"## {heading}" not in text and f"# {heading}" not in text:
                errors.append(f"{relative} missing heading: {heading}")

    all_text = "\n".join(combined)
    for term in REQUIRED_TERMS:
        if term not in all_text:
            errors.append(f"factory assets missing required term: {term}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate required Phase A factory docs, prompt, and skill."
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("FACTORY_PHASE_A_ASSETS_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("FACTORY_PHASE_A_ASSETS_VALIDATION_PASSED")
    print(f"checked_factory_assets={len(REQUIRED_FILES)}")
    print(f"checked_required_terms={len(REQUIRED_TERMS)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
