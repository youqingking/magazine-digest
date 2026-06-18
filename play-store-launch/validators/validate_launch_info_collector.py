#!/usr/bin/env python3
"""Validate launch-info-collector L2 assets."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from agent_reality_validation import validate_magazine_reality_artifact
from play_store_agent_validation_lib import (
    load_json,
    require_files,
    require_json_value,
    require_skill_shape,
    require_terms,
    scan_for_forbidden_final_claims,
    scan_for_secret_patterns,
    validate_agent_output,
    validate_agno_step_artifact,
)


REQUIRED_FILES = (
    ".agents/skills/launch-info-collector/SKILL.md",
    "docs/launch/LAUNCH_INFO.md",
    "docs/launch/store-fields/source-of-truth.json",
    "docs/launch/launch-info-collector-output.json",
    "artifacts/agno/play-store/m4/launch-info-collector.json",
    "evals/agents/launch-info-collector.eval.yaml",
)

REQUIRED_FIELD_STATUSES = {
    "observed_in_repo",
    "inferred",
    "missing",
    "needs_human",
}


def validate_source_of_truth(root: Path, errors: list[str]) -> None:
    relative = "docs/launch/store-fields/source-of-truth.json"
    data = load_json(root, relative, errors)
    if not isinstance(data, dict):
        return

    require_json_value(data, "status", "draft", errors, relative)
    require_json_value(data, "submission_scope", "dry-run_only", errors, relative)
    require_json_value(data, "human_review_required", True, errors, relative)
    require_json_value(data, "last_agent_update.agent", "launch-info-collector", errors, relative)
    require_json_value(data, "last_agent_update.submission_attempted", False, errors, relative)

    field_status = data.get("field_status")
    if not isinstance(field_status, dict):
        errors.append(f"{relative} missing field_status object")
        return
    required_fields = (
        "app.app_display_name",
        "app.public_listing_name_draft",
        "app.expo_slug",
        "app.scheme",
        "app.android_package",
        "app.eas_owner",
        "app.eas_project_id",
        "app.google_play_app",
        "google_play_fields.privacyPolicyUrl",
        "google_play_fields.contactEmail",
        "google_play_fields.category",
        "google_play_fields.contentRating",
        "google_play_fields.targetAudience",
    )
    for field in required_fields:
        entry = field_status.get(field)
        if not isinstance(entry, dict):
            errors.append(f"{relative} field_status missing entry: {field}")
            continue
        status = entry.get("status")
        if status not in REQUIRED_FIELD_STATUSES:
            errors.append(f"{relative} field_status {field} invalid status: {status!r}")
        if not entry.get("evidence_refs"):
            errors.append(f"{relative} field_status {field} missing evidence_refs")
        if status in {"missing", "needs_human"} and entry.get("human_review_required") is not True:
            errors.append(f"{relative} field_status {field} must set human_review_required=true")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/launch-info-collector/SKILL.md", "launch-info-collector", errors)
    require_terms(
        root,
        ".agents/skills/launch-info-collector/SKILL.md",
        (
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "EVIDENCE_LEDGER.md",
            "HUMAN_APPROVAL_GATE.md",
            "validator command",
            "observed_in_repo",
            "needs_human",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/LAUNCH_INFO.md",
        (
            "launch-info-collector",
            "Field Status",
            "observed_in_repo",
            "needs_human",
            "human review required",
            "Play Console",
            "source-of-truth.json",
        ),
        errors,
    )
    validate_source_of_truth(root, errors)
    validate_agent_output(
        root,
        "docs/launch/launch-info-collector-output.json",
        "launch-info-collector",
        errors,
        min_claims=5,
    )
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m4/launch-info-collector.json",
        "launch-info-collector",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "launch-info-collector",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate launch-info-collector assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("LAUNCH_INFO_COLLECTOR_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("LAUNCH_INFO_COLLECTOR_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
