#!/usr/bin/env python3
"""Validate screenshot-capture-agent L2 assets."""

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
    ".agents/skills/screenshot-capture-agent/SKILL.md",
    "docs/launch/screenshots/storyboard.md",
    "docs/launch/screenshots/shot-list.json",
    "docs/launch/screenshots/capture-report.md",
    "docs/launch/screenshots/capture-blockers.md",
    "docs/launch/screenshots/screenshot-capture-agent-output.json",
    "artifacts/agno/play-store/m4/screenshot-capture-agent.json",
    "evals/agents/screenshot-capture-agent.eval.yaml",
)


def validate_capture_output(root: Path, errors: list[str]) -> None:
    relative = "docs/launch/screenshots/screenshot-capture-agent-output.json"
    data = validate_agent_output(root, relative, "screenshot-capture-agent", errors, min_claims=4)
    if not isinstance(data, dict):
        return
    capture_status = data.get("capture_status")
    if capture_status not in {"blocked", "captured"}:
        errors.append(f"{relative} capture_status must be blocked or captured")
    screenshots = data.get("screenshots", [])
    if capture_status == "blocked":
        if screenshots:
            errors.append(f"{relative} must not list screenshots when capture_status=blocked")
    if capture_status == "captured":
        if not isinstance(screenshots, list) or not screenshots:
            errors.append(f"{relative} captured status requires screenshots")
        for shot in screenshots:
            if not isinstance(shot, dict):
                errors.append(f"{relative} screenshot entry is not an object")
                continue
            for field in ("path", "route", "device", "locale", "commit"):
                if field not in shot:
                    errors.append(f"{relative} screenshot entry missing field: {field}")
            path = shot.get("path")
            if isinstance(path, str) and not (root / path).is_file():
                errors.append(f"{relative} screenshot path missing on disk: {path}")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/screenshot-capture-agent/SKILL.md", "screenshot-capture-agent", errors)
    require_terms(
        root,
        ".agents/skills/screenshot-capture-agent/SKILL.md",
        (
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "EVIDENCE_LEDGER.md",
            "HUMAN_APPROVAL_GATE.md",
            "validator command",
            "capture_status=blocked",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/screenshots/capture-report.md",
        (
            "capture_status",
            "blocked",
            "adb devices",
            "screenshots captured",
            "human review required",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/screenshots/capture-blockers.md",
        (
            "capture_status=blocked",
            "adb devices",
            "No attached Android device",
            "Do not fabricate screenshots",
        ),
        errors,
    )
    validate_capture_output(root, errors)
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m4/screenshot-capture-agent.json",
        "screenshot-capture-agent",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "screenshot-capture-agent",
        errors,
        min_claims=5,
        min_evidence=6,
    )
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate screenshot-capture-agent assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("SCREENSHOT_CAPTURE_AGENT_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("SCREENSHOT_CAPTURE_AGENT_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
