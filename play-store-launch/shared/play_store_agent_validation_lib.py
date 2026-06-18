#!/usr/bin/env python3
"""Shared helpers for Play Store agent MVP validators."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any


SECRET_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("google_api_key", re.compile(r"AIza[0-9A-Za-z_-]{20,}")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----")),
    ("google_service_account_type", re.compile(r'"type"\s*:\s*"service_account"', re.IGNORECASE)),
    ("google_service_account_private_key_id", re.compile(r'"private_key_id"\s*:\s*"[0-9a-fA-F]{16,}"')),
    (
        "google_service_account_client_email",
        re.compile(r'"client_email"\s*:\s*"[^"]+@[^"]+\.iam\.gserviceaccount\.com"', re.IGNORECASE),
    ),
    ("google_oauth_client_secret", re.compile(r'"client_secret"\s*:\s*"[A-Za-z0-9_-]{20,}"')),
    ("google_oauth_refresh_token", re.compile(r'"refresh_token"\s*:\s*"[A-Za-z0-9_./-]{20,}"')),
    ("github_token", re.compile(r"ghp_[0-9A-Za-z]{20,}")),
    ("gitlab_token", re.compile(r"glpat-[0-9A-Za-z_-]{20,}")),
    ("slack_token", re.compile(r"xox[baprs]-[0-9A-Za-z-]{20,}")),
    ("openai_key", re.compile(r"sk-[A-Za-z0-9_-]{30,}")),
)

CLAIM_STATUS_ENUM = {
    "observed_in_repo",
    "inferred",
    "missing",
    "blocked",
    "needs_human",
    "not_applicable",
}

CLAIM_CLASSES = {"C0", "C1", "C2", "C3", "C4", "C5"}

REQUIRED_CLAIM_FIELDS = (
    "claim_id",
    "value",
    "source",
    "status",
    "confidence",
    "claim_class",
    "human_review_required",
    "evidence_refs",
    "limitations",
)

FORBIDDEN_FINAL_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("final", re.compile(r"\bfinal\b", re.IGNORECASE)),
    ("approved", re.compile(r"\bapproved\b", re.IGNORECASE)),
    ("compliant", re.compile(r"\bcompliant\b", re.IGNORECASE)),
    ("submitted", re.compile(r"\bsubmitted\b", re.IGNORECASE)),
    ("complete", re.compile(r"\bcomplete\b", re.IGNORECASE)),
    ("production_ready", re.compile(r"\bproduction_ready\b", re.IGNORECASE)),
    ("ready_to_submit", re.compile(r"\bready to submit\b", re.IGNORECASE)),
    ("submission_ready", re.compile(r"\bsubmission ready\b", re.IGNORECASE)),
)

BOUNDARY_MARKERS = (
    "human review required",
    "human-review-required",
    "need_human",
    "draft",
    "evidence",
    "readiness",
    "blocked",
    "out of scope",
    "not ",
    "no ",
    "without",
    "must not",
    "do not",
    "does not",
    "cannot",
    "can't",
    "never",
    "forbidden",
    "guardrail",
    "forbidden_terms",
    "forbidden conclusion",
    "unapproved",
    "stop condition",
    "不",
    "不得",
    "不能",
    "不要",
    "未",
    "无",
    "禁止",
    "草稿",
    "不是",
    "不声明",
    "只",
    "仅",
)


def require_list(value: Any, source: str, key: str, errors: list[str]) -> list[Any]:
    if not isinstance(value, list):
        errors.append(f"{source} expected {key} to be a list")
        return []
    return value


def validate_claim_shape(claim: Any, source: str, index: int, errors: list[str]) -> None:
    if not isinstance(claim, dict):
        errors.append(f"{source} claims[{index}] is not an object")
        return

    for field in REQUIRED_CLAIM_FIELDS:
        if field not in claim:
            errors.append(f"{source} claims[{index}] missing required field: {field}")

    claim_id = claim.get("claim_id", f"claims[{index}]")
    status = claim.get("status")
    claim_class = claim.get("claim_class")

    if status not in CLAIM_STATUS_ENUM:
        errors.append(f"{source} {claim_id} has invalid status: {status!r}")
    if claim_class not in CLAIM_CLASSES:
        errors.append(f"{source} {claim_id} has invalid claim_class: {claim_class!r}")

    evidence_refs = claim.get("evidence_refs")
    if not isinstance(evidence_refs, list) or not evidence_refs:
        errors.append(f"{source} {claim_id} must have non-empty evidence_refs")

    source_refs = claim.get("source")
    if not isinstance(source_refs, list) or not source_refs:
        errors.append(f"{source} {claim_id} must have non-empty source")

    confidence = claim.get("confidence")
    if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
        errors.append(f"{source} {claim_id} confidence must be between 0 and 1")

    if claim_class in {"C3", "C4", "C5"} and claim.get("human_review_required") is not True:
        errors.append(f"{source} {claim_id} {claim_class} must set human_review_required=true")

    if claim_class == "C5" and status not in {"blocked", "needs_human", "missing", "not_applicable"}:
        errors.append(f"{source} {claim_id} C5 must be blocker-only")


def validate_agent_output(
    root: Path,
    relative: str,
    agent_id: str,
    errors: list[str],
    *,
    min_claims: int = 1,
    expected_maturity: str = "L2",
) -> Any | None:
    data = load_json(root, relative, errors)
    if not isinstance(data, dict):
        return None

    require_json_value(data, "schema_version", "play_store_agent_output.v1", errors, relative)
    require_json_value(data, "agent_id", agent_id, errors, relative)
    require_json_value(data, "agent_maturity", expected_maturity, errors, relative)
    require_json_value(data, "agno_status", "dry_run_only", errors, relative)
    if data.get("maturity_level") == "L3" or data.get("agent_maturity") == "L3":
        errors.append(f"{relative} must not claim L3 while Agno status is dry_run_only")

    claims = require_list(data.get("claims"), relative, "claims", errors)
    if len(claims) < min_claims:
        errors.append(f"{relative} expected at least {min_claims} claims")
    for index, claim in enumerate(claims):
        validate_claim_shape(claim, relative, index, errors)

    evidence = require_list(data.get("evidence"), relative, "evidence", errors)
    if not evidence:
        errors.append(f"{relative} expected non-empty evidence list")
    for index, entry in enumerate(evidence):
        if not isinstance(entry, dict):
            errors.append(f"{relative} evidence[{index}] is not an object")
            continue
        for field in ("evidence_id", "source_type", "source_ref", "observed_value", "status"):
            if field not in entry:
                errors.append(f"{relative} evidence[{index}] missing required field: {field}")
        if entry.get("status") not in CLAIM_STATUS_ENUM:
            errors.append(f"{relative} evidence[{index}] invalid status: {entry.get('status')!r}")

    human_gates = require_list(data.get("human_approval_gates"), relative, "human_approval_gates", errors)
    if not human_gates:
        errors.append(f"{relative} expected non-empty human_approval_gates list")

    return data


def validate_agno_step_artifact(
    root: Path,
    relative: str,
    agent_id: str,
    errors: list[str],
    *,
    expected_maturity: str = "L2",
) -> Any | None:
    data = load_json(root, relative, errors)
    if not isinstance(data, dict):
        return None

    require_json_value(data, "schema_version", "play_store_agno_step_artifact.v1", errors, relative)
    require_json_value(data, "agent_id", agent_id, errors, relative)
    require_json_value(data, "agno_status", "dry_run_only", errors, relative)
    require_json_value(data, "maturity_level", expected_maturity, errors, relative)
    for field in (
        "run_id",
        "step_id",
        "input_contract_ref",
        "output_contract_ref",
        "evidence_ledger_ref",
        "claim_ids",
        "claim_classes",
        "human_approval_gate_ref",
        "validation_results",
        "next_allowed_action",
        "blocked_reason",
    ):
        if field not in data:
            errors.append(f"{relative} missing required field: {field}")
    if data.get("real_run") is True:
        errors.append(f"{relative} must not set real_run=true")
    if data.get("maturity_level") == "L3":
        errors.append(f"{relative} must not claim L3")
    if not isinstance(data.get("claim_ids"), list) or not data.get("claim_ids"):
        errors.append(f"{relative} expected non-empty claim_ids")
    if not isinstance(data.get("claim_classes"), list) or not data.get("claim_classes"):
        errors.append(f"{relative} expected non-empty claim_classes")
    return data

BOUNDARY_SECTION_MARKERS = (
    "non-goals",
    "do / do not rules",
    "hard boundaries",
    "out of scope",
    "not final",
    "human approval",
    "human review",
    "need_human",
    "blocker",
    "guardrail",
    "rules",
)


def as_posix(path: str) -> str:
    return path.replace("\\", "/")


def read_text(root: Path, relative: str) -> str:
    return (root / relative).read_text(encoding="utf-8")


def require_files(root: Path, files: list[str] | tuple[str, ...], errors: list[str]) -> None:
    for relative in files:
        if not (root / relative).is_file():
            errors.append(f"missing required file: {relative}")


def require_terms(root: Path, relative: str, terms: list[str] | tuple[str, ...], errors: list[str]) -> None:
    path = root / relative
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for term in terms:
        if term not in text:
            errors.append(f"{relative} missing required term: {term}")


def load_json(root: Path, relative: str, errors: list[str]) -> Any | None:
    path = root / relative
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{relative} is not valid JSON: {exc}")
        return None


def require_json_value(data: Any, dotted_path: str, expected: Any, errors: list[str], source: str) -> None:
    current = data
    for part in dotted_path.split("."):
        if not isinstance(current, dict) or part not in current:
            errors.append(f"{source} missing JSON key: {dotted_path}")
            return
        current = current[part]
    if current != expected:
        errors.append(f"{source} expected {dotted_path}={expected!r}, found {current!r}")


def require_skill_shape(root: Path, relative: str, skill_name: str, errors: list[str]) -> None:
    path = root / relative
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append(f"{relative} missing YAML frontmatter")
    if f"name: {skill_name}" not in text:
        errors.append(f"{relative} missing name: {skill_name}")
    if "description:" not in text:
        errors.append(f"{relative} missing description")
    for term in (
        "## Required Inputs",
        "## Expected Outputs",
        "## Do / Do Not Rules",
        "## Validation Steps",
        "## Final Report Format",
        "## Human Approval Points",
    ):
        if term not in text:
            errors.append(f"{relative} missing required section: {term}")
    for term in ("NEED_HUMAN", "human review required"):
        if term not in text:
            errors.append(f"{relative} missing guardrail term: {term}")


def scan_for_secret_patterns(root: Path, files: list[str] | tuple[str, ...], errors: list[str]) -> None:
    for relative in files:
        path = root / relative
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for name, pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"{relative} contains possible credential pattern: {name}")


def has_boundary_marker(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in BOUNDARY_MARKERS)


def is_boundary_section(heading: str) -> bool:
    lowered = heading.lower()
    return any(marker in lowered for marker in BOUNDARY_SECTION_MARKERS)


def scan_for_forbidden_final_claims(
    root: Path,
    files: list[str] | tuple[str, ...],
    errors: list[str],
) -> None:
    """Fail on final/compliance wording unless explicitly bounded.

    This is intentionally line-oriented with section context. It allows the
    words in explicit negative, draft/evidence/readiness, blocked, out-of-scope,
    or human-review-required contexts, but rejects unbounded claims.
    """

    for relative in files:
        if relative.startswith("scripts/agent_tools/"):
            continue
        if relative.startswith("play-store-launch/") and relative.endswith(".py"):
            continue
        path = root / relative
        if not path.is_file():
            continue
        boundary_section = False
        for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("#"):
                boundary_section = is_boundary_section(line)
            lowered_line = line.lower()
            if "final report" in lowered_line or "final update" in lowered_line:
                continue
            matches = [
                name
                for name, pattern in FORBIDDEN_FINAL_PATTERNS
                if pattern.search(line)
            ]
            if not matches:
                continue
            if boundary_section or has_boundary_marker(line):
                continue
            errors.append(
                f"{relative}:{line_number} has unbounded final/compliance wording "
                f"({', '.join(matches)}): {line}"
            )


def changed_paths(root: Path) -> tuple[list[str], str | None]:
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "-uall"],
            cwd=root,
            text=True,
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        return [], f"git status unavailable: {exc}"

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        return [], f"git status failed: {detail}"

    paths: list[str] = []
    for line in result.stdout.splitlines():
        payload = line[3:] if len(line) > 3 else ""
        if " -> " in payload:
            payload = payload.split(" -> ", 1)[1]
        payload = payload.strip().strip('"')
        if payload:
            paths.append(as_posix(payload))
    return paths, None


def is_allowed_path(path: str, allowed_prefixes: tuple[str, ...]) -> bool:
    normalized = as_posix(path)
    return any(
        normalized == prefix.rstrip("/") or normalized.startswith(prefix)
        for prefix in allowed_prefixes
    )
