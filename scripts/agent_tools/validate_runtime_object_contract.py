#!/usr/bin/env python3
"""Validate the Magazine Digest runtime object contract docs.

This validator is intentionally narrow. It checks only required files and
headings so it can run during documentation-only contract work without touching
runtime behavior, package config, generated state, or external services.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REQUIRED_HEADINGS = {
    "docs/product/REALITY_OBJECT_CARD.md": (
        "Surface Label",
        "Real Species",
        "Seductive Class",
        "Mechanism Class",
        "Failure Class",
        "Repo Boundary",
        "External Pipeline Boundary",
        "Runtime App Boundary",
        "Trust Dependency",
        "Verification Depth",
        "Main Clock",
        "Not This Object",
    ),
    "docs/product/CANONICAL_OBJECT_CONTRACT.md": (
        "Input Object",
        "Output Object",
        "Truth Sources",
        "Canonical State Boundaries",
        "Product Key Rule",
        "Allowed In-Repo Transforms",
        "Forbidden Transforms",
        "Legacy Reference Policy",
        "Runtime Object Tests",
    ),
    "docs/product/QUESTION_COMPILER_CARD.md": (
        "Runtime Shell",
        "Content Pipeline Out Of Repo",
        "Supabase Auth Data",
        "RevenueCat",
        "Notifications Growth",
        "Expo EAS Device Readiness",
        "NEED_HUMAN Blockers",
    ),
    "docs/architecture/RUNTIME_BOUNDARY.md": (
        "External Pipeline",
        "Standardized Content Package",
        "App Runtime",
        "Supabase",
        "RevenueCat",
        "Notifications",
        "Legacy Reference",
    ),
    "docs/agents/RUNTIME_AGENT_REGISTRY.md": (
        "Runtime Contract Agent",
        "Runtime Shell Agent",
        "External Pipeline Boundary Agent",
        "Supabase Runtime Data Agent",
        "RevenueCat Agent",
        "Notifications Agent",
        "Legacy Reference Agent",
    ),
}

REQUIRED_TERMS = (
    "product_key",
    "PDF parsing",
    "web scraping",
    "prompt generation",
    "markdown generation",
    "pipeline scheduling",
    "apps/mobile",
    "packages/core-*",
    "infra/supabase",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    combined: list[str] = []

    for relative, headings in REQUIRED_HEADINGS.items():
        path = root / relative
        if not path.is_file():
            errors.append(f"missing required file: {relative}")
            continue

        text = read_text(path)
        combined.append(text)
        for heading in headings:
            if f"## {heading}" not in text:
                errors.append(f"missing heading in {relative}: ## {heading}")

    all_text = "\n".join(combined)
    for term in REQUIRED_TERMS:
        if term not in all_text:
            errors.append(f"missing required contract term: {term}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate required runtime object contract docs and headings."
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("RUNTIME OBJECT CONTRACT VALIDATION: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("RUNTIME OBJECT CONTRACT VALIDATION: PASS")
    print("- required docs are present")
    print("- required headings are present")
    print("- required boundary terms are present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
