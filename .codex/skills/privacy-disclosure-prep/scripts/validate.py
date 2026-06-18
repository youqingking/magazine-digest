#!/usr/bin/env python3
"""Validate privacy-disclosure-prep scanner outputs."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "privacy_disclosure_prep.v1"
NEED_HUMAN = "NEED_HUMAN"
AUTO_PARSED = "AUTO_PARSED"
PLAY_CONSOLE_CSV_COLUMNS = [
    "Question ID (machine readable)",
    "Response ID (machine readable)",
    "Response value",
    "Answer requirement",
    "Human-friendly question label",
]
CLAIM_STATUSES = {
    "observed_in_repo",
    "inferred",
    "not_observed",
    "missing",
    "conflict",
    "needs_human",
    "blocked",
    "not_applicable",
}
CLAIM_CLASSES = {"C0", "C1", "C2", "C3", "C4", "C5"}
HIGH_REVIEW_CLASSES = {"C3", "C4", "C5"}
REQUIRED_TOP_LEVEL = (
    "schema_version",
    "generated_at",
    "scan_policy",
    "project_fingerprint",
    "overall_status",
    "detected_platforms",
    "sdk_inventory",
    "permission_inventory",
    "data_flows",
    "data_safety_form_draft",
    "privacy_policy",
    "account_deletion",
    "children_sensitive_risks",
    "claims",
    "evidence",
    "human_review_gates",
    "blockers",
    "limitations",
    "output_paths",
)
FORBIDDEN_FINAL_PATTERNS = (
    re.compile(r"\bready to submit\b", re.IGNORECASE),
    re.compile(r"\bsubmission ready\b", re.IGNORECASE),
    re.compile(r"\bfinal compliance\b", re.IGNORECASE),
    re.compile(r"\bapproved\b", re.IGNORECASE),
    re.compile(r"\bcompliant\b", re.IGNORECASE),
)
BOUNDARY_WORDS = (
    "不是",
    "不证明",
    "不声明",
    "不能",
    "non-final",
    "not final",
    "not a legal",
    "needs_human",
    "human review",
    "blocked",
)


def as_posix(path: str | Path) -> str:
    return str(path).replace("\\", "/")


def load_json(path: Path, errors: list[str]) -> Any | None:
    if not path.is_file():
        errors.append(f"missing report: {as_posix(path)}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON: {as_posix(path)}: {exc}")
        return None


def require_list(data: dict[str, Any], key: str, errors: list[str]) -> list[Any]:
    value = data.get(key)
    if not isinstance(value, list):
        errors.append(f"{key} must be a list")
        return []
    return value


def validate_evidence(data: dict[str, Any], root: Path, errors: list[str]) -> set[str]:
    evidence = require_list(data, "evidence", errors)
    ids: set[str] = set()
    for index, item in enumerate(evidence):
        if not isinstance(item, dict):
            errors.append(f"evidence[{index}] must be an object")
            continue
        for field in ("evidence_id", "source_type", "source_ref", "parser", "observed_key", "observed_value", "snippet_hash", "confidence"):
            if field not in item:
                errors.append(f"evidence[{index}] missing {field}")
        evidence_id = item.get("evidence_id")
        if isinstance(evidence_id, str):
            if evidence_id in ids:
                errors.append(f"duplicate evidence_id: {evidence_id}")
            ids.add(evidence_id)
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
            errors.append(f"evidence[{index}] confidence must be between 0 and 1")
        source_ref = item.get("source_ref")
        if isinstance(source_ref, str) and source_ref not in {".", "app.config.*", "AndroidManifest.xml/build.gradle", "Info.plist/Podfile", "server/api/routes/prisma/supabase"}:
            if re.match(r"^[A-Za-z]:", source_ref):
                errors.append(f"evidence[{index}] source_ref must be repo-relative, got {source_ref}")
            elif source_ref and not (root / source_ref).exists() and "*" not in source_ref:
                errors.append(f"evidence[{index}] source_ref does not exist: {source_ref}")
    if not evidence:
        errors.append("evidence must not be empty")
    return ids


def validate_claims(data: dict[str, Any], evidence_ids: set[str], errors: list[str]) -> None:
    claims = require_list(data, "claims", errors)
    if len(claims) < 8:
        errors.append("expected at least 8 claims covering the disclosure questions")
    seen: set[str] = set()
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            errors.append(f"claims[{index}] must be an object")
            continue
        for field in (
            "claim_id",
            "question",
            "status",
            "answer_state",
            "claim_class",
            "human_review_required",
            "review_status",
            "value",
            "confidence",
            "evidence_refs",
            "limitations",
        ):
            if field not in claim:
                errors.append(f"claims[{index}] missing {field}")
        claim_id = claim.get("claim_id", f"claims[{index}]")
        if isinstance(claim_id, str):
            if claim_id in seen:
                errors.append(f"duplicate claim_id: {claim_id}")
            seen.add(claim_id)
        if claim.get("status") not in CLAIM_STATUSES:
            errors.append(f"{claim_id} invalid status: {claim.get('status')!r}")
        claim_class = claim.get("claim_class")
        if claim_class not in CLAIM_CLASSES:
            errors.append(f"{claim_id} invalid claim_class: {claim_class!r}")
        if claim_class in HIGH_REVIEW_CLASSES and claim.get("human_review_required") is not True:
            errors.append(f"{claim_id} {claim_class} must set human_review_required=true")
        if claim.get("human_review_required") is True and claim.get("review_status") != NEED_HUMAN:
            errors.append(f"{claim_id} human-reviewed claim must set review_status={NEED_HUMAN}")
        if claim.get("human_review_required") is False and claim.get("review_status") not in {AUTO_PARSED, NEED_HUMAN}:
            errors.append(f"{claim_id} invalid review_status: {claim.get('review_status')!r}")
        confidence = claim.get("confidence")
        if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
            errors.append(f"{claim_id} confidence must be between 0 and 1")
        refs = claim.get("evidence_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{claim_id} must have non-empty evidence_refs")
        elif any(ref not in evidence_ids for ref in refs):
            missing = [ref for ref in refs if ref not in evidence_ids]
            errors.append(f"{claim_id} references unknown evidence ids: {missing}")
        limitations = claim.get("limitations")
        if not isinstance(limitations, list):
            errors.append(f"{claim_id} limitations must be a list")


def validate_cross_fields(data: dict[str, Any], errors: list[str]) -> None:
    if data.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION}")
    if data.get("overall_status") not in {"pass", "pass_with_human_review", "blocked", "fail"}:
        errors.append(f"invalid overall_status: {data.get('overall_status')!r}")

    scan_policy = data.get("scan_policy")
    if not isinstance(scan_policy, dict):
        errors.append("scan_policy must be an object")
    else:
        if scan_policy.get("file_discovery_mode") == "git_ls_files_exclude_standard" and scan_policy.get("ignored_paths_respected") is not True:
            errors.append("git file discovery must set ignored_paths_respected=true")
        if not isinstance(scan_policy.get("file_count_scanned"), int):
            errors.append("scan_policy.file_count_scanned must be an integer")

    matrix = data.get("disclosure_question_matrix")
    if not isinstance(matrix, list) or len(matrix) < 8:
        errors.append("disclosure_question_matrix must contain the 8 core disclosure questions")

    privacy_policy = data.get("privacy_policy")
    blockers = data.get("blockers") if isinstance(data.get("blockers"), list) else []
    blocker_ids = {item.get("blocker_id") for item in blockers if isinstance(item, dict)}
    if isinstance(privacy_policy, dict) and privacy_policy.get("status") == "blocked" and "privacy_policy_url_missing" not in blocker_ids:
        errors.append("blocked privacy_policy must create privacy_policy_url_missing blocker")

    account_deletion = data.get("account_deletion")
    if isinstance(account_deletion, dict) and account_deletion.get("status") == "blocked" and "account_deletion_missing" not in blocker_ids:
        errors.append("blocked account_deletion must create account_deletion_missing blocker")

    sdk_inventory = data.get("sdk_inventory")
    if isinstance(sdk_inventory, list) and not sdk_inventory and "sdk_inventory_missing" not in blocker_ids:
        errors.append("empty sdk_inventory must create sdk_inventory_missing blocker")

    human_gates = data.get("human_review_gates")
    if not isinstance(human_gates, list):
        errors.append("human_review_gates must be a list")
    elif data.get("overall_status") == "pass" and human_gates:
        errors.append("overall_status pass cannot have human_review_gates")


def validate_data_safety_form_draft(data: dict[str, Any], evidence_ids: set[str], errors: list[str]) -> None:
    draft = data.get("data_safety_form_draft")
    if not isinstance(draft, dict):
        errors.append("data_safety_form_draft must be an object")
        return
    if draft.get("schema_version") != "google_play_data_safety_draft.v1":
        errors.append("data_safety_form_draft.schema_version must be google_play_data_safety_draft.v1")
    if draft.get("review_status") != NEED_HUMAN:
        errors.append(f"data_safety_form_draft.review_status must be {NEED_HUMAN}")
    if not isinstance(draft.get("official_source"), str) or "support.google.com/googleplay/android-developer/answer/10787469" not in draft.get("official_source", ""):
        errors.append("data_safety_form_draft.official_source must point to the official Google Play Data safety page")

    global_questions = draft.get("global_questions")
    required_global_questions = {
        "does_app_collect_or_share_user_data",
        "is_all_user_data_collected_encrypted_in_transit",
        "can_users_request_data_deletion",
        "privacy_policy_url",
        "third_party_sdk_or_external_sharing",
        "tracking",
        "children_or_sensitive_data_risk",
    }
    if not isinstance(global_questions, dict):
        errors.append("data_safety_form_draft.global_questions must be an object")
    else:
        missing = sorted(required_global_questions - set(global_questions.keys()))
        if missing:
            errors.append(f"data_safety_form_draft.global_questions missing {missing}")
        for key, value in global_questions.items():
            if not isinstance(value, dict):
                errors.append(f"data_safety_form_draft.global_questions.{key} must be an object")
                continue
            if value.get("review_status") != NEED_HUMAN:
                errors.append(f"data_safety_form_draft.global_questions.{key}.review_status must be {NEED_HUMAN}")
            refs = value.get("evidence_refs", [])
            if refs and (not isinstance(refs, list) or any(ref not in evidence_ids for ref in refs)):
                errors.append(f"data_safety_form_draft.global_questions.{key} references unknown evidence ids")

    data_types = draft.get("data_types")
    if not isinstance(data_types, list):
        errors.append("data_safety_form_draft.data_types must be a list")
        return
    for index, row in enumerate(data_types):
        if not isinstance(row, dict):
            errors.append(f"data_safety_form_draft.data_types[{index}] must be an object")
            continue
        for field in (
            "category",
            "data_type",
            "collected",
            "shared",
            "processed_ephemerally",
            "required_or_optional",
            "purposes",
            "purposes_review_status",
            "review_status",
            "evidence_refs",
        ):
            if field not in row:
                errors.append(f"data_safety_form_draft.data_types[{index}] missing {field}")
        if row.get("review_status") != NEED_HUMAN:
            errors.append(f"data_safety_form_draft.data_types[{index}].review_status must be {NEED_HUMAN}")
        for field in ("processed_ephemerally", "required_or_optional", "purposes_review_status"):
            if row.get(field) != NEED_HUMAN:
                errors.append(f"data_safety_form_draft.data_types[{index}].{field} must be {NEED_HUMAN}")
        refs = row.get("evidence_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"data_safety_form_draft.data_types[{index}] must have evidence_refs")
        elif any(ref not in evidence_ids for ref in refs):
            errors.append(f"data_safety_form_draft.data_types[{index}] references unknown evidence ids")

    human_review_items = draft.get("human_review_items")
    if not isinstance(human_review_items, list) or not human_review_items:
        errors.append("data_safety_form_draft.human_review_items must be a non-empty list")
    else:
        for index, item in enumerate(human_review_items[:200]):
            if not isinstance(item, dict):
                errors.append(f"data_safety_form_draft.human_review_items[{index}] must be an object")
                continue
            if item.get("review_status") != NEED_HUMAN:
                errors.append(f"data_safety_form_draft.human_review_items[{index}].review_status must be {NEED_HUMAN}")
            if not item.get("field_path"):
                errors.append(f"data_safety_form_draft.human_review_items[{index}] missing field_path")


def validate_output_files(data: dict[str, Any], root: Path, errors: list[str]) -> None:
    output_paths = data.get("output_paths")
    if not isinstance(output_paths, dict):
        errors.append("output_paths must be an object")
        return
    evidence_jsonl = output_paths.get("evidence_jsonl")
    if isinstance(evidence_jsonl, str):
        path = Path(evidence_jsonl)
        if not path.is_absolute():
            path = root / path
        if not path.is_file():
            errors.append(f"missing evidence_jsonl: {as_posix(path)}")
        else:
            for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
                try:
                    json.loads(line)
                except json.JSONDecodeError as exc:
                    errors.append(f"evidence_jsonl line {line_number} invalid JSON: {exc}")
                    break

    for key in ("data_safety_json", "data_safety_markdown", "data_safety_csv"):
        candidate = output_paths.get(key)
        if not isinstance(candidate, str):
            errors.append(f"output_paths.{key} must be set")
            continue
        path = Path(candidate)
        if not path.is_absolute():
            path = root / path
        if not path.is_file():
            errors.append(f"missing {key}: {as_posix(path)}")
            continue
        if key == "data_safety_json":
            artifact = load_json(path, errors)
            if not isinstance(artifact, dict):
                continue
            if artifact.get("schema_version") != "google_play_data_safety_draft.v1":
                errors.append("data_safety_json schema_version must be google_play_data_safety_draft.v1")
            if artifact.get("review_status") != NEED_HUMAN:
                errors.append(f"data_safety_json review_status must be {NEED_HUMAN}")
            if not isinstance(artifact.get("human_review_items"), list) or not artifact.get("human_review_items"):
                errors.append("data_safety_json must contain human_review_items")
        elif key == "data_safety_csv":
            with path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                expected = {
                    "section",
                    "field_path",
                    "play_console_question",
                    "data_category",
                    "data_type",
                    "draft_answer",
                    "response_value",
                    "review_status",
                    "confidence",
                    "evidence_refs",
                    "notes",
                }
                if set(reader.fieldnames or []) != expected:
                    errors.append(f"data_safety_csv header mismatch: {reader.fieldnames}")
                row_count = 0
                for row in reader:
                    row_count += 1
                    if row.get("response_value"):
                        errors.append("data_safety_csv response_value must remain empty until human confirmation")
                        break
                    if row.get("review_status") != NEED_HUMAN:
                        errors.append(f"data_safety_csv row {row_count} review_status must be {NEED_HUMAN}")
                        break
                if row_count == 0:
                    errors.append("data_safety_csv must contain draft rows")

    official_csv = output_paths.get("data_safety_play_console_template_csv")
    if isinstance(official_csv, str):
        official_path = Path(official_csv)
        if not official_path.is_absolute():
            official_path = root / official_path
        if not official_path.is_file():
            errors.append(f"missing data_safety_play_console_template_csv: {as_posix(official_path)}")
        else:
            with official_path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                if list(reader.fieldnames or []) != PLAY_CONSOLE_CSV_COLUMNS:
                    errors.append(f"official Play Console CSV header mismatch: {reader.fieldnames}")
                row_count = 0
                for row in reader:
                    row_count += 1
                    value = row.get("Response value", "")
                    if value not in {"", "TRUE", "FALSE"}:
                        errors.append(f"official Play Console CSV row {row_count} has invalid Response value: {value!r}")
                        break
                if row_count == 0:
                    errors.append("official Play Console CSV must contain template rows")


def validate_no_unbounded_final_claims(data: dict[str, Any], root: Path, errors: list[str]) -> None:
    output_paths = data.get("output_paths") if isinstance(data.get("output_paths"), dict) else {}
    candidates = [output_paths.get("human_markdown")]
    for candidate in candidates:
        if not isinstance(candidate, str):
            continue
        path = Path(candidate)
        if not path.is_absolute():
            path = root / path
        if not path.is_file():
            continue
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            matches = [pattern.pattern for pattern in FORBIDDEN_FINAL_PATTERNS if pattern.search(line)]
            if not matches:
                continue
            lowered = line.lower()
            if any(word.lower() in lowered for word in BOUNDARY_WORDS):
                continue
            errors.append(f"{as_posix(path)}:{line_number} has unbounded final/submission wording: {line.strip()}")


def validate(root: Path, report: Path) -> list[str]:
    errors: list[str] = []
    data = load_json(report, errors)
    if not isinstance(data, dict):
        return errors
    for field in REQUIRED_TOP_LEVEL:
        if field not in data:
            errors.append(f"missing top-level field: {field}")
    evidence_ids = validate_evidence(data, root, errors)
    validate_claims(data, evidence_ids, errors)
    validate_cross_fields(data, errors)
    validate_data_safety_form_draft(data, evidence_ids, errors)
    validate_output_files(data, root, errors)
    validate_no_unbounded_final_claims(data, root, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="校验 privacy-disclosure-prep 输出。")
    parser.add_argument("--root", default=".", help="目标 app 项目根目录")
    parser.add_argument("--report", default="play-store-launch/reports/privacy-disclosure-prep-output.json", help="机器报告 JSON")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    report = Path(args.report)
    if not report.is_absolute():
        report = root / report
    errors = validate(root, report)
    if errors:
        print("PRIVACY_DISCLOSURE_PREP_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1
    print("PRIVACY_DISCLOSURE_PREP_VALIDATION_PASSED")
    print(f"report={as_posix(report)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
