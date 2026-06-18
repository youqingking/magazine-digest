#!/usr/bin/env python3
"""Validate screenshot-capture-agent outputs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "screenshot_capture_agent.v1"
NEED_HUMAN = "NEED_HUMAN"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
REQUIRED_TOP_LEVEL = (
    "schema_version",
    "generated_at",
    "capture_status",
    "root",
    "project_fingerprint",
    "tooling",
    "device_inventory",
    "target_app",
    "upstream_storyboard",
    "navigation",
    "shot_plan",
    "capture_attempts",
    "screenshots",
    "google_play_spec_checks",
    "claims",
    "evidence",
    "human_review_gates",
    "blockers",
    "limitations",
    "output_paths",
)
CLAIM_CLASSES = {"C0", "C1", "C2", "C3", "C4", "C5"}
HIGH_REVIEW_CLASSES = {"C3", "C4", "C5"}
FORBIDDEN_FINAL_PATTERNS = (
    re.compile(r"\bready to submit\b", re.IGNORECASE),
    re.compile(r"\bsubmission ready\b", re.IGNORECASE),
    re.compile(r"\bapproved\b", re.IGNORECASE),
    re.compile(r"\bcompliant\b", re.IGNORECASE),
    re.compile(r"可提交"),
    re.compile(r"最终素材"),
)
BOUNDARY_WORDS = ("不是", "不能", "不证明", "NEED_HUMAN", "blocked", "needs_human", "人工")


def as_posix(path: str | Path) -> str:
    return str(path).replace("\\", "/")


def load_json(path: Path, errors: list[str]) -> Any | None:
    if not path.is_file():
        errors.append(f"missing JSON: {as_posix(path)}")
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


def validate_evidence(data: dict[str, Any], errors: list[str]) -> set[str]:
    evidence = require_list(data, "evidence", errors)
    ids: set[str] = set()
    for index, item in enumerate(evidence):
        if not isinstance(item, dict):
            errors.append(f"evidence[{index}] must be an object")
            continue
        for field in ("evidence_id", "source_type", "source_ref", "observed_key", "observed_value", "parser", "snippet_hash", "confidence"):
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
    if not evidence:
        errors.append("evidence must not be empty")
    return ids


def validate_claims(data: dict[str, Any], evidence_ids: set[str], errors: list[str]) -> None:
    claims = require_list(data, "claims", errors)
    if len(claims) < 5:
        errors.append("expected at least 5 claims")
    seen: set[str] = set()
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            errors.append(f"claims[{index}] must be an object")
            continue
        for field in ("claim_id", "question", "status", "claim_class", "human_review_required", "review_status", "value", "confidence", "evidence_refs", "limitations"):
            if field not in claim:
                errors.append(f"claims[{index}] missing {field}")
        claim_id = claim.get("claim_id", f"claims[{index}]")
        if isinstance(claim_id, str):
            if claim_id in seen:
                errors.append(f"duplicate claim_id: {claim_id}")
            seen.add(claim_id)
        claim_class = claim.get("claim_class")
        if claim_class not in CLAIM_CLASSES:
            errors.append(f"{claim_id} invalid claim_class: {claim_class!r}")
        if claim_class in HIGH_REVIEW_CLASSES and claim.get("review_status") != NEED_HUMAN:
            errors.append(f"{claim_id} {claim_class} must set review_status={NEED_HUMAN}")
        refs = claim.get("evidence_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{claim_id} must have evidence_refs")
        elif any(ref not in evidence_ids for ref in refs):
            errors.append(f"{claim_id} references unknown evidence ids")


def validate_cross_fields(data: dict[str, Any], errors: list[str]) -> None:
    if data.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION}")
    if data.get("capture_status") not in {"blocked", "partial", "captured"}:
        errors.append(f"invalid capture_status: {data.get('capture_status')!r}")
    screenshots = data.get("screenshots")
    if not isinstance(screenshots, list):
        errors.append("screenshots must be a list")
        return
    if data.get("capture_status") == "blocked" and screenshots:
        errors.append("capture_status=blocked must not include screenshots")
    if data.get("capture_status") in {"partial", "captured"} and not screenshots:
        errors.append("partial/captured status requires screenshots")
    if data.get("capture_status") == "captured" and data.get("blockers"):
        hard = [item for item in data.get("blockers", []) if isinstance(item, dict) and item.get("blocker_id") != "google_play_public_use_needs_human"]
        if hard:
            errors.append("capture_status=captured cannot have hard blockers")
    gates = data.get("human_review_gates")
    if not isinstance(gates, list):
        errors.append("human_review_gates must be a list")
    elif not gates:
        errors.append("screenshot capture must keep public-use human review gates")
    upstream = data.get("upstream_storyboard")
    if not isinstance(upstream, dict):
        errors.append("upstream_storyboard must be an object")
    else:
        status = upstream.get("status")
        if status not in {"observed_in_repo", "missing"}:
            errors.append(f"upstream_storyboard.status invalid: {status!r}")
    navigation = data.get("navigation")
    if not isinstance(navigation, dict):
        errors.append("navigation must be an object")
    else:
        if "navigation_verified" not in navigation:
            errors.append("navigation.navigation_verified missing")


def validate_screenshots(data: dict[str, Any], root: Path, evidence_ids: set[str], errors: list[str]) -> None:
    hashes: dict[str, list[str]] = {}
    for index, shot in enumerate(data.get("screenshots", [])):
        if not isinstance(shot, dict):
            errors.append(f"screenshots[{index}] must be an object")
            continue
        for field in ("shot_id", "path", "route", "route_path", "route_params", "planned_route_from_storyboard", "navigation_verified", "route_verified", "claim_ids", "fixture_source", "visible_evidence", "must_not_show", "device", "locale", "commit", "sha256", "width", "height", "png_analysis", "google_play_spec_check", "review_status", "evidence_refs"):
            if field not in shot:
                errors.append(f"screenshots[{index}] missing {field}")
        if shot.get("review_status") != NEED_HUMAN:
            errors.append(f"screenshots[{index}] review_status must be {NEED_HUMAN}")
        if shot.get("route_verified") is True and shot.get("navigation_verified") is not True:
            errors.append(f"screenshots[{index}] route_verified cannot be true without navigation_verified")
        digest = shot.get("sha256")
        shot_id = shot.get("shot_id")
        if isinstance(digest, str) and isinstance(shot_id, str):
            hashes.setdefault(digest, []).append(shot_id)
        path_value = shot.get("path")
        if isinstance(path_value, str):
            path = Path(path_value)
            if not path.is_absolute():
                path = root / path
            if not path.is_file():
                errors.append(f"screenshots[{index}] path missing: {as_posix(path)}")
            elif path.read_bytes()[:8] != PNG_SIGNATURE:
                errors.append(f"screenshots[{index}] is not PNG: {as_posix(path)}")
        refs = shot.get("evidence_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"screenshots[{index}] must have evidence_refs")
        elif any(ref not in evidence_ids for ref in refs):
            errors.append(f"screenshots[{index}] references unknown evidence ids")
        spec = shot.get("google_play_spec_check")
        if not isinstance(spec, dict):
            errors.append(f"screenshots[{index}] google_play_spec_check must be an object")
        elif spec.get("review_status") != NEED_HUMAN:
            errors.append(f"screenshots[{index}] google_play_spec_check.review_status must be {NEED_HUMAN}")
    for digest, shot_ids in hashes.items():
        if digest and len(set(shot_ids)) > 1:
            errors.append(f"duplicate screenshot sha256 across shots: {digest} -> {', '.join(sorted(set(shot_ids)))}")


def validate_output_files(data: dict[str, Any], root: Path, errors: list[str]) -> None:
    output_paths = data.get("output_paths")
    if not isinstance(output_paths, dict):
        errors.append("output_paths must be an object")
        return
    for key in ("machine_json", "human_markdown", "evidence_jsonl", "manifest_json"):
        value = output_paths.get(key)
        if not isinstance(value, str):
            errors.append(f"output_paths.{key} missing")
            continue
        path = Path(value)
        if not path.is_absolute():
            path = root / path
        if not path.is_file():
            errors.append(f"missing output file {key}: {as_posix(path)}")
            continue
        if key == "evidence_jsonl":
            for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
                try:
                    json.loads(line)
                except json.JSONDecodeError as exc:
                    errors.append(f"evidence_jsonl line {line_number} invalid JSON: {exc}")
                    break
        if key == "manifest_json":
            manifest = load_json(path, errors)
            if isinstance(manifest, dict):
                if manifest.get("schema_version") != "screenshot_capture_manifest.v1":
                    errors.append("manifest schema_version must be screenshot_capture_manifest.v1")
                if manifest.get("review_status") != NEED_HUMAN:
                    errors.append(f"manifest review_status must be {NEED_HUMAN}")


def validate_no_unbounded_final_claims(data: dict[str, Any], root: Path, errors: list[str]) -> None:
    output_paths = data.get("output_paths") if isinstance(data.get("output_paths"), dict) else {}
    human = output_paths.get("human_markdown")
    if not isinstance(human, str):
        return
    path = Path(human)
    if not path.is_absolute():
        path = root / path
    if not path.is_file():
        return
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not any(pattern.search(line) for pattern in FORBIDDEN_FINAL_PATTERNS):
            continue
        if any(word.lower() in line.lower() for word in BOUNDARY_WORDS):
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
    evidence_ids = validate_evidence(data, errors)
    validate_claims(data, evidence_ids, errors)
    validate_cross_fields(data, errors)
    validate_screenshots(data, root, evidence_ids, errors)
    validate_output_files(data, root, errors)
    validate_no_unbounded_final_claims(data, root, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="校验 screenshot-capture-agent 输出。")
    parser.add_argument("--root", default=".", help="目标 app 项目根目录")
    parser.add_argument("--report", default="play-store-launch/reports/screenshot-capture-agent-output.json", help="机器报告 JSON")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    report = Path(args.report)
    if not report.is_absolute():
        report = root / report
    errors = validate(root, report)
    if errors:
        print("SCREENSHOT_CAPTURE_AGENT_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1
    print("SCREENSHOT_CAPTURE_AGENT_VALIDATION_PASSED")
    print(f"report={as_posix(report)}")
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
