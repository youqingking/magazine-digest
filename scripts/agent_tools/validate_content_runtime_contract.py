#!/usr/bin/env python3
"""Validate content/runtime contract docs.

This validator is intentionally narrow. It checks required docs, headings, and
mentions of current source paths only. It does not replace content validators or
inspect fixture semantics.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REQUIRED_HEADINGS = {
    "docs/content/CONTENT_PACKAGE_CONTRACT.md": (
        "Package Identity",
        "Publication",
        "Article",
        "Article Variant",
        "Language",
        "Audience Segment",
        "Reading Mode",
        "Revision",
        "Publish Status And Publish At",
        "Premium Tier",
        "Source Kind",
        "Content Hash",
        "Fallback Policy",
        "Update Metadata",
        "Tombstone Delete Semantics",
        "Forbidden Pipeline Responsibilities",
    ),
    "docs/runtime/RUNTIME_FIXTURE_CONTRACT.md": (
        "Canonical Test Inputs",
        "Build Scripts",
        "Built Runtime Outputs",
        "Mobile Fixture Exports",
        "Source Vs Generated",
        "Runtime Bundle Shape",
        "Scenario Selection Rules",
        "No Pipeline Implementation",
    ),
    "docs/runtime/RUNTIME_SCENARIO_MATRIX.md": (
        "Scenario Matrix",
        "Risk Coverage Checklist",
        "Selection Rules",
        "Product Key Rule",
    ),
    "docs/architecture/CONTENT_PIPELINE_HANDOFF.md": (
        "External Pipeline Owns",
        "Repo Owns",
        "Handoff Object",
        "Runtime Can Assume",
        "Runtime Must Verify",
        "Runtime Must Not Assume",
        "Current Synthetic Handoff",
        "Failure Modes",
    ),
    "docs/agents/CONTENT_RUNTIME_AGENT_REGISTRY.md": (
        "Allowed Narrow Skills",
        "Content Package Contract Agent",
        "Runtime Fixture Contract Agent",
        "Product Key Guardian",
        "Scenario Matrix Reviewer",
        "Registry Rules",
    ),
}

REQUIRED_TERMS = (
    "product_key",
    "fixtures/test-inputs",
    "scripts/content",
    "output/test-input-pack",
    "mobile/fixtures/runtime",
    "validate-synthetic-test-pack",
    "build-synthetic-test-pack",
    "export-runtime-scenarios",
    "select-runtime-scenario",
    "PDF parsing",
    "web scraping",
    "prompt generation",
    "markdown generation",
    "pipeline scheduling",
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
            errors.append(f"missing required term or source path: {term}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate required content/runtime contract docs and source-path mentions."
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("CONTENT RUNTIME CONTRACT VALIDATION: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("CONTENT RUNTIME CONTRACT VALIDATION: PASS")
    print("- required docs are present")
    print("- required headings are present")
    print("- current script and fixture paths are mentioned")
    return 0


if __name__ == "__main__":
    sys.exit(main())
