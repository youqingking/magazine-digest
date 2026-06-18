#!/usr/bin/env python3
"""Attempt real Android screenshot capture and generate fail-closed evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import subprocess
import time
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "screenshot_capture_agent.v1"
DEFAULT_OUTPUT_DIR = "play-store-launch/reports"
DEFAULT_RAW_DIR = "play-store-launch/screenshots/raw/android/en-US"
DEFAULT_STORYBOARD_HANDOFF = "play-store-launch/reports/screenshot-capture-handoff.json"
DEFAULT_STORYBOARD_SHOT_LIST = "play-store-launch/reports/screenshot-shot-list.json"
LEGACY_SHOT_LIST = "docs/launch/screenshots/shot-list.json"
NEED_HUMAN = "NEED_HUMAN"
AUTO_PARSED = "AUTO_PARSED"
GOOGLE_SPEC_URL = "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
SKILL_DIR = Path(__file__).resolve().parents[1]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def as_posix(path: str | Path) -> str:
    return str(path).replace("\\", "/")


def read_text(path: Path, max_bytes: int = 2_000_000) -> str:
    if not path.is_file():
        return ""
    try:
        if path.stat().st_size > max_bytes:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def read_json(path: Path) -> Any | None:
    text = read_text(path)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def path_for(root: Path, value: str | Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root / path


def rel_to_root(path: Path, root: Path) -> str:
    try:
        return as_posix(path.resolve().relative_to(root.resolve()))
    except ValueError:
        return as_posix(path)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def sha256_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()


def command_display(command: list[str]) -> str:
    return " ".join(f'"{part}"' if " " in part else part for part in command)


def excerpt(text: str, limit: int = 2000) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + f"...<truncated {len(text) - limit} chars>"


def run_command(command: list[str], cwd: Path | None = None, timeout: int = 20) -> dict[str, Any]:
    started = utc_now()
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "stdout_excerpt": excerpt(result.stdout),
            "stderr_excerpt": excerpt(result.stderr),
            "timed_out": False,
        }
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout if isinstance(exc.stdout, str) else ""
        stderr = exc.stderr if isinstance(exc.stderr, str) else ""
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": 124,
            "stdout": stdout,
            "stderr": stderr,
            "stdout_excerpt": excerpt(stdout),
            "stderr_excerpt": excerpt(stderr),
            "timed_out": True,
        }
    except OSError as exc:
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": 127,
            "stdout": "",
            "stderr": str(exc),
            "stdout_excerpt": "",
            "stderr_excerpt": str(exc),
            "timed_out": False,
        }


def run_binary(command: list[str], timeout: int = 30) -> dict[str, Any]:
    started = utc_now()
    try:
        result = subprocess.run(command, capture_output=True, timeout=timeout, check=False)
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": result.returncode,
            "stdout_bytes": result.stdout,
            "stderr": result.stderr.decode("utf-8", errors="replace"),
            "byte_count": len(result.stdout),
            "timed_out": False,
        }
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout if isinstance(exc.stdout, bytes) else b""
        stderr_bytes = exc.stderr if isinstance(exc.stderr, bytes) else b""
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": 124,
            "stdout_bytes": stdout,
            "stderr": stderr_bytes.decode("utf-8", errors="replace"),
            "byte_count": len(stdout),
            "timed_out": True,
        }
    except OSError as exc:
        return {
            "command": command_display(command),
            "started_at": started,
            "finished_at": utc_now(),
            "exit_code": 127,
            "stdout_bytes": b"",
            "stderr": str(exc),
            "byte_count": 0,
            "timed_out": False,
        }


def add_evidence(
    evidence: list[dict[str, Any]],
    *,
    source_type: str,
    source_ref: str,
    observed_key: str,
    observed_value: Any,
    parser: str,
    confidence: float = 1.0,
) -> str:
    evidence_id = f"evidence.{len(evidence) + 1:04d}"
    entry = {
        "evidence_id": evidence_id,
        "source_type": source_type,
        "source_ref": source_ref,
        "observed_key": observed_key,
        "observed_value": observed_value,
        "parser": parser,
        "snippet_hash": sha256_text(f"{source_ref}:{observed_key}:{observed_value}"),
        "confidence": confidence,
    }
    evidence.append(entry)
    return evidence_id


def add_command_evidence(evidence: list[dict[str, Any]], result: dict[str, Any], key: str, confidence: float = 1.0) -> str:
    value = {
        "command": result["command"],
        "exit_code": result["exit_code"],
        "stdout_excerpt": result.get("stdout_excerpt", ""),
        "stderr_excerpt": result.get("stderr_excerpt", ""),
        "timed_out": result.get("timed_out", False),
    }
    return add_evidence(
        evidence,
        source_type="command",
        source_ref=result["command"],
        observed_key=key,
        observed_value=value,
        parser="subprocess",
        confidence=confidence,
    )


def add_claim(
    claims: list[dict[str, Any]],
    *,
    claim_id: str,
    question: str,
    status: str,
    claim_class: str,
    evidence_refs: list[str],
    value: Any,
    confidence: float,
    limitations: list[str] | None = None,
    human_review_required: bool | None = None,
) -> None:
    review = claim_class in {"C3", "C4", "C5"} if human_review_required is None else bool(human_review_required)
    claims.append({
        "claim_id": claim_id,
        "question": question,
        "status": status,
        "claim_class": claim_class,
        "human_review_required": review,
        "review_status": NEED_HUMAN if review else AUTO_PARSED,
        "value": value,
        "confidence": confidence,
        "evidence_refs": evidence_refs,
        "limitations": limitations or [],
    })


def git_commit(root: Path) -> str:
    result = run_command(["git", "rev-parse", "HEAD"], cwd=root, timeout=10)
    return result["stdout"].strip() if result["exit_code"] == 0 else ""


def find_adb(explicit: str = "") -> str:
    if explicit:
        return explicit
    found = shutil.which("adb")
    if found:
        return found
    candidates = [
        Path.home() / "AppData" / "Local" / "Android" / "Sdk" / "platform-tools" / "adb.exe",
        Path.home() / "Android" / "Sdk" / "platform-tools" / "adb.exe",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return ""


def parse_adb_devices(stdout: str) -> list[dict[str, Any]]:
    devices: list[dict[str, Any]] = []
    for raw in stdout.splitlines():
        line = raw.strip()
        if not line or line.lower().startswith("list of devices"):
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        serial, state = parts[0], parts[1]
        descriptors: dict[str, str] = {}
        for token in parts[2:]:
            if ":" in token:
                key, value = token.split(":", 1)
                descriptors[key] = value
        devices.append({"serial": serial, "state": state, "descriptors": descriptors})
    return devices


def discover_target_packages(root: Path, explicit_package: str) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    if explicit_package:
        candidates.append({"package": explicit_package, "source": "cli", "role": "explicit"})
    app_json = read_json(root / "app.json")
    if isinstance(app_json, dict):
        package = app_json.get("expo", {}).get("android", {}).get("package")
        if package:
            candidates.append({"package": str(package), "source": "app.json", "role": "declared_release_package"})
    manifest = read_json(root / "mobile" / "manifest.json")
    if isinstance(manifest, dict):
        appid = manifest.get("appid")
        if appid:
            candidates.append({"package": "io.dcloud.HBuilder", "source": "mobile/manifest.json", "role": f"hbuilderx_debug_container_for_{appid}"})
    candidates.append({"package": "io.dcloud.HBuilder", "source": "fallback", "role": "hbuilderx_debug_container"})
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in candidates:
        package = item["package"]
        if package in seen:
            continue
        seen.add(package)
        result.append(item)
    return result


def adb_cmd(adb: str, serial: str, *args: str) -> list[str]:
    command = [adb]
    if serial:
        command += ["-s", serial]
    command += list(args)
    return command


def parse_foreground_package(*texts: str) -> dict[str, str]:
    combined = "\n".join(texts)
    patterns = [
        r"mCurrentFocus=Window\{[^}]+\s+([A-Za-z0-9_.]+)/(.*?)\}",
        r"mFocusedApp=.*?\s([A-Za-z0-9_.]+)/([A-Za-z0-9_.$/]+)",
        r"topResumedActivity=.*?\s([A-Za-z0-9_.]+)/([A-Za-z0-9_.$/]+)",
        r"ResumedActivity:.*?\s([A-Za-z0-9_.]+)/([A-Za-z0-9_.$/]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, combined)
        if match:
            return {"package": match.group(1), "activity": match.group(2), "raw_match": match.group(0)}
    return {"package": "", "activity": "", "raw_match": ""}


def load_mobile_routes(root: Path, evidence: list[dict[str, Any]]) -> tuple[set[str], list[str]]:
    data = read_json(root / "mobile" / "pages.json")
    routes: set[str] = set()
    if isinstance(data, dict):
        for page in data.get("pages") or []:
            if isinstance(page, dict) and page.get("path"):
                routes.add(str(page["path"]))
    evidence_id = add_evidence(
        evidence,
        source_type="repo_config",
        source_ref="mobile/pages.json",
        observed_key="mobile.routes",
        observed_value={"count": len(routes), "routes": sorted(routes)},
        parser="json",
        confidence=0.95 if routes else 0.2,
    )
    return routes, [evidence_id]


def load_storyboard_handoff(root: Path, handoff_path: str, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    candidates: list[Path] = []
    if handoff_path:
        candidates.append(path_for(root, handoff_path))
    candidates.append(root / DEFAULT_STORYBOARD_HANDOFF)
    for path in candidates:
        data = read_json(path)
        if not isinstance(data, dict):
            continue
        evidence_id = add_evidence(
            evidence,
            source_type="storyboard_handoff",
            source_ref=rel_to_root(path, root),
            observed_key="storyboard.handoff",
            observed_value={
                "schema_version": data.get("schema_version"),
                "produced_by": data.get("produced_by"),
                "shot_list_path": data.get("shot_list_path"),
                "shot_count": len(data.get("shots") or []),
                "blocker_count": len(data.get("blockers") or []),
            },
            parser="json",
            confidence=0.9,
        )
        return {
            "status": "observed_in_repo",
            "path": rel_to_root(path, root),
            "schema_version": data.get("schema_version"),
            "produced_by": data.get("produced_by"),
            "expected_downstream_skill": data.get("expected_downstream_skill"),
            "shot_list_path": data.get("shot_list_path") or "",
            "recommended_capture_command": data.get("recommended_capture_command") or "",
            "blockers": data.get("blockers") or [],
            "human_review_gates": data.get("human_review_gates") or [],
            "evidence_refs": [evidence_id],
        }
    return {
        "status": "missing",
        "path": "",
        "schema_version": "",
        "produced_by": "",
        "expected_downstream_skill": "",
        "shot_list_path": "",
        "recommended_capture_command": "",
        "blockers": [],
        "human_review_gates": [],
        "evidence_refs": [],
    }


def normalize_shot(raw: dict[str, Any], index: int, source_ref: str, evidence_id: str, from_storyboard: bool) -> dict[str, Any]:
    shot_id = str(raw.get("shot_id") or raw.get("id") or f"shot_{index:02d}")
    route = str(raw.get("route_path") or raw.get("route") or raw.get("page") or raw.get("path") or NEED_HUMAN)
    route_path = str(raw.get("route_path") or route)
    scenario = str(raw.get("scenario") or raw.get("fixture") or raw.get("title") or "")
    route_params = raw.get("route_params") if isinstance(raw.get("route_params"), dict) else {}
    claim_ids = raw.get("claim_ids") if isinstance(raw.get("claim_ids"), list) else []
    visible_evidence = raw.get("visible_evidence") if isinstance(raw.get("visible_evidence"), list) else []
    fixture_source = raw.get("fixture_source") if isinstance(raw.get("fixture_source"), list) else []
    must_not_show = raw.get("must_not_show") if isinstance(raw.get("must_not_show"), list) else []
    return {
        "shot_id": shot_id,
        "route": route,
        "route_path": route_path,
        "route_params": route_params,
        "scenario": scenario,
        "title": str(raw.get("title") or raw.get("screen_title") or ""),
        "claim_ids": claim_ids,
        "fixture_source": fixture_source,
        "visible_evidence": visible_evidence,
        "must_not_show": must_not_show,
        "source_ref": source_ref,
        "source_schema": str(raw.get("schema_version") or ""),
        "planned_route_from_storyboard": from_storyboard,
        "navigation_verified": False,
        "human_review_required": True,
        "review_status": raw.get("review_status") or NEED_HUMAN,
        "evidence_refs": [evidence_id],
    }


def load_shot_plan(
    root: Path,
    args: argparse.Namespace,
    storyboard_handoff: dict[str, Any],
    evidence: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[str]]:
    blockers: list[dict[str, Any]] = []
    route_set, route_evidence_refs = load_mobile_routes(root, evidence)
    candidates: list[Path] = []
    if args.shot_list:
        candidates.append(path_for(root, args.shot_list))
    elif storyboard_handoff.get("shot_list_path"):
        candidates.append(path_for(root, storyboard_handoff["shot_list_path"]))
    candidates.extend([root / DEFAULT_STORYBOARD_SHOT_LIST, root / LEGACY_SHOT_LIST])

    seen_candidates: set[str] = set()
    unique_candidates: list[Path] = []
    for candidate in candidates:
        key = str(candidate.resolve())
        if key not in seen_candidates:
            seen_candidates.add(key)
            unique_candidates.append(candidate)

    for path in unique_candidates:
        data = read_json(path)
        if data is None:
            continue
        if isinstance(data, dict):
            raw_shots = data.get("shots") or data.get("items") or data.get("screenshots") or []
        elif isinstance(data, list):
            raw_shots = data
        else:
            raw_shots = []
        shots: list[dict[str, Any]] = []
        from_storyboard = isinstance(data, dict) and data.get("schema_version") == "screenshot_shot_list.v1"
        source_ref = rel_to_root(path, root)
        for index, raw in enumerate(raw_shots, start=1):
            if not isinstance(raw, dict):
                continue
            shot_id = str(raw.get("shot_id") or raw.get("id") or f"shot_{index:02d}")
            if args.shot_id and shot_id != args.shot_id:
                continue
            evidence_id = add_evidence(
                evidence,
                source_type="repo_config",
                source_ref=source_ref,
                observed_key=f"shot_plan.{shot_id}",
                observed_value={
                    "route": raw.get("route") or raw.get("route_path") or raw.get("page") or raw.get("path"),
                    "route_path": raw.get("route_path"),
                    "route_params": raw.get("route_params"),
                    "scenario": raw.get("scenario"),
                    "claim_ids": raw.get("claim_ids"),
                    "must_not_show": raw.get("must_not_show"),
                },
                parser="json",
                confidence=0.9,
            )
            shot = normalize_shot(raw, index, source_ref, evidence_id, from_storyboard)
            if shot["route_path"] not in route_set and shot["route_path"] != NEED_HUMAN:
                blockers.append({
                    "blocker_id": "shot_route_not_in_pages",
                    "status": "blocked",
                    "review_status": NEED_HUMAN,
                    "reason": f"shot {shot_id} 的 route_path 不在 mobile/pages.json：{shot['route_path']}",
                    "unblock_action": "更新 storyboard shot-list，使 route_path 绑定真实 mobile/pages.json 页面。",
                    "evidence_refs": [evidence_id] + route_evidence_refs,
                })
            shots.append(shot)
        if shots:
            if args.shot_id and not any(item["shot_id"] == args.shot_id for item in shots):
                blockers.append({
                    "blocker_id": "shot_id_not_found",
                    "status": "blocked",
                    "review_status": NEED_HUMAN,
                    "reason": f"指定的 --shot-id 未在 shot-list 中找到：{args.shot_id}",
                    "unblock_action": "检查 screenshot-shot-list.json 中的 shot_id 后重跑。",
                    "evidence_refs": [],
                })
            return shots, blockers, route_evidence_refs
    if args.allow_current_screen:
        evidence_id = add_evidence(
            evidence,
            source_type="manual_capture_policy",
            source_ref="cli:--allow-current-screen",
            observed_key="shot_plan.current_screen",
            observed_value="manual current-screen capture allowed; route requires human confirmation",
            parser="cli",
            confidence=0.8,
        )
        return [{
            "shot_id": "current_screen",
            "route": NEED_HUMAN,
            "route_path": NEED_HUMAN,
            "route_params": {},
            "scenario": "manual_current_screen",
            "title": "manual current screen",
            "claim_ids": [],
            "fixture_source": [],
            "visible_evidence": [],
            "must_not_show": [],
            "source_ref": "cli:--allow-current-screen",
            "source_schema": "manual_current_screen",
            "planned_route_from_storyboard": False,
            "navigation_verified": False,
            "human_review_required": True,
            "evidence_refs": [evidence_id],
            "review_status": NEED_HUMAN,
        }], blockers, route_evidence_refs
    blockers.append({
        "blocker_id": "shot_plan_missing",
        "status": "blocked",
        "review_status": NEED_HUMAN,
        "reason": "未发现 storyboard handoff/shot-list，且未显式允许当前屏幕捕获。",
        "unblock_action": "先运行 screenshot-storyboard 生成 play-store-launch/reports/screenshot-shot-list.json，或显式传入 --shot-list。",
        "evidence_refs": storyboard_handoff.get("evidence_refs", []),
    })
    return [], blockers, route_evidence_refs


def parse_png(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    result: dict[str, Any] = {
        "path": as_posix(path),
        "sha256": sha256_bytes(data),
        "byte_count": len(data),
        "is_png": data.startswith(PNG_SIGNATURE),
        "width": 0,
        "height": 0,
        "bit_depth": None,
        "color_type": None,
        "has_alpha": None,
        "basic_dimensions_pass": False,
        "store_ready_candidate": False,
        "blank_analysis": {"status": "not_run"},
    }
    if not result["is_png"]:
        return result
    offset = len(PNG_SIGNATURE)
    idat = b""
    palette: list[tuple[int, int, int]] = []
    while offset + 8 <= len(data):
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_type = data[offset + 4:offset + 8]
        chunk_data = data[offset + 8:offset + 8 + length]
        offset += 12 + length
        if chunk_type == b"IHDR" and len(chunk_data) >= 13:
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
            result.update({"width": width, "height": height, "bit_depth": bit_depth, "color_type": color_type})
            result["has_alpha"] = color_type in {4, 6}
        elif chunk_type == b"PLTE":
            palette = [tuple(chunk_data[i:i + 3]) for i in range(0, len(chunk_data), 3) if len(chunk_data[i:i + 3]) == 3]
        elif chunk_type == b"IDAT":
            idat += chunk_data
        elif chunk_type == b"IEND":
            break
    width = int(result.get("width") or 0)
    height = int(result.get("height") or 0)
    if width and height:
        min_side = min(width, height)
        max_side = max(width, height)
        result["basic_dimensions_pass"] = min_side >= 320 and max_side <= 3840 and max_side / min_side <= 2
        result["store_ready_candidate"] = bool(result["basic_dimensions_pass"] and result.get("bit_depth") == 8 and result.get("color_type") == 2)
    result["blank_analysis"] = blank_analysis(width, height, result.get("bit_depth"), result.get("color_type"), idat, palette)
    return result


def blank_analysis(width: int, height: int, bit_depth: Any, color_type: Any, idat: bytes, palette: list[tuple[int, int, int]]) -> dict[str, Any]:
    if not width or not height or bit_depth != 8 or color_type not in {0, 2, 3, 4, 6} or not idat:
        return {"status": "unsupported", "likely_blank": NEED_HUMAN}
    bpp_map = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
    bpp = bpp_map[int(color_type)]
    stride = width * bpp
    try:
        raw = zlib.decompress(idat)
    except zlib.error as exc:
        return {"status": "decode_failed", "error": str(exc), "likely_blank": NEED_HUMAN}
    if len(raw) < (stride + 1) * height:
        return {"status": "truncated", "likely_blank": NEED_HUMAN}
    prev = bytearray(stride)
    sample_values: set[tuple[int, ...]] = set()
    sampled = 0
    pos = 0
    max_pixels = min(width * height, 12000)
    for _y in range(height):
        filter_type = raw[pos]
        pos += 1
        scan = bytearray(raw[pos:pos + stride])
        pos += stride
        for i in range(stride):
            left = scan[i - bpp] if i >= bpp else 0
            up = prev[i]
            up_left = prev[i - bpp] if i >= bpp else 0
            if filter_type == 1:
                scan[i] = (scan[i] + left) & 0xFF
            elif filter_type == 2:
                scan[i] = (scan[i] + up) & 0xFF
            elif filter_type == 3:
                scan[i] = (scan[i] + ((left + up) // 2)) & 0xFF
            elif filter_type == 4:
                scan[i] = (scan[i] + paeth(left, up, up_left)) & 0xFF
        prev = scan
        step = max(1, width // 80)
        for x in range(0, width, step):
            if sampled >= max_pixels:
                break
            start = x * bpp
            pixel = tuple(scan[start:start + bpp])
            if color_type == 3 and palette and pixel:
                index = pixel[0]
                if index < len(palette):
                    pixel = palette[index]
            elif color_type == 4:
                pixel = (pixel[0], pixel[0], pixel[1])
            elif color_type == 0:
                pixel = (pixel[0],)
            sample_values.add(pixel)
            sampled += 1
        if sampled >= max_pixels:
            break
    return {
        "status": "decoded_sample",
        "sampled_pixels": sampled,
        "distinct_sample_values": len(sample_values),
        "likely_blank": len(sample_values) <= 1,
    }


def paeth(left: int, up: int, up_left: int) -> int:
    p = left + up - up_left
    pa = abs(p - left)
    pb = abs(p - up)
    pc = abs(p - up_left)
    if pa <= pb and pa <= pc:
        return left
    if pb <= pc:
        return up
    return up_left


def safe_name(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip())
    return value.strip("-") or "shot"


def google_play_spec_check(analysis: dict[str, Any]) -> dict[str, Any]:
    failures: list[str] = []
    if not analysis.get("is_png"):
        failures.append("not_png")
    if not analysis.get("basic_dimensions_pass"):
        failures.append("dimension_or_ratio_failed")
    if analysis.get("has_alpha"):
        failures.append("png_has_alpha")
    if analysis.get("bit_depth") != 8:
        failures.append("png_not_8_bit_depth")
    if analysis.get("color_type") != 2:
        failures.append("png_not_24_bit_truecolor")
    if analysis.get("blank_analysis", {}).get("likely_blank") is True:
        failures.append("likely_blank")
    return {
        "official_source": GOOGLE_SPEC_URL,
        "basic_dimensions_pass": bool(analysis.get("basic_dimensions_pass")),
        "store_ready_candidate": not failures,
        "failures": failures,
        "review_status": NEED_HUMAN,
        "notes": [
            "Google Play 公开使用仍需人工审核内容、裁切、安全区、商标和是否误导。",
            "raw Android screencap 可能包含 alpha；含 alpha 时不能直接作为 24-bit PNG 上架素材。",
        ],
    }


def render_markdown(data: dict[str, Any]) -> str:
    device_rows = "\n".join(
        f"| `{item['serial']}` | `{item['state']}` | {item.get('model') or item.get('descriptors', {}).get('model', '')} | {item.get('wm_size', '')} |"
        for item in data["device_inventory"].get("devices", [])
    ) or "| 无 | 无 | 无 | 无 |"
    shot_rows = "\n".join(
        f"| `{shot['shot_id']}` | `{shot['route']}` | {shot.get('scenario', '')} | `{shot.get('review_status', NEED_HUMAN)}` |"
        for shot in data["shot_plan"]
    ) or "| 无 | 无 | 无 | 无 |"
    attempt_rows = "\n".join(
        f"| `{attempt['shot_id']}` | `{attempt['status']}` | {attempt['reason']} | {attempt.get('screenshot_path', '') or '无'} |"
        for attempt in data["capture_attempts"]
    ) or "| 无 | 无 | 无 | 无 |"
    screenshot_rows = "\n".join(
        f"| `{shot['shot_id']}` | `{shot['path']}` | {shot['width']}x{shot['height']} | `{shot['sha256']}` | `{shot['google_play_spec_check']['store_ready_candidate']}` | `{shot['review_status']}` |"
        for shot in data["screenshots"]
    ) or "| 无 | 无 | 无 | 无 | 无 | 无 |"
    blocker_rows = "\n".join(
        f"- `{item['blocker_id']}` / `{item['status']}` / `{item.get('review_status', NEED_HUMAN)}`：{item['reason']} 解除方式：{item['unblock_action']}"
        for item in data["blockers"]
    ) or "- 无阻塞项；仍需人工审核所有截图公开使用。"
    upstream = data.get("upstream_storyboard", {})
    upstream_blockers = "\n".join(
        f"- `{item.get('blocker_id')}` / `{item.get('status')}`：{item.get('reason')}"
        for item in upstream.get("blockers", [])
        if isinstance(item, dict)
    ) or "- 无上游 blocker；仍需 capture 与人工审核。"
    return f"""# screenshot-capture-agent 真实截图捕获报告

生成时间：`{data['generated_at']}`

## 总状态

- capture_status: `{data['capture_status']}`
- 非最终声明：本报告不是 Play Console 审核结论，不证明截图可直接提交。
- Google Play 截图规格来源：`{GOOGLE_SPEC_URL}`
- 公开使用状态：`NEED_HUMAN`

## 工具与目标 app

- adb: `{data['tooling'].get('adb_path') or 'missing'}`
- selected_serial: `{data['device_inventory'].get('selected_serial') or 'none'}`
- target_package: `{data['target_app'].get('selected_package') or 'none'}`
- foreground_package: `{data['target_app'].get('foreground', {}).get('package') or 'unknown'}`
- capture_build_type: `{data['target_app'].get('capture_build_type') or 'unknown'}`
- git_commit: `{data['project_fingerprint'].get('git_commit') or 'unknown'}`

## 上游 Storyboard

- upstream_status: `{upstream.get('status') or 'missing'}`
- handoff: `{upstream.get('path') or 'missing'}`
- shot_list: `{upstream.get('shot_list_path') or 'missing'}`
- navigation_verified: `{data.get('navigation', {}).get('navigation_verified')}`
- shot_id_filter: `{data.get('navigation', {}).get('shot_id_filter') or 'none'}`

上游 blocker 摘要：

{upstream_blockers}

## 设备清单

| Serial | State | Model | WM size |
| --- | --- | --- | --- |
{device_rows}

## Shot Plan

| Shot | Route | Scenario | 人工确认 |
| --- | --- | --- | --- |
{shot_rows}

## Capture Attempts

| Shot | 状态 | 原因 | 截图路径 |
| --- | --- | --- | --- |
{attempt_rows}

## Raw Screenshots

| Shot | Path | Size | SHA256 | Store-ready candidate | 人工确认 |
| --- | --- | --- | --- | --- | --- |
{screenshot_rows}

## 阻塞项

{blocker_rows}

## 证据索引

- evidence_count: `{len(data['evidence'])}`
- machine_json: `{data['output_paths']['machine_json']}`
- evidence_jsonl: `{data['output_paths']['evidence_jsonl']}`
- manifest_json: `{data['output_paths']['manifest_json']}`
"""


def write_evidence_jsonl(path: Path, evidence: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(item, ensure_ascii=False, sort_keys=True) for item in evidence]
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def build_human_gates(claims: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "gate_id": f"human.{claim['claim_id']}",
            "claim_id": claim["claim_id"],
            "reason": claim["question"],
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "evidence_refs": claim.get("evidence_refs", []),
        }
        for claim in claims
        if claim.get("human_review_required")
    ]


def capture_status(screenshots: list[dict[str, Any]], blockers: list[dict[str, Any]]) -> str:
    if not screenshots:
        return "blocked"
    hard_blockers = [item for item in blockers if item.get("blocker_id") not in {"google_play_public_use_needs_human"}]
    if hard_blockers:
        return "partial"
    return "captured"


def generate(root: Path, output_dir: Path, raw_dir: Path, args: argparse.Namespace) -> dict[str, Any]:
    evidence: list[dict[str, Any]] = []
    blockers: list[dict[str, Any]] = []
    claims: list[dict[str, Any]] = []
    screenshots: list[dict[str, Any]] = []
    attempts: list[dict[str, Any]] = []

    commit = git_commit(root)
    adb = find_adb(args.adb)
    tooling = {"adb_path": adb, "adb_available": bool(adb)}
    adb_ref = add_evidence(evidence, source_type="tooling", source_ref="adb", observed_key="adb.path", observed_value=adb or "missing", parser="which", confidence=1.0 if adb else 0.2)
    if not adb:
        blockers.append({"blocker_id": "adb_missing", "status": "blocked", "review_status": NEED_HUMAN, "reason": "未发现 adb。", "unblock_action": "安装 Android SDK platform-tools 或通过 --adb 指定 adb 路径。", "evidence_refs": [adb_ref]})

    devices: list[dict[str, Any]] = []
    selected_serial = ""
    if adb:
        devices_result = run_command([adb, "devices", "-l"], timeout=20)
        devices_ref = add_command_evidence(evidence, devices_result, "adb.devices", confidence=0.95)
        devices = parse_adb_devices(devices_result.get("stdout", ""))
        online = [item for item in devices if item["state"] == "device"]
        selected_serial = args.serial or (online[0]["serial"] if online else "")
        if not selected_serial:
            blockers.append({"blocker_id": "device_missing", "status": "blocked", "review_status": NEED_HUMAN, "reason": "adb 未发现在线 Android device/emulator。", "unblock_action": "启动模拟器或连接真实 Android 设备后重跑。", "evidence_refs": [devices_ref]})
        for item in devices:
            if item["state"] != "device":
                continue
            serial = item["serial"]
            model = run_command(adb_cmd(adb, serial, "shell", "getprop", "ro.product.model"), timeout=10)
            wm_size = run_command(adb_cmd(adb, serial, "shell", "wm", "size"), timeout=10)
            locale = run_command(adb_cmd(adb, serial, "shell", "getprop", "persist.sys.locale"), timeout=10)
            item["model"] = model["stdout"].strip()
            item["wm_size"] = wm_size["stdout"].strip()
            item["locale"] = locale["stdout"].strip()
    device_inventory = {"selected_serial": selected_serial, "devices": devices}

    package_candidates = discover_target_packages(root, args.package)
    package_refs = [
        add_evidence(evidence, source_type="repo_config", source_ref=item["source"], observed_key=f"package_candidate.{item['package']}", observed_value=item, parser="json_or_default", confidence=0.8)
        for item in package_candidates
    ]
    installed: list[dict[str, Any]] = []
    selected_package = ""
    selected_package_role = ""
    if adb and selected_serial:
        for item in package_candidates:
            package = item["package"]
            result = run_command(adb_cmd(adb, selected_serial, "shell", "pm", "path", package), timeout=15)
            ref = add_command_evidence(evidence, result, f"pm.path.{package}", confidence=0.9)
            if result["exit_code"] == 0 and result.get("stdout", "").strip().startswith("package:"):
                installed.append({**item, "pm_path": result["stdout"].strip(), "evidence_refs": [ref]})
                if not selected_package:
                    selected_package = package
                    selected_package_role = str(item.get("role") or "")
        if not selected_package:
            blockers.append({"blocker_id": "target_app_missing", "status": "blocked", "review_status": NEED_HUMAN, "reason": "未在设备上发现目标 app package 候选。", "unblock_action": "安装目标 app/debug build，或通过 --package 指定真实 package 后重跑。", "evidence_refs": package_refs})
    capture_build_type = "debug_container" if "hbuilderx" in selected_package_role else ("release_or_declared_package" if selected_package else "")
    if capture_build_type == "debug_container":
        blockers.append({
            "blocker_id": "debug_container_needs_human",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "当前目标 package 是 HBuilderX debug 容器，不能自动等同于最终 release app 体验。",
            "unblock_action": "人工确认 debug 容器画面可代表目标 app，或安装 release package 后重跑。",
            "evidence_refs": package_refs,
        })

    if args.launch and adb and selected_serial and selected_package:
        launch = run_command(adb_cmd(adb, selected_serial, "shell", "monkey", "-p", selected_package, "-c", "android.intent.category.LAUNCHER", "1"), timeout=20)
        add_command_evidence(evidence, launch, f"launch.{selected_package}", confidence=0.8)
        time.sleep(max(0, args.launch_wait_seconds))

    foreground = {"package": "", "activity": "", "raw_match": ""}
    foreground_refs: list[str] = []
    if adb and selected_serial:
        window = run_command(adb_cmd(adb, selected_serial, "shell", "dumpsys", "window"), timeout=20)
        activity = run_command(adb_cmd(adb, selected_serial, "shell", "dumpsys", "activity", "activities"), timeout=20)
        foreground_refs.append(add_command_evidence(evidence, window, "dumpsys.window", confidence=0.7))
        foreground_refs.append(add_command_evidence(evidence, activity, "dumpsys.activity.activities", confidence=0.7))
        foreground = parse_foreground_package(window.get("stdout", ""), activity.get("stdout", ""))
    foreground_matches = bool(selected_package and foreground.get("package") == selected_package)
    if selected_package and not foreground_matches:
        blockers.append({
            "blocker_id": "target_app_not_foreground",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": f"目标 package 未处于前台。foreground={foreground.get('package') or 'unknown'} target={selected_package}",
            "unblock_action": "手动打开目标 app/目标页面，或使用 --launch 后确认 app 能启动，再重跑。",
            "evidence_refs": foreground_refs,
        })

    storyboard_handoff = load_storyboard_handoff(root, args.storyboard_handoff, evidence)
    shot_plan, shot_blockers, route_evidence_refs = load_shot_plan(root, args, storyboard_handoff, evidence)
    blockers.extend(shot_blockers)
    for shot in shot_plan:
        shot["navigation_verified"] = bool(args.navigation_verified)
    navigation_ref = ""
    if args.navigation_verified:
        navigation_ref = add_evidence(
            evidence,
            source_type="manual_navigation",
            source_ref="cli:--navigation-verified",
            observed_key="navigation.verified",
            observed_value={"shot_id": args.shot_id or "all_loaded_shots", "note": "caller asserted device is on the planned route before capture"},
            parser="cli",
            confidence=0.7,
        )
    multi_shot_safe = len(shot_plan) <= 1 or bool(args.shot_id) or bool(args.navigation_verified) or bool(args.allow_multi_shot_current_screen)
    if shot_plan and not multi_shot_safe:
        blockers.append({
            "blocker_id": "multi_shot_navigation_unverified",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "上游 shot-list 包含多个 shot，但未指定 --shot-id 或 --navigation-verified；不能把当前屏幕重复写成多个 route 的截图证据。",
            "unblock_action": "每次使用 --shot-id 捕获一个 shot，或在自动/人工导航完成后显式传入 --navigation-verified。",
            "evidence_refs": [ref for shot in shot_plan for ref in shot.get("evidence_refs", [])][:20],
        })
    route_confirmed = bool(args.navigation_verified)
    effective_locale = args.locale or next((str(shot.get("locale")) for shot in shot_plan if shot.get("locale")), "") or "en-US"

    can_attempt_capture = bool(adb and selected_serial and selected_package and foreground_matches and shot_plan and multi_shot_safe)
    if can_attempt_capture:
        raw_dir.mkdir(parents=True, exist_ok=True)
        for shot in shot_plan:
            shot_id = safe_name(shot["shot_id"])
            route_name = safe_name(shot.get("route_path") or shot.get("route", "route"))
            output_path = raw_dir / f"{shot_id}-{route_name}-{selected_serial}-{int(time.time())}.png"
            result = run_binary(adb_cmd(adb, selected_serial, "exec-out", "screencap", "-p"), timeout=args.capture_timeout_seconds)
            command_ref = add_evidence(
                evidence,
                source_type="command",
                source_ref=result["command"],
                observed_key=f"screencap.{shot_id}",
                observed_value={"exit_code": result["exit_code"], "byte_count": result["byte_count"], "stderr": excerpt(result.get("stderr", ""), 500), "timed_out": result.get("timed_out", False)},
                parser="subprocess_binary",
                confidence=0.95,
            )
            if result["exit_code"] != 0 or not result["stdout_bytes"].startswith(PNG_SIGNATURE):
                attempts.append({"shot_id": shot["shot_id"], "status": "blocked", "reason": "adb screencap failed or did not return PNG", "evidence_refs": [command_ref]})
                blockers.append({"blocker_id": "capture_failed", "status": "blocked", "review_status": NEED_HUMAN, "reason": "截图命令失败或未返回 PNG。", "unblock_action": "确认设备未锁屏、app 在前台，并重跑截图捕获。", "evidence_refs": [command_ref]})
                continue
            output_path.write_bytes(result["stdout_bytes"])
            analysis = parse_png(output_path)
            png_ref = add_evidence(
                evidence,
                source_type="png_analysis",
                source_ref=as_posix(output_path),
                observed_key=f"png.{shot_id}",
                observed_value={key: analysis.get(key) for key in ("sha256", "byte_count", "width", "height", "bit_depth", "color_type", "has_alpha", "basic_dimensions_pass", "store_ready_candidate", "blank_analysis")},
                parser="png_parser",
                confidence=0.95,
            )
            spec = google_play_spec_check(analysis)
            screenshot = {
                "shot_id": shot["shot_id"],
                "path": as_posix(output_path),
                "route": shot.get("route", NEED_HUMAN),
                "route_path": shot.get("route_path", shot.get("route", NEED_HUMAN)),
                "route_params": shot.get("route_params", {}),
                "planned_route_from_storyboard": bool(shot.get("planned_route_from_storyboard")),
                "navigation_verified": route_confirmed,
                "route_verified": route_confirmed,
                "claim_ids": shot.get("claim_ids", []),
                "fixture_source": shot.get("fixture_source", []),
                "visible_evidence": shot.get("visible_evidence", []),
                "must_not_show": shot.get("must_not_show", []),
                "shot_source_ref": shot.get("source_ref", ""),
                "device": selected_serial,
                "locale": effective_locale,
                "commit": commit,
                "package": selected_package,
                "capture_build_type": capture_build_type,
                "foreground": foreground,
                "sha256": analysis["sha256"],
                "byte_count": analysis["byte_count"],
                "width": analysis["width"],
                "height": analysis["height"],
                "png_analysis": analysis,
                "google_play_spec_check": spec,
                "review_status": NEED_HUMAN,
                "human_review_required": True,
                "evidence_refs": [command_ref, png_ref] + shot.get("evidence_refs", []) + foreground_refs + ([navigation_ref] if navigation_ref else []),
            }
            screenshots.append(screenshot)
            attempts.append({"shot_id": shot["shot_id"], "status": "captured", "reason": "真实 adb screencap 写入 raw PNG；公开使用仍需人工审核。", "screenshot_path": as_posix(output_path), "evidence_refs": screenshot["evidence_refs"]})
            if not route_confirmed:
                blockers.append({"blocker_id": "route_not_verified", "status": "needs_human", "review_status": NEED_HUMAN, "reason": "截图 route 仅来自上游规划，设备当前页面未由导航证据证明。", "unblock_action": "人工确认当前截图对应 route/scenario，或在完成导航证明后用 --navigation-verified 重跑。", "evidence_refs": screenshot["evidence_refs"]})
            if spec["failures"]:
                blockers.append({"blocker_id": "google_play_spec_needs_work", "status": "needs_human", "review_status": NEED_HUMAN, "reason": f"PNG 基础规格存在风险：{', '.join(spec['failures'])}", "unblock_action": "按 Google Play 截图规格转换/裁切并人工审核。", "evidence_refs": screenshot["evidence_refs"]})
    hashes: dict[str, list[str]] = {}
    for screenshot in screenshots:
        hashes.setdefault(str(screenshot.get("sha256")), []).append(str(screenshot.get("shot_id")))
    for digest, shot_ids in hashes.items():
        if digest and len(set(shot_ids)) > 1:
            blockers.append({
                "blocker_id": "duplicate_screenshot_hash",
                "status": "blocked",
                "review_status": NEED_HUMAN,
                "reason": f"多个 shot 得到相同 raw screenshot hash，不能证明它们是不同页面：{', '.join(shot_ids)}",
                "unblock_action": "逐个导航并使用 --shot-id 捕获，确认每个 shot 来自对应页面。",
                "evidence_refs": [ref for shot in screenshots for ref in shot.get("evidence_refs", []) if shot.get("shot_id") in shot_ids][:20],
            })

    blockers.append({
        "blocker_id": "google_play_public_use_needs_human",
        "status": "needs_human",
        "review_status": NEED_HUMAN,
        "reason": "截图公开上架使用必须人工审核内容、裁切、安全区、商标和是否误导。",
        "unblock_action": "由 owner/design/legal 审核 raw 截图和最终商店图。",
        "evidence_refs": [ref for shot in screenshots for ref in shot.get("evidence_refs", [])][:20],
    })

    status = capture_status(screenshots, blockers)
    screenshot_refs = [ref for shot in screenshots for ref in shot.get("evidence_refs", [])]
    scan_refs = [adb_ref] + package_refs + foreground_refs
    add_claim(claims, claim_id="screenshot.environment", question="是否发现 adb 和 Android device/emulator", status="observed_in_repo" if adb and selected_serial else "blocked", claim_class="C0", evidence_refs=scan_refs or [adb_ref], value={"adb": adb, "selected_serial": selected_serial}, confidence=0.9 if adb and selected_serial else 0.3, human_review_required=False)
    add_claim(claims, claim_id="screenshot.upstream_storyboard", question="是否消费上游 storyboard handoff/shot-list", status="observed_in_repo" if storyboard_handoff.get("status") == "observed_in_repo" and shot_plan else "blocked", claim_class="C1" if storyboard_handoff.get("status") == "observed_in_repo" and shot_plan else "C5", evidence_refs=storyboard_handoff.get("evidence_refs", []) or route_evidence_refs or [adb_ref], value={"handoff": storyboard_handoff, "shot_count": len(shot_plan)}, confidence=0.9 if shot_plan else 0.2)
    add_claim(claims, claim_id="screenshot.target_app", question="是否发现并确认目标 app 前台运行", status="observed_in_repo" if foreground_matches else "blocked", claim_class="C2" if foreground_matches else "C5", evidence_refs=scan_refs or [adb_ref], value={"selected_package": selected_package, "foreground": foreground}, confidence=0.8 if foreground_matches else 0.3)
    add_claim(claims, claim_id="screenshot.route_navigation", question="截图 route 是否由设备导航证据证明", status="observed_in_repo" if route_confirmed else "needs_human", claim_class="C2" if route_confirmed else "C5", evidence_refs=([navigation_ref] if navigation_ref else route_evidence_refs or [adb_ref]), value={"navigation_verified": route_confirmed, "planned_routes": [shot.get("route_path") for shot in shot_plan]}, confidence=0.8 if route_confirmed else 0.3)
    add_claim(claims, claim_id="screenshot.raw_capture", question="是否真实捕获 raw PNG", status="observed_in_repo" if screenshots else "blocked", claim_class="C1" if screenshots else "C5", evidence_refs=screenshot_refs or scan_refs or [adb_ref], value={"screenshot_count": len(screenshots)}, confidence=0.95 if screenshots else 0.2)
    add_claim(claims, claim_id="screenshot.google_play_specs", question="截图是否满足 Google Play 基础规格候选", status="needs_human" if screenshots else "blocked", claim_class="C4", evidence_refs=screenshot_refs or scan_refs or [adb_ref], value={"checks": [shot["google_play_spec_check"] for shot in screenshots]}, confidence=0.7 if screenshots else 0.2)
    add_claim(claims, claim_id="screenshot.public_use", question="截图是否可公开用于商店", status="needs_human", claim_class="C3", evidence_refs=screenshot_refs or scan_refs or [adb_ref], value="所有公开使用必须人工审核。", confidence=0.2)

    human_gates = build_human_gates(claims)
    machine_path = output_dir / "screenshot-capture-agent-output.json"
    human_path = output_dir / "screenshot-capture-agent.zh.md"
    evidence_path = output_dir / "screenshot-capture-agent-evidence.jsonl"
    manifest_path = output_dir / "screenshot-capture-manifest.json"
    data = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "capture_status": status,
        "root": str(root),
        "project_fingerprint": {"git_commit": commit, "skill_path": as_posix(SKILL_DIR / "SKILL.md"), "skill_scanner": as_posix(Path(__file__).resolve())},
        "tooling": tooling,
        "device_inventory": device_inventory,
        "target_app": {"package_candidates": package_candidates, "installed_candidates": installed, "selected_package": selected_package, "selected_package_role": selected_package_role, "capture_build_type": capture_build_type, "foreground": foreground, "foreground_matches_target": foreground_matches},
        "upstream_storyboard": storyboard_handoff,
        "navigation": {"navigation_verified": route_confirmed, "shot_id_filter": args.shot_id or "", "allow_multi_shot_current_screen": bool(args.allow_multi_shot_current_screen)},
        "shot_plan": shot_plan,
        "capture_attempts": attempts,
        "screenshots": screenshots,
        "google_play_spec_checks": [shot["google_play_spec_check"] for shot in screenshots],
        "claims": claims,
        "evidence": evidence,
        "human_review_gates": human_gates,
        "blockers": blockers,
        "limitations": [
            "静态和 adb 证据不能证明截图内容适合公开上架。",
            "上游 storyboard 只证明规划 route；设备当前 route 仍需自动导航或人工证明。",
            "raw PNG 可能需要转换为 24-bit PNG 或 JPEG 后才能作为 Play Store 素材。",
        ],
        "output_paths": {"machine_json": as_posix(machine_path), "human_markdown": as_posix(human_path), "evidence_jsonl": as_posix(evidence_path), "manifest_json": as_posix(manifest_path), "raw_dir": as_posix(raw_dir)},
    }
    manifest = {"schema_version": "screenshot_capture_manifest.v1", "generated_at": data["generated_at"], "capture_status": status, "screenshots": screenshots, "blockers": blockers, "review_status": NEED_HUMAN}
    write_json(machine_path, data)
    write_json(manifest_path, manifest)
    write_text(human_path, render_markdown(data))
    write_evidence_jsonl(evidence_path, evidence)
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="真实尝试 Android 截图捕获并生成证据报告。")
    parser.add_argument("--root", default=".", help="目标 app 项目根目录")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="报告输出目录")
    parser.add_argument("--raw-dir", default=DEFAULT_RAW_DIR, help="raw PNG 输出目录")
    parser.add_argument("--adb", default="", help="adb 路径")
    parser.add_argument("--serial", default="", help="Android device/emulator serial")
    parser.add_argument("--package", default="", help="目标 Android package")
    parser.add_argument("--storyboard-handoff", default="", help="可选 storyboard handoff JSON；默认读取 play-store-launch/reports/screenshot-capture-handoff.json")
    parser.add_argument("--shot-list", default="", help="可选 shot-list JSON；默认读取 storyboard handoff 指向的 shot-list")
    parser.add_argument("--shot-id", default="", help="只捕获指定 shot_id；推荐一次捕获一个 storyboard shot")
    parser.add_argument("--locale", default="", help="截图 locale 标签；为空时优先使用 shot-list 中的 locale，再回退 en-US")
    parser.add_argument("--allow-current-screen", action="store_true", help="允许捕获当前前台目标 app 屏幕；route 仍需人工确认")
    parser.add_argument("--navigation-verified", action="store_true", help="显式声明设备当前已导航到 shot-list 对应 route；否则 route_verified=false")
    parser.add_argument("--allow-multi-shot-current-screen", action="store_true", help="允许一次对多个 shot 捕获当前屏幕；默认禁止以避免重复截图误绑定")
    parser.add_argument("--launch", action="store_true", help="尝试用 monkey 启动目标 package")
    parser.add_argument("--launch-wait-seconds", type=float, default=3.0, help="启动后等待秒数")
    parser.add_argument("--capture-timeout-seconds", type=int, default=30, help="screencap 超时秒数")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = root / output_dir
    raw_dir = Path(args.raw_dir)
    if not raw_dir.is_absolute():
        raw_dir = root / raw_dir
    data = generate(root, output_dir.resolve(), raw_dir.resolve(), args)
    print(f"capture_status={data['capture_status']}")
    print(f"device_count={len(data['device_inventory'].get('devices', []))}")
    print(f"screenshot_count={len(data['screenshots'])}")
    print(f"blockers={len(data['blockers'])}")
    print(f"human_report={data['output_paths']['human_markdown']}")
    print(f"machine_report={data['output_paths']['machine_json']}")
    print(f"evidence_jsonl={data['output_paths']['evidence_jsonl']}")
    print(f"manifest_json={data['output_paths']['manifest_json']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
