#!/usr/bin/env python3
"""Validate screenshot-storyboard self-contained outputs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


NEED_HUMAN = "NEED_HUMAN"
REQUIRED_REPORT_KEYS = [
    "schema_version",
    "generated_at",
    "overall_status",
    "storyboard_status",
    "source_of_truth",
    "shots",
    "capture_shot_list",
    "capture_handoff",
    "design_brief",
    "claims",
    "evidence",
    "human_review_gates",
    "blockers",
    "output_paths",
]
REQUIRED_SHOT_KEYS = [
    "shot_id",
    "route",
    "route_path",
    "screen_title",
    "scenario",
    "story_goal",
    "claim_ids",
    "visible_evidence",
    "fixture_source",
    "overlay_copy",
    "must_not_show",
    "human_review_required",
    "review_status",
    "evidence_refs",
]
FORBIDDEN_POSITIVE_PHRASES = [
    "ready to submit",
    "submission ready",
    "final compliance",
    "approved by google",
    "已经通过 Google",
]


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception:
        return None


def load_routes(root: Path) -> set[str]:
    data = read_json(root / "mobile" / "pages.json")
    if not isinstance(data, dict):
        return set()
    routes = set()
    for page in data.get("pages") or []:
        if isinstance(page, dict) and page.get("path"):
            routes.add(str(page["path"]))
    return routes


def walk_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        result: list[str] = []
        for item in value:
            result.extend(walk_strings(item))
        return result
    if isinstance(value, dict):
        result = []
        for item in value.values():
            result.extend(walk_strings(item))
        return result
    return []


def relpath(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def validate(root: Path, report_path: Path) -> tuple[bool, list[str]]:
    errors: list[str] = []
    data = read_json(report_path)
    if not isinstance(data, dict):
        return False, [f"report is not valid JSON: {report_path}"]

    for key in REQUIRED_REPORT_KEYS:
        if key not in data:
            errors.append(f"missing report key: {key}")

    if data.get("schema_version") != "screenshot_storyboard.v1":
        errors.append("schema_version must be screenshot_storyboard.v1")
    if data.get("can_use_for_submission") is not False:
        errors.append("can_use_for_submission must be false")

    routes = load_routes(root)
    if not routes:
        errors.append("mobile/pages.json routes could not be parsed")

    evidence_ids = {item.get("evidence_id") for item in data.get("evidence", []) if isinstance(item, dict)}
    claim_ids = {item.get("claim_id") for item in data.get("claims", []) if isinstance(item, dict)}
    shots = data.get("shots") or []
    if not isinstance(shots, list) or len(shots) < 2:
        errors.append("shots must contain at least 2 primary shots")

    for index, shot in enumerate(shots, start=1):
        if not isinstance(shot, dict):
            errors.append(f"shot {index} is not an object")
            continue
        for key in REQUIRED_SHOT_KEYS:
            if key not in shot:
                errors.append(f"shot {index} missing key: {key}")
        route = shot.get("route_path") or shot.get("route")
        if route not in routes:
            errors.append(f"shot {shot.get('shot_id')} route not found in mobile/pages.json: {route}")
        if not shot.get("claim_ids") or not all(claim_id in claim_ids for claim_id in shot.get("claim_ids", [])):
            errors.append(f"shot {shot.get('shot_id')} has unknown claim_ids")
        if not shot.get("visible_evidence"):
            errors.append(f"shot {shot.get('shot_id')} missing visible_evidence")
        if not shot.get("must_not_show"):
            errors.append(f"shot {shot.get('shot_id')} missing must_not_show")
        if shot.get("review_status") != NEED_HUMAN or shot.get("human_review_required") is not True:
            errors.append(f"shot {shot.get('shot_id')} must require NEED_HUMAN review")
        if not shot.get("evidence_refs") or not all(ref in evidence_ids for ref in shot.get("evidence_refs", [])):
            errors.append(f"shot {shot.get('shot_id')} has missing evidence_refs")
        overlay = shot.get("overlay_copy") or {}
        if not overlay.get("title_zh") or not overlay.get("subtitle_zh"):
            errors.append(f"shot {shot.get('shot_id')} missing overlay_copy title/subtitle")

    shot_list = data.get("capture_shot_list") or {}
    capture_shots = shot_list.get("shots") or []
    if shot_list.get("schema_version") != "screenshot_shot_list.v1":
        errors.append("capture_shot_list schema_version must be screenshot_shot_list.v1")
    if len(capture_shots) != len(shots):
        errors.append("capture_shot_list shots must match primary shots count")
    for shot in capture_shots:
        if shot.get("route_path") not in routes:
            errors.append(f"capture shot route not found: {shot.get('route_path')}")
        if shot.get("review_status") != NEED_HUMAN:
            errors.append(f"capture shot must be NEED_HUMAN: {shot.get('shot_id')}")

    handoff = data.get("capture_handoff") or {}
    if handoff.get("schema_version") != "screenshot_capture_handoff.v1":
        errors.append("capture_handoff schema_version must be screenshot_capture_handoff.v1")
    if "screenshot-capture-agent" not in str(handoff.get("recommended_capture_command", "")):
        errors.append("capture_handoff command must target screenshot-capture-agent")

    output_paths = data.get("output_paths") or {}
    for key in ["human_report", "machine_report", "evidence_jsonl", "shot_list", "capture_handoff", "design_brief"]:
        value = output_paths.get(key)
        if not value:
            errors.append(f"missing output path: {key}")
            continue
        path = root / value
        if not path.exists():
            errors.append(f"output path does not exist: {value}")

    combined = "\n".join(walk_strings(data)).lower()
    for phrase in FORBIDDEN_POSITIVE_PHRASES:
        if phrase.lower() in combined:
            errors.append(f"forbidden positive submission phrase found: {phrase}")

    markdown_path_value = output_paths.get("human_report")
    if markdown_path_value:
        markdown_path = root / markdown_path_value
        markdown = markdown_path.read_text(encoding="utf-8") if markdown_path.exists() else ""
        if "不是最终 Google Play 上架素材" not in markdown:
            errors.append("human report must state that storyboard is not final store asset")
        if not re.search(r"NEED_HUMAN", markdown):
            errors.append("human report must list NEED_HUMAN")

    return not errors, errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate screenshot-storyboard outputs.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--report", default="play-store-launch/reports/screenshot-storyboard-output.json", help="Machine report path")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    report_path = Path(args.report)
    if not report_path.is_absolute():
        report_path = root / report_path
    ok, errors = validate(root, report_path)
    result = {
        "status": "pass" if ok else "fail",
        "report": relpath(report_path, root),
        "error_count": len(errors),
        "errors": errors,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
