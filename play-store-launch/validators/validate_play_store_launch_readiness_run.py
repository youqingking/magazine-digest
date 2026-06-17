#!/usr/bin/env python3
"""Validate a fresh AI-backed Play Store launch-readiness workflow run."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)


AGENTS = (
    "release-build-agent",
    "privacy-disclosure-prep",
    "google-play-listing",
    "screenshot-storyboard",
    "launch-info-collector",
    "google-data-safety-agent",
    "screenshot-capture-agent",
    "launch-package-agent",
)

UPSTREAM_AGENTS = AGENTS[:-1]
RUN_SCHEMA = "play_store_launch_readiness_run.v2"
REPORT_SCHEMA = "play_store_launch_readiness_report.v2"
STEP_SCHEMA = "play_store_launch_readiness_step.v2"
AGNO_ORCHESTRATION_MODE = "agno_native_8_step_pipeline"
AGNO_WORKFLOW_ID = "play-store-launch-readiness-workflow"
SENTINEL = "DO_NOT_READ_OLD_AGENT_OUTPUT_SENTINEL"
OLD_ARTIFACT_PREFIXES = (
    "artifacts/agent-reality-runs/",
    "artifacts/launch-package/",
)
FORBIDDEN_ARTIFACT_MARKERS = (
    SENTINEL,
    *OLD_ARTIFACT_PREFIXES,
)
FORBIDDEN_SUCCESS_WORDS = (
    "approved",
    "ready_to_submit",
    "submitted",
    "can_submit_google_play=true",
)
CODEX_REQUIRED_FIELDS = (
    "provider",
    "auth_method",
    "command",
    "prompt_id",
    "prompt_hash",
    "input_evidence_ids",
    "output_path",
    "exit_code",
    "started_at",
    "completed_at",
)
CODEX_OUTPUT_REQUIRED_FIELDS = (
    "summary_zh",
    "confirmed_facts",
    "risks",
    "human_review_items",
    "next_steps",
    "evidence_ids_used",
)
CANONICAL_CODEX_OUTPUT_SCHEMA = "play-store-launch/schemas/codex-agent-output.schema.json"
BOUNDARY_WORDS = (
    "not ",
    "false",
    "blocked",
    "fail-closed",
    "forbidden",
    "must not",
    "不得",
    "不能",
    "禁止",
    "未",
    "没有",
)


def rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def load_json(path: Path, errors: list[str]) -> Any | None:
    if not path.is_file():
        errors.append(f"missing JSON file: {path.as_posix()}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{path.as_posix()} is not valid JSON: {exc}")
        return None


def load_jsonl(path: Path, errors: list[str]) -> list[dict[str, Any]]:
    if not path.is_file():
        errors.append(f"missing JSONL file: {path.as_posix()}")
        return []
    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            errors.append(f"{path.as_posix()}:{line_number} invalid JSONL row: {exc}")
            continue
        if not isinstance(row, dict):
            errors.append(f"{path.as_posix()}:{line_number} JSONL row must be object")
            continue
        rows.append(row)
    return rows


def latest_run_dir(root: Path, requested: str | None, errors: list[str]) -> Path | None:
    base = root / "artifacts/play-store-launch"
    if requested:
        path = base / requested
        if not path.is_dir():
            errors.append(f"requested launch-readiness run is missing: {path.as_posix()}")
            return None
        return path
    if not base.is_dir():
        errors.append("missing artifacts/play-store-launch directory")
        return None
    candidates = sorted(path for path in base.iterdir() if path.is_dir() and (path / "run.json").is_file())
    if not candidates:
        errors.append("missing artifacts/play-store-launch/<run-id>/run.json")
        return None
    return candidates[-1]


def require_file(path: Path, errors: list[str]) -> None:
    if not path.is_file():
        errors.append(f"missing required file: {path.as_posix()}")
    elif path.stat().st_size == 0:
        errors.append(f"required file is empty: {path.as_posix()}")


def has_boundary(text: str) -> bool:
    lowered = text.lower()
    return any(word in lowered for word in BOUNDARY_WORDS)


def scan_text_safety(path: Path, errors: list[str]) -> None:
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for marker in FORBIDDEN_ARTIFACT_MARKERS:
        if marker in text.replace("\\", "/"):
            errors.append(f"{path.as_posix()} contains forbidden old-artifact marker: {marker}")
    for line_number, line in enumerate(text.splitlines(), start=1):
        lowered = line.lower()
        for word in FORBIDDEN_SUCCESS_WORDS:
            if word in lowered and not has_boundary(line):
                errors.append(f"{path.as_posix()}:{line_number} contains unbounded final status word: {word}")


def require_chinese_doc(path: Path, errors: list[str], *, min_chars: int = 80) -> None:
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    chinese_count = len(re.findall(r"[\u4e00-\u9fff]", text))
    if chinese_count < min_chars:
        errors.append(f"{path.as_posix()} must be Chinese-first, found only {chinese_count} Chinese characters")
    scan_text_safety(path, errors)


def expected_skill_path(agent_name: str) -> str:
    return f".agents/skills/{agent_name}/SKILL.md"


def expected_skill_hash(root: Path, agent_name: str, errors: list[str]) -> str | None:
    skill_path = root / expected_skill_path(agent_name)
    if not skill_path.is_file():
        errors.append(f"missing skill file for {agent_name}: {skill_path.as_posix()}")
        return None
    return hashlib.sha256(skill_path.read_bytes()).hexdigest()


def expected_agno_step_ids() -> list[str]:
    return [f"{index:02d}-{agent_name}" for index, agent_name in enumerate(AGENTS, start=1)]


def validate_skill_binding(
    root: Path,
    agent_name: str,
    source: str,
    data: dict[str, Any],
    errors: list[str],
) -> None:
    expected_path = expected_skill_path(agent_name)
    if data.get("skill_path") != expected_path:
        errors.append(f"{source} skill_path must be {expected_path}")
    if data.get("skill_hash_algorithm") != "sha256":
        errors.append(f"{source} skill_hash_algorithm must be sha256")
    expected_hash = expected_skill_hash(root, agent_name, errors)
    if expected_hash and data.get("skill_hash") != expected_hash:
        errors.append(f"{source} skill_hash must match current {expected_path}")


def validate_evidence_row(run_id: str, row: dict[str, Any], path: Path, index: int, errors: list[str]) -> None:
    for field in ("run_id", "agent_name", "evidence_id", "collected_at", "source_kind", "summary"):
        if not row.get(field):
            errors.append(f"{path.as_posix()} row {index} missing {field}")
    if not row.get("source_path") and not row.get("command"):
        errors.append(f"{path.as_posix()} row {index} must include source_path or command")
    if row.get("run_id") != run_id:
        errors.append(f"{path.as_posix()} row {index} run_id does not match current run")
    if "source_artifact_path" in row:
        errors.append(f"{path.as_posix()} row {index} must not use source_artifact_path")
    source_path = row.get("source_path")
    if isinstance(source_path, str):
        normalized = source_path.replace("\\", "/")
        if normalized.startswith(OLD_ARTIFACT_PREFIXES):
            errors.append(f"{path.as_posix()} row {index} references old artifact path: {source_path}")
        if normalized.startswith("artifacts/play-store-launch/") and f"artifacts/play-store-launch/{run_id}/" not in normalized:
            errors.append(f"{path.as_posix()} row {index} references a different launch-readiness run: {source_path}")
    serialized = json.dumps(row, ensure_ascii=False).replace("\\", "/")
    for marker in FORBIDDEN_ARTIFACT_MARKERS:
        if marker in serialized:
            errors.append(f"{path.as_posix()} row {index} contains forbidden old-artifact marker: {marker}")


def validate_model_invocation(
    root: Path,
    run_id: str,
    agent_name: str,
    output_path: Path,
    output: dict[str, Any],
    step_evidence_ids: set[str],
    errors: list[str],
) -> None:
    execution = output.get("execution")
    if not isinstance(execution, dict):
        errors.append(f"{output_path.as_posix()} missing execution object")
    else:
        if execution.get("mode") != "fresh_ai_agent_run":
            errors.append(f"{output_path.as_posix()} execution.mode must be fresh_ai_agent_run")
        if execution.get("used_prior_outputs") is not False:
            errors.append(f"{output_path.as_posix()} execution.used_prior_outputs must be false")
        if execution.get("source_policy") != "no_prior_agent_outputs":
            errors.append(f"{output_path.as_posix()} execution.source_policy must be no_prior_agent_outputs")
        for field in ("started_at", "completed_at"):
            if not execution.get(field):
                errors.append(f"{output_path.as_posix()} execution missing {field}")

    invocation = output.get("model_invocation")
    if not isinstance(invocation, dict):
        errors.append(f"{output_path.as_posix()} missing model_invocation object")
        return
    required_values = {
        "required": True,
        "enabled": True,
    }
    for key, expected in required_values.items():
        if invocation.get(key) is not expected:
            errors.append(f"{output_path.as_posix()} model_invocation.{key} must be {str(expected).lower()}")
    provider = invocation.get("provider")
    if provider != "codex_cli":
        errors.append(f"{output_path.as_posix()} model_invocation.provider must be codex_cli")
    for field in CODEX_REQUIRED_FIELDS:
        value = invocation.get(field)
        if value is None or value == "":
            errors.append(f"{output_path.as_posix()} model_invocation missing {field}")
    if invocation.get("auth_method") != "chatgpt_login_or_cli_cached":
        errors.append(f"{output_path.as_posix()} model_invocation.auth_method must be chatgpt_login_or_cli_cached")
    if invocation.get("command") != "codex exec":
        errors.append(f"{output_path.as_posix()} model_invocation.command must be codex exec")
    if invocation.get("exit_code") != 0:
        errors.append(f"{output_path.as_posix()} model_invocation.exit_code must be 0")
    if invocation.get("schema_valid") is not True:
        errors.append(f"{output_path.as_posix()} model_invocation.schema_valid must be true")
    command_args = invocation.get("command_args")
    if not isinstance(command_args, list):
        errors.append(f"{output_path.as_posix()} model_invocation.command_args must be recorded")
    else:
        for required_arg in ("--sandbox", "read-only", "--ephemeral", "--output-schema", "--output-last-message"):
            if required_arg not in command_args:
                errors.append(f"{output_path.as_posix()} model_invocation.command_args missing {required_arg}")
    for forbidden_key in ("token", "tokens", "token_usage", "usage"):
        if forbidden_key in invocation:
            errors.append(f"{output_path.as_posix()} model_invocation must not record token usage field {forbidden_key}")
    prompt_hash = invocation.get("prompt_hash")
    if not isinstance(prompt_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", prompt_hash):
        errors.append(f"{output_path.as_posix()} prompt_hash must be a SHA-256 hex string")
    input_ids = invocation.get("input_evidence_ids")
    if not isinstance(input_ids, list) or not input_ids:
        errors.append(f"{output_path.as_posix()} model_invocation.input_evidence_ids must be non-empty")
    else:
        for evidence_id in input_ids:
            if evidence_id not in step_evidence_ids:
                errors.append(
                    f"{output_path.as_posix()} model input evidence id not found in this step current-run evidence: {evidence_id}"
                )
    if output.get("run_id") != run_id:
        errors.append(f"{output_path.as_posix()} run_id must match current run")
    if output.get("agent_name") != agent_name:
        errors.append(f"{output_path.as_posix()} agent_name must be {agent_name}")
    validate_skill_binding(root, agent_name, output_path.as_posix(), output, errors)
    model_output_ref = invocation.get("output_path")
    if isinstance(model_output_ref, str):
        model_output_path = root / model_output_ref
        validate_codex_output(model_output_path, step_evidence_ids, errors)
    else:
        errors.append(f"{output_path.as_posix()} model_invocation.output_path must be a repo-relative path")


def validate_codex_output(path: Path, step_evidence_ids: set[str], errors: list[str]) -> None:
    payload = load_json(path, errors)
    if not isinstance(payload, dict):
        return
    for field in CODEX_OUTPUT_REQUIRED_FIELDS:
        if field not in payload:
            errors.append(f"{path.as_posix()} missing {field}")
    if not isinstance(payload.get("summary_zh"), str) or not payload.get("summary_zh", "").strip():
        errors.append(f"{path.as_posix()} summary_zh must be a non-empty string")
    for field in ("confirmed_facts", "risks", "human_review_items", "next_steps", "evidence_ids_used"):
        value = payload.get(field)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            errors.append(f"{path.as_posix()} {field} must be an array of strings")
    for evidence_id in payload.get("evidence_ids_used", []):
        if evidence_id not in step_evidence_ids:
            errors.append(f"{path.as_posix()} evidence_ids_used contains non-current evidence: {evidence_id}")
    scan_text_safety(path, errors)


def validate_schema_snapshot(root: Path, run_dir: Path, errors: list[str]) -> None:
    canonical_path = root / CANONICAL_CODEX_OUTPUT_SCHEMA
    snapshot_path = run_dir / "codex-agent-output.schema.json"
    require_file(canonical_path, errors)
    require_file(snapshot_path, errors)
    canonical = load_json(canonical_path, errors)
    snapshot = load_json(snapshot_path, errors)
    if isinstance(canonical, dict):
        if canonical.get("$id") != CANONICAL_CODEX_OUTPUT_SCHEMA:
            errors.append(f"{CANONICAL_CODEX_OUTPUT_SCHEMA} $id must match canonical path")
        for field in CODEX_OUTPUT_REQUIRED_FIELDS:
            if field not in canonical.get("required", []):
                errors.append(f"{CANONICAL_CODEX_OUTPUT_SCHEMA} missing required Codex output field: {field}")
    if isinstance(canonical, dict) and isinstance(snapshot, dict) and snapshot != canonical:
        errors.append(f"{rel(root, snapshot_path)} must match {CANONICAL_CODEX_OUTPUT_SCHEMA}")


def validate_step(
    root: Path,
    run_id: str,
    run_dir: Path,
    agent_name: str,
    all_evidence_ids: set[str],
    errors: list[str],
) -> dict[str, Any] | None:
    step_dir = run_dir / "steps" / agent_name
    output_path = step_dir / "output.json"
    evidence_path = step_dir / "evidence.jsonl"
    summary_path = step_dir / "summary.zh.md"
    for path in (output_path, evidence_path, summary_path):
        require_file(path, errors)
    require_chinese_doc(summary_path, errors)

    evidence_rows = load_jsonl(evidence_path, errors)
    step_evidence_ids: set[str] = set()
    for index, row in enumerate(evidence_rows):
        validate_evidence_row(run_id, row, evidence_path, index, errors)
        if isinstance(row.get("evidence_id"), str):
            step_evidence_ids.add(row["evidence_id"])

    output = load_json(output_path, errors)
    if not isinstance(output, dict):
        return None
    if output.get("schema_version") != STEP_SCHEMA:
        errors.append(f"{rel(root, output_path)} schema_version must be {STEP_SCHEMA}")
    validate_model_invocation(root, run_id, agent_name, output_path, output, step_evidence_ids, errors)

    claims = output.get("claims")
    if not isinstance(claims, list) or not claims:
        errors.append(f"{rel(root, output_path)} claims must be non-empty")
    else:
        for index, claim in enumerate(claims):
            if not isinstance(claim, dict):
                errors.append(f"{rel(root, output_path)} claims[{index}] is not an object")
                continue
            claim_id = claim.get("claim_id")
            if not claim_id:
                errors.append(f"{rel(root, output_path)} claims[{index}] missing claim_id")
            evidence_refs = claim.get("evidence_refs")
            status = claim.get("status")
            if not evidence_refs and status not in {"needs_human", "blocked", "missing"}:
                errors.append(f"{rel(root, output_path)} {claim_id} missing evidence_refs or needs_human/blocker status")
            for evidence_id in evidence_refs or []:
                if evidence_id not in all_evidence_ids:
                    errors.append(f"{rel(root, output_path)} {claim_id} references non-current evidence: {evidence_id}")

    scan_text_safety(output_path, errors)
    return output


def validate_agno_step_ledger(
    root: Path,
    run_id: str,
    run_dir: Path,
    run: dict[str, Any],
    step_outputs: dict[str, dict[str, Any]],
    ledger_rows: list[dict[str, Any]],
    errors: list[str],
) -> None:
    expected_ids = expected_agno_step_ids()
    expected_ledger_path = f"artifacts/play-store-launch/{run_id}/agno-step-ledger.jsonl"
    agno = run.get("agno", {})
    if agno.get("orchestration_mode") != AGNO_ORCHESTRATION_MODE:
        errors.append(f"run.json agno.orchestration_mode must be {AGNO_ORCHESTRATION_MODE}")
    if agno.get("native_step_count") != len(AGENTS):
        errors.append("run.json agno.native_step_count must be 8")
    if agno.get("step_order") != expected_ids:
        errors.append("run.json agno.step_order must list the 8 Agno step ids in order")
    if agno.get("workflow_id") != AGNO_WORKFLOW_ID:
        errors.append(f"run.json agno.workflow_id must be {AGNO_WORKFLOW_ID}")
    if agno.get("step_ledger") != expected_ledger_path:
        errors.append(f"run.json agno.step_ledger must be {expected_ledger_path}")

    output_paths = run.get("output_paths", {})
    if output_paths.get("agno_step_ledger") != expected_ledger_path:
        errors.append(f"run.json output_paths.agno_step_ledger must be {expected_ledger_path}")

    run_steps = run.get("agent_steps")
    if isinstance(run_steps, list) and len(run_steps) == len(AGENTS):
        for index, (agent_name, step_summary) in enumerate(zip(AGENTS, run_steps), start=1):
            expected_id = f"{index:02d}-{agent_name}"
            if step_summary.get("agno_step_id") != expected_id:
                errors.append(f"run.json agent_steps[{index - 1}].agno_step_id must be {expected_id}")
            if step_summary.get("agno_step_name") != agent_name:
                errors.append(f"run.json agent_steps[{index - 1}].agno_step_name must be {agent_name}")
            expected_upstream = expected_ids[:7] if agent_name == "launch-package-agent" else []
            if step_summary.get("upstream_agno_step_ids", []) != expected_upstream:
                errors.append(f"run.json agent_steps[{index - 1}].upstream_agno_step_ids mismatch")

    if len(ledger_rows) != len(AGENTS):
        errors.append("agno-step-ledger.jsonl must contain exactly 8 rows")
        return

    for index, (agent_name, row) in enumerate(zip(AGENTS, ledger_rows), start=1):
        source = f"{rel(root, run_dir / 'agno-step-ledger.jsonl')} row {index}"
        expected_id = f"{index:02d}-{agent_name}"
        for field in (
            "run_id",
            "agno_workflow_id",
            "agno_orchestration_mode",
            "agno_step_id",
            "agno_step_name",
            "agent_name",
            "step_index",
            "skill_path",
            "skill_hash",
            "skill_hash_algorithm",
            "input_kind",
            "upstream_agno_step_ids",
            "output_path",
            "evidence_path",
            "summary_path",
            "model_invocation_provider",
            "model_invocation_model",
            "model_invocation_prompt_id",
            "model_invocation_prompt_hash",
            "status",
            "started_at",
            "completed_at",
        ):
            if row.get(field) in (None, ""):
                errors.append(f"{source} missing {field}")
        if row.get("run_id") != run_id:
            errors.append(f"{source} run_id must match current run")
        if row.get("agno_workflow_id") != AGNO_WORKFLOW_ID:
            errors.append(f"{source} agno_workflow_id mismatch")
        if row.get("agno_orchestration_mode") != AGNO_ORCHESTRATION_MODE:
            errors.append(f"{source} agno_orchestration_mode mismatch")
        if row.get("agno_step_id") != expected_id:
            errors.append(f"{source} agno_step_id must be {expected_id}")
        if row.get("agno_step_name") != agent_name:
            errors.append(f"{source} agno_step_name must be {agent_name}")
        if row.get("agent_name") != agent_name:
            errors.append(f"{source} agent_name must be {agent_name}")
        if row.get("step_index") != index:
            errors.append(f"{source} step_index must be {index}")

        expected_input_kind = "current_run_upstream_steps" if agent_name == "launch-package-agent" else "repo_evidence"
        if row.get("input_kind") != expected_input_kind:
            errors.append(f"{source} input_kind must be {expected_input_kind}")
        expected_upstream = expected_ids[:7] if agent_name == "launch-package-agent" else []
        if row.get("upstream_agno_step_ids") != expected_upstream:
            errors.append(f"{source} upstream_agno_step_ids mismatch")

        step_output = step_outputs.get(agent_name)
        if not isinstance(step_output, dict):
            continue
        expected_paths = step_output.get("output_paths", {})
        if row.get("output_path") != expected_paths.get("output"):
            errors.append(f"{source} output_path must match step output")
        if row.get("evidence_path") != expected_paths.get("evidence"):
            errors.append(f"{source} evidence_path must match step output")
        if row.get("summary_path") != expected_paths.get("summary"):
            errors.append(f"{source} summary_path must match step output")
        for path_field in ("output_path", "evidence_path", "summary_path"):
            value = row.get(path_field)
            if not isinstance(value, str) or not value.startswith(f"artifacts/play-store-launch/{run_id}/steps/{agent_name}/"):
                errors.append(f"{source} {path_field} must stay under the current run step directory")
            elif not (root / value).is_file():
                errors.append(f"{source} {path_field} does not exist: {value}")

        if row.get("skill_path") != step_output.get("skill_path"):
            errors.append(f"{source} skill_path must match step output")
        if row.get("skill_hash") != step_output.get("skill_hash"):
            errors.append(f"{source} skill_hash must match step output")
        if row.get("skill_hash_algorithm") != "sha256":
            errors.append(f"{source} skill_hash_algorithm must be sha256")
        expected_hash = expected_skill_hash(root, agent_name, errors)
        if expected_hash and row.get("skill_hash") != expected_hash:
            errors.append(f"{source} skill_hash must match current {expected_skill_path(agent_name)}")
        invocation = step_output.get("model_invocation", {})
        if row.get("model_invocation_provider") != invocation.get("provider"):
            errors.append(f"{source} model_invocation_provider must match step output")
        if row.get("model_invocation_model") != invocation.get("model"):
            errors.append(f"{source} model_invocation_model must match step output")
        if row.get("model_invocation_prompt_id") != invocation.get("prompt_id"):
            errors.append(f"{source} model_invocation_prompt_id must match step output")
        if row.get("model_invocation_prompt_hash") != invocation.get("prompt_hash"):
            errors.append(f"{source} model_invocation_prompt_hash must match step output")
        if row.get("status") != step_output.get("agent_status"):
            errors.append(f"{source} status must match step output agent_status")
        if step_output.get("agno_step_id") != expected_id:
            errors.append(f"{rel(root, run_dir / 'steps' / agent_name / 'output.json')} agno_step_id must be {expected_id}")
        if step_output.get("agno_step_name") != agent_name:
            errors.append(f"{rel(root, run_dir / 'steps' / agent_name / 'output.json')} agno_step_name must be {agent_name}")
        if step_output.get("upstream_agno_step_ids", []) != expected_upstream:
            errors.append(f"{rel(root, run_dir / 'steps' / agent_name / 'output.json')} upstream_agno_step_ids mismatch")


def validate_run(root: Path, run_dir: Path, errors: list[str]) -> None:
    required = (
        "run.json",
        "launch-readiness.zh.md",
        "launch-readiness.json",
        "evidence-ledger.jsonl",
        "agno-step-ledger.jsonl",
        "human-review.md",
    )
    for name in required:
        require_file(run_dir / name, errors)
    validate_schema_snapshot(root, run_dir, errors)

    run = load_json(run_dir / "run.json", errors)
    report = load_json(run_dir / "launch-readiness.json", errors)
    evidence_path = run_dir / "evidence-ledger.jsonl"
    evidence_rows = load_jsonl(evidence_path, errors)
    agno_ledger_rows = load_jsonl(run_dir / "agno-step-ledger.jsonl", errors)
    require_chinese_doc(run_dir / "launch-readiness.zh.md", errors, min_chars=200)
    require_chinese_doc(run_dir / "human-review.md", errors)
    for path in (run_dir / "run.json", run_dir / "launch-readiness.json"):
        scan_text_safety(path, errors)

    if not isinstance(run, dict):
        return
    run_id = str(run.get("run_id") or "")
    if not run_id:
        errors.append("run.json missing run_id")
        return
    if run_dir.name != run_id:
        errors.append("run.json run_id must match artifacts/play-store-launch/<run-id> directory name")
    if run.get("schema_version") != RUN_SCHEMA:
        errors.append("run.json schema_version mismatch")
    if run.get("mode") != "launch-readiness":
        errors.append("run.json mode must be launch-readiness")
    if run.get("status") != "completed":
        errors.append("run.json status must be completed for an acceptable fresh AI run")
    agno = run.get("agno", {})
    if agno.get("maturity") != "A3_CODEX_CLI_BACKED":
        errors.append("run.json agno.maturity must be A3_CODEX_CLI_BACKED when all 8 Codex CLI invocations succeed")
    if agno.get("model_backed_reasoning") is not True:
        errors.append("run.json agno.model_backed_reasoning must be true")
    safety = run.get("safety", {})
    if safety.get("can_submit_google_play") is not False:
        errors.append("run.json safety.can_submit_google_play must be false")
    if safety.get("safe_to_strengthen_final_store_claims") is not False:
        errors.append("run.json safety.safe_to_strengthen_final_store_claims must be false")

    steps = run.get("agent_steps")
    if not isinstance(steps, list) or [step.get("agent_name") for step in steps] != list(AGENTS):
        errors.append("run.json agent_steps must list all 8 agents in order")
    else:
        for step in steps:
            agent_name = step.get("agent_name")
            if isinstance(agent_name, str):
                validate_skill_binding(root, agent_name, "run.json agent_steps", step, errors)
            invocation = step.get("model_invocation", {})
            if invocation.get("enabled") is not True:
                errors.append("run.json agent_steps must record enabled model invocation for all 8 agents")
            if invocation.get("provider") != "codex_cli":
                errors.append("run.json agent_steps must record codex_cli provider for all 8 agents")

    evidence_ids: set[str] = set()
    evidence_agents: set[str] = set()
    for index, row in enumerate(evidence_rows):
        validate_evidence_row(run_id, row, evidence_path, index, errors)
        if isinstance(row.get("evidence_id"), str):
            evidence_ids.add(row["evidence_id"])
        if isinstance(row.get("agent_name"), str):
            evidence_agents.add(row["agent_name"])
    for agent_name in AGENTS:
        if agent_name not in evidence_agents:
            errors.append(f"evidence-ledger.jsonl missing current-run evidence for {agent_name}")

    step_outputs: dict[str, dict[str, Any]] = {}
    for agent_name in AGENTS:
        step = validate_step(root, run_id, run_dir, agent_name, evidence_ids, errors)
        if isinstance(step, dict):
            step_outputs[agent_name] = step

    launch_step = step_outputs.get("launch-package-agent")
    if isinstance(launch_step, dict):
        if launch_step.get("upstream_agents") != list(UPSTREAM_AGENTS):
            errors.append("launch-package-agent must consume exactly the first 7 current-run agent outputs")
        for source_path in launch_step.get("upstream_step_outputs", []):
            if not isinstance(source_path, str) or not source_path.startswith(f"artifacts/play-store-launch/{run_id}/steps/"):
                errors.append(f"launch-package-agent consumed non-current-run step output: {source_path}")
        if launch_step.get("readiness") == "GREEN":
            errors.append("launch-package-agent must not rewrite fail-closed readiness to GREEN in this run")

    validate_agno_step_ledger(root, run_id, run_dir, run, step_outputs, agno_ledger_rows, errors)

    if isinstance(report, dict):
        if report.get("schema_version") != REPORT_SCHEMA:
            errors.append("launch-readiness.json schema_version mismatch")
        if report.get("readiness") != "RED":
            errors.append("launch-readiness.json readiness must remain RED")
        if report.get("can_submit_google_play") is not False:
            errors.append("launch-readiness.json can_submit_google_play must be false")
        if report.get("safe_to_strengthen_final_store_claims") is not False:
            errors.append("launch-readiness.json safe_to_strengthen_final_store_claims must be false")
        report_agno = report.get("agno", {})
        if report_agno.get("maturity") != "A3_CODEX_CLI_BACKED":
            errors.append("launch-readiness.json must mark acceptable run as A3_CODEX_CLI_BACKED")


def validate(root: Path, run_id: str | None = None) -> list[str]:
    errors: list[str] = []
    run_dir = latest_run_dir(root, run_id, errors)
    if run_dir is not None:
        validate_run(root, run_dir, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate fresh AI-backed Play Store launch-readiness output.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--run-id", help="Specific artifacts/play-store-launch/<run-id> to validate")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root, args.run_id)
    if errors:
        print("PLAY_STORE_LAUNCH_READINESS_RUN_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PLAY_STORE_LAUNCH_READINESS_RUN_VALIDATION_PASSED")
    print("status=pass")
    print("agno_maturity=A3_CODEX_CLI_BACKED")
    print("fresh_ai_agent_run=true")
    return 0


if __name__ == "__main__":
    sys.exit(main())
