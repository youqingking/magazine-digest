#!/usr/bin/env python3
"""Validate command-safety docs for the no-credential runtime freeze.

This validator is intentionally narrow. It checks that the command-safety docs
exist, include required headings, and document the PowerShell `-ScenarioId`
wrapper form for `select:runtime-scenario`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REQUIRED_HEADINGS = {
    "docs/harness/COMMAND_SAFETY_MATRIX.md": (
        "Safety Classes",
        "Content And Runtime Commands",
        "Related Harness And Legacy Commands",
        "Git Status Rules",
        "NEED_HUMAN Triggers",
    ),
    "docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md": (
        "Source And Generated Boundary",
        "Command Profiles",
        "`build:test-inputs`",
        "`export:runtime-scenarios`",
        "`select:runtime-scenario`",
        "`export:mobile-fixtures`",
        "`validate:test-inputs`",
        "`smoke:test-inputs`",
        "Non-Mutation Expectations",
    ),
    "docs/runtime/RUNTIME_COMMAND_RUNBOOK.md": (
        "Before Running",
        "Safe Goal Validation Sequence",
        "Exact Command Forms",
        "After Running",
        "Rollback Recipes",
        "Stop Conditions",
    ),
    "docs/agents/COMMAND_SAFETY_AGENT_REGISTRY.md": (
        "Command Safety Agent",
        "Generated Output Steward",
        "Credential Gatekeeper",
        "Registry Rules",
    ),
}

REQUIRED_TERMS = (
    "npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix",
    "output/test-input-pack",
    "mobile/fixtures/runtime/current",
    "mobile/fixtures/runtime/scenarios",
    "fixtures/test-inputs",
    "generated-output-mutating",
    "credential-required",
    "unsafe-without-human",
    "git status --short",
    "git restore --",
    "NEED_HUMAN",
    "product_key",
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
            if f"## {heading}" not in text and f"### {heading}" not in text:
                errors.append(f"missing heading in {relative}: {heading}")

    all_text = "\n".join(combined)
    for term in REQUIRED_TERMS:
        if term not in all_text:
            errors.append(f"missing required term: {term}")

    forbidden_npm_form = "npm.cmd run select:runtime-scenario -- --scenario-id"
    if forbidden_npm_form in all_text:
        errors.append(
            "forbidden npm wrapper form documented; use PowerShell -ScenarioId instead"
        )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate command-safety docs for runtime fixture scripts."
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("COMMAND SAFETY MATRIX VALIDATION: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("COMMAND SAFETY MATRIX VALIDATION: PASS")
    print("- required command-safety docs are present")
    print("- required headings and source/generated paths are present")
    print("- PowerShell -ScenarioId npm wrapper form is documented")
    return 0


if __name__ == "__main__":
    sys.exit(main())
