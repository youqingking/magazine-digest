#!/usr/bin/env python3
"""Validate google-data-safety-agent L2 assets."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from agent_reality_validation import validate_magazine_reality_artifact
from play_store_agent_validation_lib import (
    require_files,
    require_skill_shape,
    require_terms,
    scan_for_forbidden_final_claims,
    scan_for_secret_patterns,
    validate_agent_output,
    validate_agno_step_artifact,
)


REQUIRED_FILES = (
    ".agents/skills/google-data-safety-agent/SKILL.md",
    "docs/privacy/DATA_INVENTORY.md",
    "docs/privacy/SDK_INVENTORY.md",
    "docs/launch/LAUNCH_INFO.md",
    "docs/launch/google-play/data-safety-draft.md",
    "docs/launch/google-play/data-safety-evidence.md",
    "docs/launch/google-play/data-safety-human-review-required.md",
    "docs/launch/google-play/google-data-safety-agent-output.json",
    "artifacts/agno/play-store/m4/google-data-safety-agent.json",
    "evals/agents/google-data-safety-agent.eval.yaml",
)


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/google-data-safety-agent/SKILL.md", "google-data-safety-agent", errors)
    require_terms(
        root,
        ".agents/skills/google-data-safety-agent/SKILL.md",
        (
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "EVIDENCE_LEDGER.md",
            "HUMAN_APPROVAL_GATE.md",
            "validator command",
            "C3",
            "C4",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/data-safety-draft.md",
        (
            "google-data-safety-agent",
            "evidence draft",
            "human review required",
            "DATA_INVENTORY.md",
            "SDK_INVENTORY.md",
            "not a Play Console answer",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/data-safety-evidence.md",
        (
            "Evidence Table",
            "evidence.gdsa",
            "DATA_INVENTORY.md",
            "SDK_INVENTORY.md",
            "human review required",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/data-safety-human-review-required.md",
        (
            "human review required",
            "Privacy policy URL",
            "Developer contact",
            "Data Safety",
            "SDK disclosure",
            "children/family",
            "ads/tracking",
        ),
        errors,
    )
    validate_agent_output(
        root,
        "docs/launch/google-play/google-data-safety-agent-output.json",
        "google-data-safety-agent",
        errors,
        min_claims=5,
    )
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m4/google-data-safety-agent.json",
        "google-data-safety-agent",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "google-data-safety-agent",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate google-data-safety-agent assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("GOOGLE_DATA_SAFETY_AGENT_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("GOOGLE_DATA_SAFETY_AGENT_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
