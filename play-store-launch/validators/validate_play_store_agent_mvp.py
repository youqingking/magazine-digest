#!/usr/bin/env python3
"""Validate the aggregate Play Store agent MVP layer."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from play_store_agent_validation_lib import (
    changed_paths,
    is_allowed_path,
    require_files,
    require_terms,
    scan_for_forbidden_final_claims,
    scan_for_secret_patterns,
)
from validate_google_play_listing import validate as validate_google_play_listing
from validate_google_data_safety_agent import validate as validate_google_data_safety_agent
from validate_launch_info_collector import validate as validate_launch_info_collector
from validate_launch_package_agent import validate as validate_launch_package_agent
from validate_privacy_disclosure_prep import validate as validate_privacy_disclosure_prep
from validate_release_build_agent import validate as validate_release_build_agent
from validate_screenshot_capture_agent import validate as validate_screenshot_capture_agent
from validate_screenshot_storyboard import validate as validate_screenshot_storyboard


AGENT_VALIDATORS = (
    ("release-build-agent", "validate_release_build_agent.py"),
    ("privacy-disclosure-prep", "validate_privacy_disclosure_prep.py"),
    ("google-play-listing", "validate_google_play_listing.py"),
    ("screenshot-storyboard", "validate_screenshot_storyboard.py"),
    ("launch-info-collector", "validate_launch_info_collector.py"),
    ("google-data-safety-agent", "validate_google_data_safety_agent.py"),
    ("screenshot-capture-agent", "validate_screenshot_capture_agent.py"),
    ("launch-package-agent", "validate_launch_package_agent.py"),
)

SKILL_RESOURCE_FILES = tuple(
    f".agents/skills/{agent}/scripts/validate.py" for agent, _ in AGENT_VALIDATORS
) + tuple(f".agents/skills/{agent}/references/boundary.md" for agent, _ in AGENT_VALIDATORS)

REFERENCE_CATALOG_GROUPS = {
    "audit": tuple(
        f"docs/agents/{name}"
        for name in (
            "PLAY_STORE_AGENT_MVP.md",
            "PLAY_STORE_AGENT_MVP_FINAL_REVIEW.md",
            "PLAY_STORE_AGENT_MVP_GAP_AUDIT.md",
            "PLAY_STORE_AGENT_MVP_PR_SUMMARY.md",
            "PLAY_STORE_AGENT_MVP_VALIDATION_RESULTS.md",
            "PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md",
            "PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md",
            "PLAY_STORE_AGENT_REGISTRY.md",
        )
    ),
    "harness": tuple(
        f"docs/harness/play-store-agent-harness/{name}"
        for name in (
            "AGENT_PLUGIN_SPEC.md",
            "AGNO_REAL_RUN_STANDARD.md",
            "AGNO_STEP_PROTOCOL.md",
            "CLAIM_CLASSIFICATION.md",
            "CROSS_PRD_PROOF_PROTOCOL.md",
            "EVAL_PROTOCOL.md",
            "EVIDENCE_LEDGER.md",
            "FAILURE_MODES.md",
            "HUMAN_APPROVAL_GATE.md",
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "PER_AGENT_TRUTH_TABLE.md",
            "README.md",
            "REALITY_GATE.md",
            "RUN_ARTIFACT_SCHEMA.md",
            "VALIDATION_MATRIX.md",
        )
    ),
    "agno": tuple(
        f"docs/agno/{name}"
        for name in (
            "AGNO_L3_RUNBOOK.md",
            "AGNO_L3_RUNTIME_ADOPTION_PLAN.md",
            "AGNO_RUNTIME_CHECK.md",
            "PLAY_STORE_AGENT_TEAM.md",
            "PLAY_STORE_LAUNCH_WORKFLOW.md",
            "requirements-agno.txt",
            "runs/play-store-m2-old-four-run-20260612.md",
        )
    ),
    "archive": (
        "artifacts/agent-reality-runs/",
        "artifacts/launch-package/",
        "artifacts/agno/",
    ),
}

REQUIRED_FILES = (
    ".agents/skills/release-build-agent/SKILL.md",
    ".agents/skills/privacy-disclosure-prep/SKILL.md",
    ".agents/skills/google-play-listing/SKILL.md",
    ".agents/skills/screenshot-storyboard/SKILL.md",
    ".agents/skills/launch-info-collector/SKILL.md",
    ".agents/skills/google-data-safety-agent/SKILL.md",
    ".agents/skills/screenshot-capture-agent/SKILL.md",
    ".agents/skills/launch-package-agent/SKILL.md",
    *SKILL_RESOURCE_FILES,
    "docs/agents/PLAY_STORE_AGENT_REGISTRY.md",
    "docs/agents/PLAY_STORE_AGENT_MVP.md",
    "docs/launch/LAUNCH_INFO.md",
    "docs/launch/store-fields/source-of-truth.json",
    "docs/launch/launch-info-collector-output.json",
    "docs/launch/google-play/listing.en-US.json",
    "docs/launch/google-play/listing.zh-CN.json",
    "docs/launch/google-play/listing-validation-report.md",
    "docs/launch/google-play/google-play-listing-agent-output.json",
    "docs/launch/google-play/data-safety-draft.md",
    "docs/launch/google-play/data-safety-evidence.md",
    "docs/launch/google-play/data-safety-human-review-required.md",
    "docs/launch/google-play/google-data-safety-agent-output.json",
    "docs/launch/privacy/human-review-required.md",
    "docs/launch/privacy/privacy-disclosure-draft.md",
    "docs/launch/screenshots/storyboard.md",
    "docs/launch/screenshots/shot-list.json",
    "docs/launch/screenshots/screenshot-human-review-required.md",
    "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
    "docs/launch/screenshots/capture-report.md",
    "docs/launch/screenshots/capture-blockers.md",
    "docs/launch/screenshots/screenshot-capture-agent-output.json",
    "docs/launch/screenshots/screenshot-validation-notes.md",
    "docs/launch/release/PLAY_STORE_RELEASE_GATE.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "docs/privacy/DATA_INVENTORY.md",
    "docs/privacy/SDK_INVENTORY.md",
    "docs/privacy/privacy-disclosure-prep-output.json",
    "docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md",
    "docs/release/PLAY_STORE_RELEASE_GATE.md",
    "docs/release/ANDROID_BUILD_READINESS.md",
    "docs/release/PLAY_STORE_TECHNICAL_BLOCKERS.md",
    "docs/release/release-build-agent-output.json",
    "docs/release/PLAY_STORE_RELEASE_DRY_RUN.md",
    "docs/agno/PLAY_STORE_AGENT_TEAM.md",
    "docs/agno/PLAY_STORE_LAUNCH_WORKFLOW.md",
    "docs/agno/runs/play-store-m2-old-four-run-20260612.md",
    "docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md",
    "docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md",
    "play-store-launch/README.md",
    "play-store-launch/manifest.json",
    "play-store-launch/artifacts/README.md",
    "play-store-launch/references/README.md",
    "play-store-launch/references/catalog.json",
    "play-store-launch/schemas/codex-agent-output.schema.json",
    "play-store-launch/workflow/_boundary_bootstrap.py",
    "play-store-launch/workflow/run_play_store_agno_workflow.py",
    "play-store-launch/workflow/play_store_launch_readiness.py",
    "play-store-launch/workflow/play_store_agno_adapters.py",
    "play-store-launch/workflow/generate_agent_reality_outputs.py",
    "play-store-launch/shared/play_store_model_client.py",
    "play-store-launch/shared/play_store_agent_validation_lib.py",
    "play-store-launch/shared/agent_reality_validation.py",
    "play-store-launch/validators/_boundary_bootstrap.py",
    "play-store-launch/validators/validate_agent_reality_gate.py",
    "play-store-launch/validators/validate_play_store_launch_readiness_run.py",
    "play-store-launch/validators/validate_play_store_agno_l3.py",
    "play-store-launch/validators/validate_play_store_agent_mvp.py",
    "play-store-launch/validators/validate_play_store_agent_harness.py",
    "play-store-launch/validators/validate_release_build_agent.py",
    "play-store-launch/validators/validate_privacy_disclosure_prep.py",
    "play-store-launch/validators/validate_google_play_listing.py",
    "play-store-launch/validators/validate_screenshot_storyboard.py",
    "play-store-launch/validators/validate_launch_info_collector.py",
    "play-store-launch/validators/validate_google_data_safety_agent.py",
    "play-store-launch/validators/validate_screenshot_capture_agent.py",
    "play-store-launch/validators/validate_launch_package_agent.py",
    "artifacts/agno/play-store/m2/release-build-agent.json",
    "artifacts/agno/play-store/m2/privacy-disclosure-prep.json",
    "artifacts/agno/play-store/m2/google-play-listing.json",
    "artifacts/agno/play-store/m2/screenshot-storyboard.json",
    "artifacts/agno/play-store/m4/release-build-agent.json",
    "artifacts/agno/play-store/m4/privacy-disclosure-prep.json",
    "artifacts/agno/play-store/m4/google-play-listing.json",
    "artifacts/agno/play-store/m4/screenshot-storyboard.json",
    "artifacts/agno/play-store/m4/launch-info-collector.json",
    "artifacts/agno/play-store/m4/google-data-safety-agent.json",
    "artifacts/agno/play-store/m4/screenshot-capture-agent.json",
    "artifacts/agno/play-store/m4/launch-package-agent.json",
    "artifacts/launch-package/manifest.json",
    "artifacts/launch-package/readiness-report.md",
    "artifacts/launch-package/launch-package-agent-output.json",
    "scripts/agent_tools/_play_store_launch_wrapper.py",
    "scripts/agent_tools/agent_reality_validation.py",
    "scripts/agent_tools/generate_agent_reality_outputs.py",
    "scripts/agent_tools/play_store_agent_validation_lib.py",
    "scripts/agent_tools/play_store_agno_adapters.py",
    "scripts/agent_tools/play_store_launch_readiness.py",
    "scripts/agent_tools/play_store_model_client.py",
    "scripts/agent_tools/run_play_store_agno_workflow.py",
    "scripts/agent_tools/validate_agent_reality_gate.py",
    "scripts/agent_tools/validate_release_build_agent.py",
    "scripts/agent_tools/validate_privacy_disclosure_prep.py",
    "scripts/agent_tools/validate_google_play_listing.py",
    "scripts/agent_tools/validate_screenshot_storyboard.py",
    "scripts/agent_tools/validate_launch_info_collector.py",
    "scripts/agent_tools/validate_google_data_safety_agent.py",
    "scripts/agent_tools/validate_screenshot_capture_agent.py",
    "scripts/agent_tools/validate_launch_package_agent.py",
    "scripts/agent_tools/validate_play_store_agent_harness.py",
    "scripts/agent_tools/validate_play_store_agno_l3.py",
    "scripts/agent_tools/validate_play_store_launch_readiness_run.py",
    "scripts/agent_tools/validate_play_store_agent_mvp.py",
    "evals/agents/release-build-agent.eval.yaml",
    "evals/agents/privacy-disclosure-prep.eval.yaml",
    "evals/agents/google-play-listing.eval.yaml",
    "evals/agents/screenshot-storyboard.eval.yaml",
    "evals/agents/launch-info-collector.eval.yaml",
    "evals/agents/google-data-safety-agent.eval.yaml",
    "evals/agents/screenshot-capture-agent.eval.yaml",
    "evals/agents/launch-package-agent.eval.yaml",
    "evals/agents/play-store-agent-mvp.eval.yaml",
)

ALLOWED_PREFIXES = (
    ".agents/skills/release-build-agent/",
    ".agents/skills/privacy-disclosure-prep/",
    ".agents/skills/google-play-listing/",
    ".agents/skills/screenshot-storyboard/",
    ".agents/skills/launch-info-collector/",
    ".agents/skills/google-data-safety-agent/",
    ".agents/skills/screenshot-capture-agent/",
    ".agents/skills/launch-package-agent/",
    "docs/agents/",
    "docs/launch/",
    "docs/privacy/",
    "docs/release/",
    "docs/agno/",
    "docs/harness/play-store-agent-harness/",
    "play-store-launch/",
    "artifacts/agno/",
    "artifacts/agent-reality-runs/",
    "artifacts/launch-package/",
    "artifacts/play-store-launch/",
    "artifacts/screenshots/",
    "scripts/agent_tools/",
    "evals/agents/",
    "codex_prompts/",
    "docs/NEED_HUMAN.md",
)


def validate_changed_paths(root: Path, errors: list[str]) -> None:
    paths, git_error = changed_paths(root)
    if git_error:
        errors.append(git_error)
        return

    disallowed = [path for path in paths if not is_allowed_path(path, ALLOWED_PREFIXES)]
    if disallowed:
        errors.append(
            "git working tree has changes outside Play Store agent allowed paths: "
            + ", ".join(disallowed)
        )


def validate_skill_resources(root: Path, errors: list[str]) -> None:
    for agent, validator_file in AGENT_VALIDATORS:
        skill_path = root / ".agents" / "skills" / agent / "SKILL.md"
        script_path = root / ".agents" / "skills" / agent / "scripts" / "validate.py"
        reference_path = root / ".agents" / "skills" / agent / "references" / "boundary.md"

        try:
            skill_text = skill_path.read_text(encoding="utf-8")
        except OSError as exc:
            errors.append(f"{skill_path}: unable to read skill file: {exc}")
            continue

        for term in (
            "## Bundled Resources",
            "scripts/validate.py",
            "references/boundary.md",
            "play-store-launch/validators/",
            "play-store-launch/shared/",
        ):
            if term not in skill_text:
                errors.append(f"{skill_path}: missing skill resource term {term!r}")

        try:
            script_text = script_path.read_text(encoding="utf-8")
        except OSError as exc:
            errors.append(f"{script_path}: unable to read skill validator: {exc}")
            continue

        expected_validator = f"play-store-launch/validators/{validator_file}"
        if expected_validator not in script_text:
            errors.append(f"{script_path}: missing canonical validator {expected_validator}")
        if "subprocess.run" not in script_text:
            errors.append(f"{script_path}: skill validator must delegate instead of duplicating logic")

        try:
            reference_text = reference_path.read_text(encoding="utf-8")
        except OSError as exc:
            errors.append(f"{reference_path}: unable to read boundary reference: {exc}")
            continue

        for term in (
            "Skill-owned responsibility",
            "Canonical runtime",
            "Evidence boundary",
            "Shared logic boundary",
            "play-store-launch/shared/",
        ):
            if term not in reference_text:
                errors.append(f"{reference_path}: missing boundary reference term {term!r}")


def validate_reference_catalog(root: Path, errors: list[str]) -> None:
    catalog_path = root / "play-store-launch/references/catalog.json"
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{catalog_path}: unable to read reference catalog: {exc}")
        return

    if catalog.get("schema_version") != "play_store_launch_reference_catalog.v1":
        errors.append("play-store-launch/references/catalog.json schema_version mismatch")
    if catalog.get("phase") != "phase_5_reference_catalog_active":
        errors.append("play-store-launch/references/catalog.json phase must be phase_5_reference_catalog_active")

    policy = catalog.get("policy")
    if not isinstance(policy, dict):
        errors.append("play-store-launch/references/catalog.json missing policy object")
    else:
        expected_policy = {
            "ordinary_user_entrypoint": "play-store-launch/README.md",
            "do_not_copy_app_owned_evidence": True,
            "do_not_commit_generated_runtime_artifacts_by_default": True,
            "catalog_is_index_not_content_copy": True,
            "reality_gate": "FAIL_CLOSED",
            "safe_to_strengthen_final_store_claims": False,
        }
        for key, expected in expected_policy.items():
            if policy.get(key) != expected:
                errors.append(f"play-store-launch/references/catalog.json policy.{key} must be {expected!r}")

    groups = catalog.get("groups")
    if not isinstance(groups, list):
        errors.append("play-store-launch/references/catalog.json groups must be a list")
        return
    by_id = {group.get("id"): group for group in groups if isinstance(group, dict)}
    if set(by_id) != set(REFERENCE_CATALOG_GROUPS):
        errors.append(
            "play-store-launch/references/catalog.json groups must be exactly "
            + ", ".join(sorted(REFERENCE_CATALOG_GROUPS))
        )
        return

    for group_id, expected_paths in REFERENCE_CATALOG_GROUPS.items():
        group = by_id[group_id]
        if group.get("migration_strategy") not in {"indexed_reference_only", "root_manifest_only"}:
            errors.append(f"reference catalog group {group_id} has unsupported migration_strategy")
        actual_paths = tuple(group.get("paths") or ())
        if actual_paths != expected_paths:
            errors.append(f"reference catalog group {group_id} paths do not match expected launch references")
        for relative in actual_paths:
            if not (root / relative).exists():
                errors.append(f"reference catalog group {group_id} references missing path: {relative}")


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, REQUIRED_FILES, errors)
    validate_skill_resources(root, errors)
    validate_reference_catalog(root, errors)
    require_terms(
        root,
        "play-store-launch/manifest.json",
        (
            "phase_5_reference_catalog_active",
            "phase_5_reference_catalog",
            "phase_6_agno_native_orchestration_active",
            "phase_6_agno_native_orchestration",
            "agno_native_8_step_pipeline",
            "agno-step-ledger.jsonl",
            "play-store-launch/references/catalog.json",
            "phase_4_source_schema_and_artifact_policy",
            "play-store-launch/schemas/codex-agent-output.schema.json",
            "play-store-launch/artifacts/README.md",
            "play-store-launch/references/README.md",
            "phase_3_current_run_skill_binding",
            "skill_path",
            "skill_hash",
            "skill_hash_algorithm",
            "sha256",
            "FAIL_CLOSED",
            "safe_to_strengthen_final_store_claims",
        ),
        errors,
    )
    require_terms(
        root,
        "play-store-launch/README.md",
        (
            "Phase 3",
            "Phase 4",
            "Phase 5",
            "Phase 6",
            "agno_native_8_step_pipeline",
            "agno-step-ledger.jsonl",
            "skill_path",
            "skill_hash",
            "play-store-launch/references/catalog.json",
            "play-store-launch/schemas/codex-agent-output.schema.json",
            ".agents/skills/<agent-name>/SKILL.md",
            "Reality Gate remains `FAIL_CLOSED`",
        ),
        errors,
    )
    require_terms(
        root,
        "play-store-launch/artifacts/README.md",
        (
            "artifacts/play-store-launch/<run-id>/",
            "Runtime artifacts are not committed by default",
            "can_submit_google_play=false",
            "safe_to_strengthen_final_store_claims=false",
            "FAIL_CLOSED",
        ),
        errors,
    )
    require_terms(
        root,
        "play-store-launch/references/README.md",
        (
            "play-store-launch/references/catalog.json",
            "Do not copy app-owned evidence",
            "historical M0/M1/M2/M4/L3 outputs",
            "active runtime source",
            "play-store-launch/README.md",
        ),
        errors,
    )
    require_terms(
        root,
        "play-store-launch/schemas/codex-agent-output.schema.json",
        (
            "summary_zh",
            "confirmed_facts",
            "risks",
            "human_review_items",
            "next_steps",
            "evidence_ids_used",
            "additionalProperties",
        ),
        errors,
    )

    for name, validator in (
        ("release-build-agent", validate_release_build_agent),
        ("privacy-disclosure-prep", validate_privacy_disclosure_prep),
        ("google-play-listing", validate_google_play_listing),
        ("screenshot-storyboard", validate_screenshot_storyboard),
        ("launch-info-collector", validate_launch_info_collector),
        ("google-data-safety-agent", validate_google_data_safety_agent),
        ("screenshot-capture-agent", validate_screenshot_capture_agent),
        ("launch-package-agent", validate_launch_package_agent),
    ):
        child_errors = validator(root)
        errors.extend(f"{name}: {error}" for error in child_errors)

    require_terms(
        root,
        "docs/agents/PLAY_STORE_AGENT_REGISTRY.md",
        (
            "release-build-agent",
            "privacy-disclosure-prep",
            "google-play-listing",
            "screenshot-storyboard",
            "launch-info-collector",
            "google-data-safety-agent",
            "screenshot-capture-agent",
            "launch-package-agent",
            "human review required",
            "docs/launch/privacy/human-review-required.md",
            "docs/launch/release/PLAY_STORE_RELEASE_GATE.md",
            "canonical Play Store release gate path",
            "M2",
            "M4",
            "L2",
            "8-agent",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/agno/PLAY_STORE_LAUNCH_WORKFLOW.md",
        (
            "dry-run",
            "release-build-agent",
            "privacy-disclosure-prep",
            "google-play-listing",
            "screenshot-storyboard",
            "launch-info-collector",
            "google-data-safety-agent",
            "screenshot-capture-agent",
            "launch-package-agent",
            "docs/launch/release/PLAY_STORE_RELEASE_GATE.md",
            "DATA_INVENTORY.md",
            "SDK_INVENTORY.md",
            "docs/launch/privacy/human-review-required.md",
            "Google Play submission",
            "NEED_HUMAN",
            "dry_run_only",
            "8-agent",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md",
        (
            "release-build-agent",
            "privacy-disclosure-prep",
            "google-play-listing",
            "screenshot-storyboard",
            "current_maturity: L2",
            "launch-info-collector",
            "google-data-safety-agent",
            "screenshot-capture-agent",
            "launch-package-agent",
            "current_maturity: L2",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/agno/runs/play-store-m2-old-four-run-20260612.md",
        (
            "dry_run_only",
            "release-build-agent",
            "privacy-disclosure-prep",
            "google-play-listing",
            "screenshot-storyboard",
            "后四个 planned agents",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
        (
            "blocked",
            "Agno 可以 dry-run",
            "human review required",
            "NEED_HUMAN",
            "8-agent",
            "launch-package-agent",
            "RED",
        ),
        errors,
    )
    require_terms(
        root,
        "docs/agents/PLAY_STORE_AGENT_MVP.md",
        (
            "Intentional Release Gate Path",
            "docs/launch/release/PLAY_STORE_RELEASE_GATE.md",
            "DATA_INVENTORY.md",
            "SDK_INVENTORY.md",
            "human review required",
            "8-agent",
        ),
        errors,
    )
    validate_changed_paths(root, errors)
    scan_for_forbidden_final_claims(root, REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the Play Store agent MVP layer.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("PLAY_STORE_AGENT_MVP_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PLAY_STORE_AGENT_MVP_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print("status=pass")
    print("agno_dry_run_ready=true")
    return 0


if __name__ == "__main__":
    sys.exit(main())
