#!/usr/bin/env python3
"""Validate Google Play listing MVP assets."""

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
    ".agents/skills/google-play-listing/SKILL.md",
    "docs/launch/store-fields/source-of-truth.json",
    "docs/launch/google-play/listing.en-US.json",
    "docs/launch/google-play/listing.zh-CN.json",
    "docs/launch/google-play/listing-validation-report.md",
    "docs/launch/google-play/google-play-listing-agent-output.json",
    "docs/launch/LAUNCH_INFO.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "artifacts/agno/play-store/m2/google-play-listing.json",
    "evals/agents/google-play-listing.eval.yaml",
)


def validate_listing_json(root: Path, relative: str, expected_locale: str, errors: list[str]) -> None:
    data = load_json(root, relative, errors)
    if not isinstance(data, dict):
        return

    require_json_value(data, "locale", expected_locale, errors, relative)
    require_json_value(data, "status", "draft", errors, relative)
    require_json_value(data, "human_review_required", True, errors, relative)
    require_json_value(
        data,
        "claims_guardrails.submission_attempted",
        False,
        errors,
        relative,
    )
    require_json_value(
        data,
        "claims_guardrails.do_not_claim_unavailable_features",
        True,
        errors,
        relative,
    )
    require_json_value(
        data,
        "claims_guardrails.legal_privacy_trademark_submission_human_review_required",
        True,
        errors,
        relative,
    )
    for key in ("appName", "shortDescription", "fullDescription", "contactEmail", "privacyPolicyUrl"):
        if key not in data or not data[key]:
            errors.append(f"{relative} missing non-empty listing field: {key}")
    field_limits = {
        "appName": 30,
        "shortDescription": 80,
        "fullDescription": 4000,
    }
    for key, limit in field_limits.items():
        value = data.get(key)
        if isinstance(value, str) and len(value) > limit:
            errors.append(f"{relative} {key} exceeds Google Play draft limit: {len(value)} > {limit}")
    for key in ("contactEmail", "privacyPolicyUrl", "category", "contentRating", "targetAudience"):
        if data.get(key) != "NEED_HUMAN":
            errors.append(f"{relative} expected {key}=NEED_HUMAN before human review")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/google-play-listing/SKILL.md", "google-play-listing", errors)
    require_terms(
        root,
        ".agents/skills/google-play-listing/SKILL.md",
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
            "appName <= 30",
            "shortDescription <= 80",
            "fullDescription <= 4000",
        ),
        errors,
    )

    source = load_json(root, "docs/launch/store-fields/source-of-truth.json", errors)
    if isinstance(source, dict):
        require_json_value(source, "status", "draft", errors, "docs/launch/store-fields/source-of-truth.json")
        require_json_value(
            source,
            "submission_scope",
            "dry-run_only",
            errors,
            "docs/launch/store-fields/source-of-truth.json",
        )
        require_json_value(
            source,
            "human_review_required",
            True,
            errors,
            "docs/launch/store-fields/source-of-truth.json",
        )
        require_json_value(
            source,
            "last_agent_update.submission_attempted",
            False,
            errors,
            "docs/launch/store-fields/source-of-truth.json",
        )
        must_not_claim = source.get("claim_guardrails", {}).get("must_not_claim", [])
        for term in ("live cloud sync", "paid subscription purchase", "push notifications available"):
            if term not in must_not_claim:
                errors.append(f"source-of-truth claim_guardrails.must_not_claim missing: {term}")

    validate_listing_json(root, "docs/launch/google-play/listing.en-US.json", "en-US", errors)
    validate_listing_json(root, "docs/launch/google-play/listing.zh-CN.json", "zh-CN", errors)

    require_terms(
        root,
        "docs/launch/LAUNCH_INFO.md",
        (
            "Implemented Runtime Surface",
            "Reserved But Not Implemented",
            "human review required",
            "NEED_HUMAN",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/listing-validation-report.md",
        (
            "Listing Validation Report",
            "appName",
            "shortDescription",
            "fullDescription",
            "human review required",
            "NEED_HUMAN",
            "evidence_refs",
            "forbidden_terms",
        ),
        errors,
    )
    output = validate_agent_output(
        root,
        "docs/launch/google-play/google-play-listing-agent-output.json",
        "google-play-listing",
        errors,
        min_claims=4,
    )
    if isinstance(output, dict):
        if output.get("listing_status") != "draft":
            errors.append("google-play-listing-agent-output.json listing_status must be draft")
        forbidden_terms = output.get("forbidden_terms_checked")
        if not isinstance(forbidden_terms, list) or "#1" not in forbidden_terms or "award-winning" not in forbidden_terms:
            errors.append("google-play-listing-agent-output.json missing forbidden_terms_checked coverage")
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m2/google-play-listing.json",
        "google-play-listing",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "google-play-listing",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Google Play listing draft assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("GOOGLE_PLAY_LISTING_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("GOOGLE_PLAY_LISTING_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
