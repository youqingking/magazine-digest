#!/usr/bin/env python3
"""Validate repo-owned Agno L3 Play Store workflow artifacts."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from play_store_agent_validation_lib import CLAIM_CLASSES, CLAIM_STATUS_ENUM, SECRET_PATTERNS


DEPENDENCY_REF = "docs/agno/requirements-agno.txt"
RUNNER_REF = "scripts/agent_tools/run_play_store_agno_workflow.py"
CANONICAL_RUNNER_REF = "play-store-launch/workflow/run_play_store_agno_workflow.py"
L3_ROOT = "artifacts/agno/play-store/l3"
RUN_SCHEMA = "play_store_agno_l3_run.v1"
STEP_SCHEMA = "play_store_agno_l3_step_artifact.v1"
EXECUTION_MODE = "real_agno_orchestration"
AGNO_STATUS = "real_run"
STEP_MATURITY = {"L3", "L3-with-blockers"}

AGENT_ORDER = (
    "release-build-agent",
    "privacy-disclosure-prep",
    "google-play-listing",
    "screenshot-storyboard",
    "launch-info-collector",
    "google-data-safety-agent",
    "screenshot-capture-agent",
    "launch-package-agent",
)

AGENT_OUTPUTS = {
    "release-build-agent": "docs/release/release-build-agent-output.json",
    "privacy-disclosure-prep": "docs/privacy/privacy-disclosure-prep-output.json",
    "google-play-listing": "docs/launch/google-play/google-play-listing-agent-output.json",
    "screenshot-storyboard": "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
    "launch-info-collector": "docs/launch/launch-info-collector-output.json",
    "google-data-safety-agent": "docs/launch/google-play/google-data-safety-agent-output.json",
    "screenshot-capture-agent": "docs/launch/screenshots/screenshot-capture-agent-output.json",
    "launch-package-agent": "artifacts/launch-package/launch-package-agent-output.json",
}

LAUNCH_PACKAGE_OUTPUT_NAMES = (
    "PLAY_STORE_RELEASE_READINESS.zh-CN.md",
    "readiness-report.md",
    "manifest.json",
    "launch-package-agent-output.json",
    "NEED_HUMAN.md",
    "FILES_INCLUDED.txt",
)

AGENT_VALIDATORS = {
    "release-build-agent": "python scripts/agent_tools/validate_release_build_agent.py .",
    "privacy-disclosure-prep": "python scripts/agent_tools/validate_privacy_disclosure_prep.py .",
    "google-play-listing": "python scripts/agent_tools/validate_google_play_listing.py .",
    "screenshot-storyboard": "python scripts/agent_tools/validate_screenshot_storyboard.py .",
    "launch-info-collector": "python scripts/agent_tools/validate_launch_info_collector.py .",
    "google-data-safety-agent": "python scripts/agent_tools/validate_google_data_safety_agent.py .",
    "screenshot-capture-agent": "python scripts/agent_tools/validate_screenshot_capture_agent.py .",
    "launch-package-agent": "python scripts/agent_tools/validate_launch_package_agent.py .",
}

FORBIDDEN_RUNTIME_ACTIONS = (
    "play_console_api_called",
    "google_play_submission_attempted",
    "credentials_used",
    "production_action_performed",
    "c5_action_executed",
)


def load_json(path: Path, errors: list[str]) -> Any | None:
    if not path.is_file():
        errors.append(f"missing JSON file: {path.as_posix()}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{path.as_posix()} is not valid JSON: {exc}")
        return None


def git_value(root: Path, *args: str) -> str:
    result = subprocess.run(["git", *args], cwd=root, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def validate_dependency(root: Path, errors: list[str]) -> str | None:
    dep_path = root / DEPENDENCY_REF
    if not dep_path.is_file():
        errors.append(f"missing repo-owned Agno dependency pin: {DEPENDENCY_REF}")
        return None
    text = dep_path.read_text(encoding="utf-8")
    pins = [
        line.strip()
        for line in text.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    agno_pins = [line for line in pins if re.fullmatch(r"agno==[0-9]+(?:\.[0-9]+){1,3}", line)]
    if len(agno_pins) != 1:
        errors.append(f"{DEPENDENCY_REF} must contain exactly one exact agno==x.y.z pin")
        return None
    return agno_pins[0]


def validate_runner(root: Path, dependency_pin: str | None, errors: list[str]) -> None:
    wrapper = root / RUNNER_REF
    canonical_runner = root / CANONICAL_RUNNER_REF
    if not wrapper.is_file():
        errors.append(f"missing L3 runner: {RUNNER_REF}")
        return
    if not canonical_runner.is_file():
        errors.append(f"missing canonical L3 runner: {CANONICAL_RUNNER_REF}")
        return
    text = canonical_runner.read_text(encoding="utf-8")
    for term in (
        "agno.workflow",
        "Workflow(",
        DEPENDENCY_REF,
        EXECUTION_MODE,
        AGNO_STATUS,
        "play_store_agno_adapters",
    ):
        if term not in text:
            errors.append(f"{CANONICAL_RUNNER_REF} missing required runtime term: {term}")
    if dependency_pin and dependency_pin not in text:
        errors.append(f"{CANONICAL_RUNNER_REF} must reference dependency pin: {dependency_pin}")

    help_result = subprocess.run(
        [sys.executable, RUNNER_REF, "--help"],
        cwd=root,
        text=True,
        capture_output=True,
        check=False,
    )
    if help_result.returncode != 0:
        errors.append(f"runner command is not executable: {help_result.stderr.strip()}")


def latest_run_dir(root: Path, errors: list[str], requested_run_id: str | None) -> Path | None:
    l3_root = root / L3_ROOT
    if not l3_root.is_dir():
        errors.append(f"missing L3 artifact directory: {L3_ROOT}")
        return None
    if requested_run_id:
        run_dir = l3_root / requested_run_id
        if not (run_dir / "run.json").is_file():
            errors.append(f"requested L3 run is missing run.json: {run_dir.as_posix()}")
            return None
        return run_dir
    candidates = sorted(
        (path for path in l3_root.iterdir() if path.is_dir() and (path / "run.json").is_file()),
        key=lambda path: path.name,
    )
    if not candidates:
        errors.append(f"no L3 run directories with run.json found under {L3_ROOT}")
        return None
    return candidates[-1]


def require_value(data: dict[str, Any], key: str, expected: Any, source: str, errors: list[str]) -> None:
    value = data.get(key)
    if value != expected:
        errors.append(f"{source} expected {key}={expected!r}, found {value!r}")


def require_fields(data: dict[str, Any], fields: tuple[str, ...], source: str, errors: list[str]) -> None:
    for field in fields:
        if field not in data:
            errors.append(f"{source} missing required field: {field}")


def launch_package_output_refs(run_id: str) -> list[str]:
    return [f"artifacts/launch-package/{run_id}/{name}" for name in LAUNCH_PACKAGE_OUTPUT_NAMES]


def validate_claims(
    root: Path,
    agent_id: str,
    errors: list[str],
    output_ref: str | None = None,
) -> tuple[list[str], list[str], list[str]]:
    output_ref = output_ref or AGENT_OUTPUTS[agent_id]
    data = load_json(root / output_ref, errors)
    claim_ids: list[str] = []
    claim_classes: list[str] = []
    human_gate_blockers: list[str] = []
    if not isinstance(data, dict):
        return claim_ids, claim_classes, human_gate_blockers
    claims = data.get("claims")
    if not isinstance(claims, list) or not claims:
        errors.append(f"{output_ref} must contain non-empty claims for L3 validation")
        return claim_ids, claim_classes, human_gate_blockers
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            errors.append(f"{output_ref} claims[{index}] is not an object")
            continue
        claim_id = claim.get("claim_id")
        claim_class = claim.get("claim_class")
        status = claim.get("status")
        if isinstance(claim_id, str):
            claim_ids.append(claim_id)
        if isinstance(claim_class, str):
            claim_classes.append(claim_class)
        if status not in CLAIM_STATUS_ENUM:
            errors.append(f"{output_ref} {claim_id} invalid status for L3: {status!r}")
        if claim_class not in CLAIM_CLASSES:
            errors.append(f"{output_ref} {claim_id} invalid claim_class for L3: {claim_class!r}")
        if claim_class in {"C3", "C4", "C5"} and claim.get("human_review_required") is not True:
            errors.append(f"{output_ref} {claim_id} {claim_class} must keep human_review_required=true in L3")
        if claim_class == "C5" and status not in {"blocked", "needs_human", "missing", "not_applicable"}:
            errors.append(f"{output_ref} {claim_id} C5 must remain blocker-only in L3")
        if claim.get("human_review_required") is True:
            human_gate_blockers.append(str(claim_id))
    return claim_ids, sorted(set(claim_classes)), human_gate_blockers


def validate_screenshot_safety(root: Path, step: dict[str, Any], errors: list[str]) -> None:
    output_ref = AGENT_OUTPUTS["screenshot-capture-agent"]
    data = load_json(root / output_ref, errors)
    if not isinstance(data, dict):
        return
    capture_status = data.get("capture_status")
    screenshots = data.get("screenshots")
    if capture_status == "blocked":
        if screenshots:
            errors.append(f"{output_ref} must not list screenshots when capture_status=blocked")
        env_checks = step.get("environment_checks")
        if not isinstance(env_checks, dict) or "adb_devices" not in env_checks:
            errors.append("screenshot-capture-agent L3 step must record real adb devices environment check")
    elif capture_status == "captured":
        if not isinstance(screenshots, list) or not screenshots:
            errors.append(f"{output_ref} capture_status=captured requires screenshot metadata")
        for item in screenshots or []:
            if not isinstance(item, dict):
                errors.append(f"{output_ref} screenshot metadata entry is not an object")
                continue
            for field in ("path", "route", "device", "locale", "commit"):
                if field not in item:
                    errors.append(f"{output_ref} screenshot metadata missing field: {field}")
            path = item.get("path")
            if isinstance(path, str) and not (root / path).is_file():
                errors.append(f"{output_ref} screenshot file missing: {path}")
    else:
        errors.append(f"{output_ref} has invalid capture_status for L3: {capture_status!r}")


def validate_step(
    root: Path,
    run_dir: Path,
    run_id: str,
    agent_id: str,
    index: int,
    run_step_ref: str,
    errors: list[str],
) -> dict[str, Any] | None:
    step_path = root / run_step_ref
    expected_path = run_dir / "steps" / f"{index:02d}-{agent_id}.json"
    if step_path.resolve() != expected_path.resolve():
        errors.append(
            f"run.json step artifact for {agent_id} must be {expected_path.relative_to(root).as_posix()}, "
            f"found {run_step_ref}"
        )
    data = load_json(step_path, errors)
    if not isinstance(data, dict):
        return None

    source = step_path.relative_to(root).as_posix()
    require_fields(
        data,
        (
            "schema_version",
            "run_id",
            "step_id",
            "agent_id",
            "execution_mode",
            "agno_status",
            "maturity_level",
            "input_refs",
            "output_refs",
            "evidence_refs",
            "validator_command",
            "validator_exit_code",
            "started_at",
            "finished_at",
            "duration_ms",
            "exit_code",
            "generated_by_runner",
            "runtime_provenance",
            "validation_results",
            "blocked_reason",
        ),
        source,
        errors,
    )
    require_value(data, "schema_version", STEP_SCHEMA, source, errors)
    require_value(data, "run_id", run_id, source, errors)
    require_value(data, "agent_id", agent_id, source, errors)
    require_value(data, "execution_mode", EXECUTION_MODE, source, errors)
    require_value(data, "agno_status", AGNO_STATUS, source, errors)
    require_value(data, "generated_by_runner", True, source, errors)
    if data.get("maturity_level") not in STEP_MATURITY:
        errors.append(f"{source} maturity_level must be one of {sorted(STEP_MATURITY)}")
    if data.get("validator_command") != AGENT_VALIDATORS[agent_id]:
        errors.append(f"{source} validator_command mismatch for {agent_id}")
    if data.get("validator_exit_code") != 0:
        errors.append(f"{source} validator_exit_code must be 0")
    if data.get("exit_code") != 0:
        errors.append(f"{source} exit_code must be 0")
    for list_field in ("input_refs", "output_refs", "evidence_refs"):
        if not isinstance(data.get(list_field), list) or not data.get(list_field):
            errors.append(f"{source} {list_field} must be non-empty")
    output_ref_for_claims = AGENT_OUTPUTS[agent_id]
    if agent_id != "launch-package-agent" and AGENT_OUTPUTS[agent_id] not in data.get("output_refs", []):
        errors.append(f"{source} output_refs must include {AGENT_OUTPUTS[agent_id]}")
    if agent_id == "launch-package-agent":
        output_refs = data.get("output_refs", [])
        expected_refs = launch_package_output_refs(run_id)
        if set(output_refs) != set(expected_refs):
            errors.append(f"{source} launch-package-agent output_refs must equal the run-scoped launch package files")
        for relative in expected_refs:
            if relative not in output_refs:
                errors.append(f"{source} launch-package-agent output_refs missing {relative}")
            if not (root / relative).is_file():
                errors.append(f"{source} launch-package-agent output_ref file missing: {relative}")
        for relative in output_refs:
            if not isinstance(relative, str) or not relative.startswith(f"artifacts/launch-package/{run_id}/"):
                errors.append(f"{source} launch-package-agent output_refs must point to artifacts/launch-package/{run_id}/: {relative}")
        output_ref_for_claims = f"artifacts/launch-package/{run_id}/launch-package-agent-output.json"
    if data.get("agno_status") == "dry_run_only" and data.get("maturity_level") in STEP_MATURITY:
        errors.append(f"{source} dry_run_only must not be marked L3")
    provenance = data.get("runtime_provenance")
    if not isinstance(provenance, dict):
        errors.append(f"{source} runtime_provenance must be an object")
    else:
        for field in ("runner", "dependency_lock_ref", "agno_package", "agno_version", "workflow_module"):
            if not provenance.get(field):
                errors.append(f"{source} runtime_provenance missing {field}")

    claim_ids, claim_classes, human_gates = validate_claims(root, agent_id, errors, output_ref_for_claims)
    if set(data.get("claim_ids", [])) != set(claim_ids):
        errors.append(f"{source} claim_ids do not match {output_ref_for_claims}")
    if set(data.get("claim_classes", [])) != set(claim_classes):
        errors.append(f"{source} claim_classes do not match {output_ref_for_claims}")
    if human_gates and data.get("maturity_level") == "L3" and agent_id != "screenshot-capture-agent":
        errors.append(f"{source} has unresolved human gates and should be L3-with-blockers")
    if agent_id == "screenshot-capture-agent":
        validate_screenshot_safety(root, data, errors)
    return data


def validate_run(root: Path, run_dir: Path, errors: list[str]) -> None:
    run_path = run_dir / "run.json"
    data = load_json(run_path, errors)
    if not isinstance(data, dict):
        return
    source = run_path.relative_to(root).as_posix()
    require_fields(
        data,
        (
            "schema_version",
            "run_id",
            "execution_mode",
            "agno_status",
            "runner_command",
            "dependency_lock_ref",
            "branch",
            "commit",
            "started_at",
            "finished_at",
            "step_order",
            "step_artifacts",
            "validation_results",
            "readiness_color",
            "blocked_reasons",
            "safety",
        ),
        source,
        errors,
    )
    require_value(data, "schema_version", RUN_SCHEMA, source, errors)
    require_value(data, "execution_mode", EXECUTION_MODE, source, errors)
    require_value(data, "agno_status", AGNO_STATUS, source, errors)
    require_value(data, "dependency_lock_ref", DEPENDENCY_REF, source, errors)
    if RUNNER_REF not in str(data.get("runner_command")):
        errors.append(f"{source} runner_command must reference {RUNNER_REF}")
    current_commit = git_value(root, "rev-parse", "--short", "HEAD")
    parent_commit = git_value(root, "rev-parse", "--short", "HEAD^")
    allowed_commits = {value for value in (current_commit, parent_commit) if value}
    if allowed_commits and data.get("commit") not in allowed_commits:
        errors.append(
            f"{source} commit must match current HEAD or its first parent "
            f"because run artifacts are generated before the checkpoint commit; "
            f"allowed={sorted(allowed_commits)}, found={data.get('commit')!r}"
        )
    current_branch = git_value(root, "branch", "--show-current")
    if current_branch and data.get("branch") != current_branch:
        errors.append(f"{source} branch must match current branch {current_branch}")
    if data.get("step_order") != list(AGENT_ORDER):
        errors.append(f"{source} step_order must be the canonical 8-agent order")
    step_artifacts = data.get("step_artifacts")
    if not isinstance(step_artifacts, dict):
        errors.append(f"{source} step_artifacts must be an object")
        return
    for action in FORBIDDEN_RUNTIME_ACTIONS:
        if data.get("safety", {}).get(action) is not False:
            errors.append(f"{source} safety.{action} must be false")
    readiness = data.get("readiness_color")
    if readiness not in {"RED", "YELLOW", "GREEN"}:
        errors.append(f"{source} readiness_color must be RED/YELLOW/GREEN")
    unresolved = data.get("human_approval_summary", {}).get("unresolved_human_gates")
    if unresolved and readiness == "GREEN":
        errors.append(f"{source} readiness must not be GREEN with unresolved human gates")
    validation_results = data.get("validation_results")
    if not isinstance(validation_results, list) or len(validation_results) < len(AGENT_ORDER):
        errors.append(f"{source} validation_results must include all agent validator results")

    seen_run_ids: set[str] = set()
    for index, agent_id in enumerate(AGENT_ORDER, start=1):
        ref = step_artifacts.get(agent_id)
        if not isinstance(ref, str):
            errors.append(f"{source} missing step artifact ref for {agent_id}")
            continue
        step = validate_step(root, run_dir, data.get("run_id", ""), agent_id, index, ref, errors)
        if isinstance(step, dict):
            seen_run_ids.add(str(step.get("run_id")))
    if len(seen_run_ids) != 1 or data.get("run_id") not in seen_run_ids:
        errors.append(f"{source} all step artifacts must share the run_id {data.get('run_id')!r}")


def scan_l3_for_secrets(root: Path, run_dir: Path, errors: list[str]) -> None:
    for path in run_dir.rglob("*"):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for name, pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"{path.relative_to(root).as_posix()} contains possible credential pattern: {name}")


def validate(root: Path, run_id: str | None = None) -> list[str]:
    errors: list[str] = []
    dependency_pin = validate_dependency(root, errors)
    validate_runner(root, dependency_pin, errors)
    run_dir = latest_run_dir(root, errors, run_id)
    if run_dir is not None:
        validate_run(root, run_dir, errors)
        scan_l3_for_secrets(root, run_dir, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Play Store Agno L3 workflow artifacts.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--run-id", help="Specific L3 run_id to validate")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root, args.run_id)
    if errors:
        print("PLAY_STORE_AGNO_L3_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PLAY_STORE_AGNO_L3_VALIDATION_PASSED")
    print("status=pass")
    print("agno_status=real_run")
    return 0


if __name__ == "__main__":
    sys.exit(main())
