#!/usr/bin/env python3
"""Validate launch-package-agent readiness packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from agent_reality_validation import validate_magazine_reality_artifact
from play_store_agent_validation_lib import (
    load_json,
    require_files,
    require_json_value,
    require_skill_shape,
    require_terms,
    scan_for_forbidden_final_claims,
    scan_for_secret_patterns,
    validate_agent_output,
    validate_agno_step_artifact,
)


STATIC_REQUIRED_FILES = (
    ".agents/skills/launch-package-agent/SKILL.md",
    "docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md",
    "artifacts/launch-package/manifest.json",
    "artifacts/launch-package/readiness-report.md",
    "artifacts/launch-package/launch-package-agent-output.json",
    "artifacts/agno/play-store/m4/launch-package-agent.json",
    "evals/agents/launch-package-agent.eval.yaml",
)

PACKAGE_FILES = (
    "PLAY_STORE_RELEASE_READINESS.zh-CN.md",
    "readiness-report.md",
    "manifest.json",
    "launch-package-agent-output.json",
    "NEED_HUMAN.md",
    "FILES_INCLUDED.txt",
)

REPORT_SECTIONS = (
    "一、结论摘要",
    "二、已经具备的材料",
    "三、还没有或不完整的材料",
    "四、Blockers / NEED_HUMAN",
    "五、不可声称事项",
    "六、Owner 下一步行动",
)

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

FORBIDDEN_TERMS = ("final", "approved", "submitted", "complete", "production_ready")
BOUNDARY_TERMS = (
    "not ",
    "no ",
    "never",
    "do not",
    "must not",
    "cannot",
    "blocked",
    "draft",
    "human review",
    "needs_human",
    "不可",
    "不能",
    "不得",
    "不是",
    "未",
    "禁止",
    "草稿",
    "人审",
    "阻塞",
)


def latest_package_dir(root: Path, requested_package: str | None, errors: list[str]) -> Path | None:
    base = root / "artifacts/launch-package"
    if requested_package:
        path = base / requested_package
        if not path.is_dir():
            errors.append(f"requested launch package directory is missing: {path.as_posix()}")
            return None
        return path
    if not base.is_dir():
        errors.append("missing artifacts/launch-package directory")
        return None
    candidates = sorted(
        path
        for path in base.iterdir()
        if path.is_dir()
        and path.name.startswith("play-store-l3-")
        and (path / "manifest.json").is_file()
    )
    if not candidates:
        errors.append("missing run-scoped launch package directory: artifacts/launch-package/play-store-l3-*")
        return None
    return candidates[-1]


def rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def read_json_file(path: Path, errors: list[str]) -> Any | None:
    if not path.is_file():
        errors.append(f"missing JSON file: {path.as_posix()}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{path.as_posix()} is not valid JSON: {exc}")
        return None


def require_non_empty_package_files(root: Path, package_dir: Path, errors: list[str]) -> list[str]:
    package_refs: list[str] = []
    for name in PACKAGE_FILES:
        path = package_dir / name
        relative = rel(root, path)
        package_refs.append(relative)
        if not path.is_file():
            errors.append(f"missing launch package file: {relative}")
            continue
        if path.stat().st_size == 0:
            errors.append(f"launch package file must be non-empty: {relative}")
    return package_refs


def validate_forbidden_terms(path: Path, errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for line_number, line in enumerate(text.splitlines(), start=1):
        lowered = line.lower()
        matches = [term for term in FORBIDDEN_TERMS if re.search(rf"\b{re.escape(term)}\b", lowered)]
        if not matches:
            continue
        if any(marker in lowered for marker in BOUNDARY_TERMS):
            continue
        errors.append(
            f"{path.as_posix()}:{line_number} has unbounded forbidden conclusion wording: "
            + ", ".join(matches)
        )


def validate_chinese_report(root: Path, package_dir: Path, errors: list[str]) -> None:
    report_path = package_dir / "PLAY_STORE_RELEASE_READINESS.zh-CN.md"
    if not report_path.is_file():
        return
    text = report_path.read_text(encoding="utf-8")
    for section in REPORT_SECTIONS:
        if section not in text:
            errors.append(f"{rel(root, report_path)} missing required section: {section}")
    chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    if chinese_chars < 250:
        errors.append(f"{rel(root, report_path)} must be Chinese-first, found only {chinese_chars} Chinese chars")
    for bad_log_term in ("VALIDATION_PASSED", "VALIDATION_FAILED", "validator_exit_code", "Traceback"):
        if bad_log_term in text:
            errors.append(f"{rel(root, report_path)} looks like a validator/runtime log: {bad_log_term}")
    for term in (
        "当前是否可以提交 Google Play：否",
        "readiness：RED",
        "signed Android build",
        "Play Console app/account",
        "Privacy policy URL",
        "Developer contact",
        "Data Safety",
        "content rating",
        "target audience",
        "real screenshot capture",
        "不是 Play Store ready",
        "未调用 Play Console API",
        "未使用 real credentials",
        "owner",
        "Pro",
        "dev",
    ):
        if term not in text:
            errors.append(f"{rel(root, report_path)} missing required owner-facing term: {term}")
    validate_forbidden_terms(report_path, errors)


def validate_files_included(root: Path, package_dir: Path, package_refs: list[str], errors: list[str]) -> None:
    listing_path = package_dir / "FILES_INCLUDED.txt"
    if not listing_path.is_file():
        return
    text = listing_path.read_text(encoding="utf-8")
    for relative in package_refs:
        if relative not in text:
            errors.append(f"{rel(root, listing_path)} missing package file reference: {relative}")


def validate_need_human(root: Path, package_dir: Path, errors: list[str]) -> None:
    path = package_dir / "NEED_HUMAN.md"
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for term in (
        "release",
        "privacy",
        "Data Safety",
        "listing",
        "screenshot",
        "Play Console",
        "owner",
        "Pro",
        "dev",
        "blocked",
    ):
        if term not in text:
            errors.append(f"{rel(root, path)} missing NEED_HUMAN term: {term}")
    validate_forbidden_terms(path, errors)


def validate_manifest(root: Path, package_dir: Path, package_refs: list[str], errors: list[str]) -> dict[str, Any] | None:
    relative = rel(root, package_dir / "manifest.json")
    data = read_json_file(package_dir / "manifest.json", errors)
    if not isinstance(data, dict):
        return None
    require_json_value(data, "schema_version", "play_store_launch_package_manifest.v1", errors, relative)
    require_json_value(data, "run_id", package_dir.name, errors, relative)
    readiness = data.get("readiness")
    if readiness not in {"GREEN", "YELLOW", "RED"}:
        errors.append(f"{relative} readiness must be GREEN, YELLOW, or RED")
    blockers = data.get("blockers")
    if not isinstance(blockers, list):
        errors.append(f"{relative} blockers must be a list")
    elif blockers and readiness == "GREEN":
        errors.append(f"{relative} readiness must not be GREEN while blockers are present")
    if data.get("can_submit_google_play") is not False:
        errors.append(f"{relative} can_submit_google_play must be false while blockers remain")
    agent_outputs = data.get("agent_outputs")
    if not isinstance(agent_outputs, dict):
        errors.append(f"{relative} missing agent_outputs object")
    else:
        for agent_id in AGENTS:
            if agent_id not in agent_outputs:
                errors.append(f"{relative} missing agent output: {agent_id}")
    outputs = data.get("launch_package_outputs")
    if not isinstance(outputs, list):
        errors.append(f"{relative} launch_package_outputs must be a list")
    else:
        for expected in package_refs:
            if expected not in outputs:
                errors.append(f"{relative} launch_package_outputs missing: {expected}")
        for output_ref in outputs:
            if not isinstance(output_ref, str) or not output_ref.startswith(f"artifacts/launch-package/{package_dir.name}/"):
                errors.append(f"{relative} launch_package_outputs must point to the run-scoped package directory: {output_ref}")
    non_claims = data.get("non_claims")
    if not isinstance(non_claims, list):
        errors.append(f"{relative} non_claims must be a list")
    else:
        for term in (
            "not submitted",
            "not production_ready",
            "not Data Safety approved",
            "not screenshots captured",
            "not Play Store ready",
            "Play Console API not called",
            "real credentials not used",
        ):
            if term not in non_claims:
                errors.append(f"{relative} non_claims missing: {term}")
    return data


def validate_launch_output(root: Path, package_dir: Path, errors: list[str]) -> dict[str, Any] | None:
    relative = rel(root, package_dir / "launch-package-agent-output.json")
    data = validate_agent_output(root, relative, "launch-package-agent", errors, min_claims=5)
    if not isinstance(data, dict):
        return None
    if data.get("readiness") not in {"GREEN", "YELLOW", "RED"}:
        errors.append(f"{relative} readiness must be GREEN, YELLOW, or RED")
    blockers = data.get("blockers")
    if isinstance(blockers, list) and blockers and data.get("readiness") == "GREEN":
        errors.append(f"{relative} readiness must not be GREEN while blockers are present")
    if data.get("can_submit_google_play") is not False:
        errors.append(f"{relative} can_submit_google_play must be false")
    for ref_field in ("summary_report_ref", "manifest_ref", "need_human_ref", "files_included_ref", "chinese_report_ref"):
        value = data.get(ref_field)
        if not isinstance(value, str) or not value.startswith(f"artifacts/launch-package/{package_dir.name}/"):
            errors.append(f"{relative} {ref_field} must point to artifacts/launch-package/{package_dir.name}/")
    non_claims = data.get("non_claims")
    if not isinstance(non_claims, list):
        errors.append(f"{relative} non_claims must be a list")
    else:
        for term in (
            "not submitted",
            "not production_ready",
            "not Data Safety approved",
            "not screenshots captured",
            "not Play Store ready",
        ):
            if term not in non_claims:
                errors.append(f"{relative} non_claims missing: {term}")
    return data


def validate_screenshot_safety(root: Path, package_dir: Path, errors: list[str]) -> None:
    screenshot_output = load_json(root, "docs/launch/screenshots/screenshot-capture-agent-output.json", errors)
    if not isinstance(screenshot_output, dict):
        return
    if screenshot_output.get("capture_status") != "blocked":
        return
    report_text = (package_dir / "PLAY_STORE_RELEASE_READINESS.zh-CN.md").read_text(encoding="utf-8")
    manifest = read_json_file(package_dir / "manifest.json", errors)
    output = read_json_file(package_dir / "launch-package-agent-output.json", errors)
    if "screenshots 未 captured" not in report_text and "截图尚未 captured" not in report_text:
        errors.append(f"{rel(root, package_dir / 'PLAY_STORE_RELEASE_READINESS.zh-CN.md')} must say screenshots were not captured")
    for source_name, data in (("manifest.json", manifest), ("launch-package-agent-output.json", output)):
        if isinstance(data, dict):
            text = json.dumps(data, ensure_ascii=False)
            if "screenshots captured" in text and "not screenshots captured" not in text:
                errors.append(f"{rel(root, package_dir / source_name)} must not claim screenshots captured while capture_status=blocked")


def validate_dynamic_package(root: Path, package_dir: Path, errors: list[str]) -> None:
    package_refs = require_non_empty_package_files(root, package_dir, errors)
    validate_chinese_report(root, package_dir, errors)
    validate_need_human(root, package_dir, errors)
    validate_files_included(root, package_dir, package_refs, errors)
    manifest = validate_manifest(root, package_dir, package_refs, errors)
    output = validate_launch_output(root, package_dir, errors)
    validate_screenshot_safety(root, package_dir, errors)
    for name in ("readiness-report.md", "NEED_HUMAN.md"):
        path = package_dir / name
        if path.is_file():
            validate_forbidden_terms(path, errors)
    if isinstance(manifest, dict) and isinstance(output, dict):
        if manifest.get("readiness") != output.get("readiness"):
            errors.append(f"{rel(root, package_dir / 'manifest.json')} readiness must match launch-package-agent-output.json")
        if manifest.get("can_submit_google_play") != output.get("can_submit_google_play"):
            errors.append(f"{rel(root, package_dir / 'manifest.json')} can_submit_google_play must match launch-package-agent-output.json")


def validate(root: Path, package_id: str | None = None) -> list[str]:
    errors: list[str] = []
    require_files(root, STATIC_REQUIRED_FILES, errors)
    require_skill_shape(root, ".agents/skills/launch-package-agent/SKILL.md", "launch-package-agent", errors)
    require_terms(
        root,
        ".agents/skills/launch-package-agent/SKILL.md",
        (
            "artifacts/launch-package/{run_id}/PLAY_STORE_RELEASE_READINESS.zh-CN.md",
            "FILES_INCLUDED.txt",
            "NEED_HUMAN.md",
            "INPUT_CONTRACT.md",
            "OUTPUT_CONTRACT.md",
            "EVIDENCE_LEDGER.md",
            "HUMAN_APPROVAL_GATE.md",
            "validator command",
            "GREEN",
            "YELLOW",
            "RED",
        ),
        errors,
    )
    package_dir = latest_package_dir(root, package_id, errors)
    if package_dir is not None:
        validate_dynamic_package(root, package_dir, errors)
    validate_agno_step_artifact(
        root,
        "artifacts/agno/play-store/m4/launch-package-agent.json",
        "launch-package-agent",
        errors,
    )
    validate_magazine_reality_artifact(
        root,
        "launch-package-agent",
        errors,
        min_claims=5,
        min_evidence=6,
        require_launch_consumption=True,
    )
    scan_for_forbidden_final_claims(root, STATIC_REQUIRED_FILES, errors)
    scan_for_secret_patterns(root, STATIC_REQUIRED_FILES, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate launch-package-agent assets.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--package-id", help="Specific artifacts/launch-package/{package-id} directory")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root, args.package_id)
    if errors:
        print("LAUNCH_PACKAGE_AGENT_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("LAUNCH_PACKAGE_AGENT_VALIDATION_PASSED")
    print("status=pass")
    print("owner_facing_summary=中文发布准备报告已存在，并且绑定 run-scoped launch package")
    return 0


if __name__ == "__main__":
    sys.exit(main())
