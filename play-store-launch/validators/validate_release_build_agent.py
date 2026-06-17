#!/usr/bin/env python3
"""Validate the release-build-agent MVP assets."""

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
    ".agents/skills/release-build-agent/SKILL.md",
    "docs/agents/PLAY_STORE_AGENT_REGISTRY.md",
    "docs/agents/PLAY_STORE_AGENT_MVP.md",
    "docs/launch/LAUNCH_INFO.md",
    "docs/release/PLAY_STORE_RELEASE_GATE.md",
    "docs/release/ANDROID_BUILD_READINESS.md",
    "docs/release/PLAY_STORE_TECHNICAL_BLOCKERS.md",
    "docs/release/release-build-agent-output.json",
    "docs/launch/release/PLAY_STORE_RELEASE_GATE.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "docs/release/PLAY_STORE_RELEASE_DRY_RUN.md",
    "artifacts/agno/play-store/m2/release-build-agent.json",
    "evals/agents/release-build-agent.eval.yaml",
)


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/release-build-agent/SKILL.md", "release-build-agent", errors)

    require_terms(
        root,
        "docs/release/PLAY_STORE_RELEASE_GATE.md",
        (
            "dry-run",
            "harness claim",
            "EAS",
            "Android package",
            "release_status",
            "blocked",
            "human review required",
            "release-build-agent-output.json",
        ),
        errors,
    )
    require_terms(
        root,
        ".agents/skills/release-build-agent/SKILL.md",
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
        ),
        errors,
    )
    require_terms(
        root,
        "docs/release/ANDROID_BUILD_READINESS.md",
        (
            "npm.cmd ci",
            "npm.cmd --prefix apps/mobile run typecheck",
            "npm.cmd --prefix apps/mobile run smoke:fixture",
            "npm.cmd --prefix apps/mobile run start:smoke",
            "npm.cmd run validate:preflight",
            "evidence_refs",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/release/PLAY_STORE_TECHNICAL_BLOCKERS.md",
        (
            "Android build",
            "EAS",
            "Play Console",
            "signing",
            "human review required",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/release/PLAY_STORE_RELEASE_DRY_RUN.md",
        (
            "eas submit",
            "Google Play API submission",
            "NEED_HUMAN",
            "human review required",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
        (
            "blocked",
            "dry-run",
            "NEED_HUMAN",
            "human review required",
        ),
        errors,
    )
    output = validate_agent_output(
        root,
        "docs/release/release-build-agent-output.json",
        "release-build-agent",
        errors,
        min_claims=5,
    )
    if isinstance(output, dict):
        if output.get("release_status") not in {"blocked", "needs_human"}:
            errors.append("release-build-agent-output.json release_status must be blocked or needs_human")
        if output.get("production_ready") is True:
            errors.append("release-build-agent-output.json must not set production_ready=true")
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m2/release-build-agent.json",
        "release-build-agent",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "release-build-agent",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate release-build-agent dry-run assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("RELEASE_BUILD_AGENT_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("RELEASE_BUILD_AGENT_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
