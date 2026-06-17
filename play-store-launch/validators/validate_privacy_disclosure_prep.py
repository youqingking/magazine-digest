#!/usr/bin/env python3
"""Validate privacy-disclosure-prep MVP assets."""

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
    ".agents/skills/privacy-disclosure-prep/SKILL.md",
    "docs/privacy/DATA_INVENTORY.md",
    "docs/privacy/SDK_INVENTORY.md",
    "docs/privacy/privacy-disclosure-prep-output.json",
    "docs/launch/privacy/privacy-disclosure-draft.md",
    "docs/launch/google-play/data-safety-draft.md",
    "docs/launch/google-play/data-safety-evidence.md",
    "docs/launch/privacy/human-review-required.md",
    "docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "artifacts/agno/play-store/m2/privacy-disclosure-prep.json",
    "evals/agents/privacy-disclosure-prep.eval.yaml",
)


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(
        root,
        ".agents/skills/privacy-disclosure-prep/SKILL.md",
        "privacy-disclosure-prep",
        errors,
    )

    require_terms(
        root,
        ".agents/skills/privacy-disclosure-prep/SKILL.md",
        (
            "## Required Inputs",
            "## Expected Outputs",
            "## Do / Do Not Rules",
            "## Validation Steps",
            "## Final Report Format",
            "## Human Approval Points",
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "EVIDENCE_LEDGER.md",
            "HUMAN_APPROVAL_GATE.md",
            "validator command",
            "docs/privacy/DATA_INVENTORY.md",
            "docs/privacy/SDK_INVENTORY.md",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/privacy/DATA_INVENTORY.md",
        (
            "data inventory draft",
            "human review required",
            "harness claim",
            "evidence_refs",
            "Current Data Surfaces",
            "Not Evidenced In Current Shell",
            "NEED_HUMAN",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/privacy/privacy-disclosure-draft.md",
        (
            "privacy disclosure draft",
            "evidence_refs",
            "human review required",
            "not a Play Console answer",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/privacy/SDK_INVENTORY.md",
        (
            "SDK inventory draft",
            "human review required",
            "Current Repo Evidence",
            "NEED_HUMAN",
            "final Android artifact",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/data-safety-draft.md",
        (
            "Data safety",
            "draft",
            "human review required",
            "NEED_HUMAN",
            "Supabase",
            "RevenueCat",
            "Push",
            "live_service_connected",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/data-safety-evidence.md",
        (
            "Evidence Table",
            "reserved seam",
            "implemented code evidence",
            "human review required",
            "docs/NEED_HUMAN.md",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/privacy/human-review-required.md",
        (
            "Play Store launch privacy human-review gate",
            "legal approval",
            "NEED_HUMAN",
            "human review required",
            "Privacy policy URL",
            "Developer contact",
            "Data safety",
            "SDK inventory",
            "SDK disclosure",
            "children/family",
            "ads/tracking",
            "submission",
            "docs/NEED_HUMAN.md",
            "docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md",
            "docs/privacy/DATA_INVENTORY.md",
            "docs/privacy/SDK_INVENTORY.md",
            "docs/launch/google-play/data-safety-draft.md",
            "docs/launch/google-play/data-safety-evidence.md",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md",
        (
            "human review required",
            "Privacy policy URL",
            "SDK inventory",
            "Data collection",
            "Data sharing",
            "NEED_HUMAN",
        ),
        errors,
    )
    validate_agent_output(
        root,
        "docs/privacy/privacy-disclosure-prep-output.json",
        "privacy-disclosure-prep",
        errors,
        min_claims=5,
    )
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m2/privacy-disclosure-prep.json",
        "privacy-disclosure-prep",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "privacy-disclosure-prep",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate privacy disclosure prep assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("PRIVACY_DISCLOSURE_PREP_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PRIVACY_DISCLOSURE_PREP_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
