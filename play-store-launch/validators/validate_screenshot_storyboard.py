#!/usr/bin/env python3
"""Validate screenshot storyboard MVP assets."""

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
    require_skill_shape,
    require_terms,
    scan_for_forbidden_final_claims,
    scan_for_secret_patterns,
    validate_agent_output,
    validate_agno_step_artifact,
)


REQUIRED_FILES = (
    ".agents/skills/screenshot-storyboard/SKILL.md",
    "docs/launch/screenshots/storyboard.md",
    "docs/launch/screenshots/shot-list.json",
    "docs/launch/screenshots/screenshot-human-review-required.md",
    "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
    "docs/launch/screenshots/screenshot-validation-notes.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "artifacts/agno/play-store/m2/screenshot-storyboard.json",
    "evals/agents/screenshot-storyboard.eval.yaml",
)

ALLOWED_ROUTES = {"/", "/article/[articleId]", "/debug"}


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/screenshot-storyboard/SKILL.md", "screenshot-storyboard", errors)
    require_terms(
        root,
        ".agents/skills/screenshot-storyboard/SKILL.md",
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
            "docs/launch/screenshots/screenshot-validation-notes.md",
        ),
        errors,
    )

    require_terms(
        root,
        "docs/launch/screenshots/storyboard.md",
        (
            "human review required",
            "Public Candidate Shots",
            "Internal Evidence Shot",
            "Must not show",
            "Supabase",
            "RevenueCat",
            "Push",
            "evidence_refs",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/screenshots/screenshot-human-review-required.md",
        (
            "human review required",
            "capture",
            "image spec",
            "content authorization",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/screenshots/screenshot-validation-notes.md",
        (
            "Screenshot Validation Notes",
            "human review required",
            "Current Route Boundary",
            "NEED_HUMAN",
            "validate_screenshot_storyboard.py",
        ),
        errors,
    )

    data = load_json(root, "docs/launch/screenshots/shot-list.json", errors)
    if isinstance(data, dict):
        if data.get("status") != "draft":
            errors.append("shot-list.json expected status=draft")
        if data.get("human_review_required") is not True:
            errors.append("shot-list.json expected human_review_required=true")
        if data.get("submission_assets_created") is not False:
            errors.append("shot-list.json expected submission_assets_created=false")
        shots = data.get("shots")
        if not isinstance(shots, list) or len(shots) < 4:
            errors.append("shot-list.json expected at least 4 shots")
        else:
            debug_internal = False
            for shot in shots:
                if not isinstance(shot, dict):
                    errors.append("shot-list.json contains non-object shot")
                    continue
                shot_id = shot.get("id", "(missing id)")
                if shot.get("route") not in ALLOWED_ROUTES:
                    errors.append(f"{shot_id} has route outside current app routes: {shot.get('route')}")
                for field in (
                    "shot_id",
                    "screen_route",
                    "runtime_scenario_id",
                    "fixture_source",
                    "message",
                    "user_benefit",
                    "implemented_now",
                    "requires_capture",
                    "claim_ids",
                    "risk_notes",
                ):
                    if field not in shot:
                        errors.append(f"{shot_id} missing M2 shot field: {field}")
                if shot.get("human_review_required") is not True:
                    errors.append(f"{shot_id} expected human_review_required=true")
                if not shot.get("must_not_show"):
                    errors.append(f"{shot_id} missing must_not_show guardrails")
                if shot.get("availability") not in {"implemented", "implemented_internal"}:
                    errors.append(f"{shot_id} has unsupported availability: {shot.get('availability')}")
                if shot.get("route") == "/debug" and shot.get("audience") == "internal_evidence":
                    debug_internal = True
            if not debug_internal:
                errors.append("shot-list.json must mark /debug shot as internal_evidence")

    validate_agent_output(
        root,
        "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
        "screenshot-storyboard",
        errors,
        min_claims=4,
    )
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m2/screenshot-storyboard.json",
        "screenshot-storyboard",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "screenshot-storyboard",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate screenshot storyboard assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("SCREENSHOT_STORYBOARD_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("SCREENSHOT_STORYBOARD_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
