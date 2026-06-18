#!/usr/bin/env python3
"""Assemble a Google Play launch package from existing agent reports."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REQUIRED_AGENTS = [
    {
        "agent_id": "release-build-agent",
        "title": "工程发布门禁",
        "purpose": "证明 build、typecheck、smoke、preflight 等发布前工程门禁。",
        "output": "release-build-agent-output.json",
        "human_report": "release-build-agent.zh.md",
        "owner": "工程",
        "hard_gate": True,
    },
    {
        "agent_id": "privacy-disclosure-prep",
        "title": "隐私披露准备",
        "purpose": "整理 SDK、权限、数据流、隐私政策和账号删除等披露证据。",
        "output": "privacy-disclosure-prep-output.json",
        "human_report": "privacy-disclosure-prep.zh.md",
        "owner": "隐私/法务/产品",
        "hard_gate": True,
    },
    {
        "agent_id": "launch-info-collector",
        "title": "上架基础信息",
        "purpose": "收集 App 名称、定位、目标用户、平台、订阅、支持方式和 demo 数据。",
        "output": "launch-info-collector-output.json",
        "human_report": "launch-info-collector.zh.md",
        "owner": "产品/运营",
        "hard_gate": False,
    },
    {
        "agent_id": "google-data-safety-agent",
        "title": "Google Play Data safety",
        "purpose": "准备 Data safety 草稿、数据类型矩阵和证据绑定阻塞项。",
        "output": "google-data-safety-agent-output.json",
        "human_report": "google-data-safety-agent.zh.md",
        "owner": "隐私/法务/产品",
        "hard_gate": True,
    },
    {
        "agent_id": "google-play-listing",
        "title": "Google Play 主商店 listing",
        "purpose": "准备 title、short description、full description、app icon、feature graphic 和截图素材检查。",
        "output": "google-play-listing-output.json",
        "human_report": "google-play-listing.zh.md",
        "owner": "产品/运营/设计",
        "hard_gate": True,
    },
    {
        "agent_id": "screenshot-storyboard",
        "title": "截图 storyboard",
        "purpose": "把每张截图绑定到真实 screen、route、scenario、claim 和 capture handoff。",
        "output": "screenshot-storyboard-output.json",
        "human_report": "screenshot-storyboard.zh.md",
        "owner": "产品/设计",
        "hard_gate": False,
    },
    {
        "agent_id": "screenshot-capture-agent",
        "title": "真实截图捕获",
        "purpose": "从真实 Android 设备或模拟器捕获 raw screenshots 并记录设备、locale、route 证据。",
        "output": "screenshot-capture-agent-output.json",
        "human_report": "screenshot-capture-agent.zh.md",
        "owner": "工程/设计",
        "hard_gate": True,
    },
]


PASS_STATUSES = {"pass", "passed", "ok", "success", "succeeded", "green", "ready", "complete", "completed"}
YELLOW_STATUSES = {"needs_human", "need_human", "human_review_required", "draft", "partial", "warning", "yellow"}
RED_STATUSES = {"blocked", "fail", "failed", "error", "missing", "invalid", "script_missing", "red"}


@dataclass
class FileRecord:
    source_agent: str
    role: str
    path: str
    exists: bool
    size_bytes: int | None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except FileNotFoundError:
        return None, "missing"
    except json.JSONDecodeError as exc:
        return None, f"invalid_json: {exc}"
    except OSError as exc:
        return None, f"read_error: {exc}"


def rel_path(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def normalize_path(value: str, root: Path) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return root / path


def flatten_file_values(value: Any) -> list[tuple[str, str]]:
    items: list[tuple[str, str]] = []
    if isinstance(value, dict):
        for key, sub_value in value.items():
            for role, path in flatten_file_values(sub_value):
                items.append((str(key) if role == "file" else f"{key}.{role}", path))
    elif isinstance(value, list):
        for index, sub_value in enumerate(value):
            for role, path in flatten_file_values(sub_value):
                items.append((f"{index}.{role}", path))
    elif isinstance(value, str) and value.strip():
        items.append(("file", value.strip()))
    return items


def status_from_data(data: dict[str, Any] | None, error: str | None, blockers: list[dict[str, Any]]) -> str:
    if error:
        return "missing" if error == "missing" else "invalid"
    if not data:
        return "missing"
    for key in ("overall_status", "status", "capture_status", "storyboard_status", "readiness"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip().lower()
    if blockers:
        return "blocked"
    return "unknown"


def dict_text(item: dict[str, Any], keys: tuple[str, ...], default: str = "") -> str:
    for key in keys:
        value = item.get(key)
        if value is None:
            continue
        if isinstance(value, str):
            if value.strip():
                return value.strip()
        else:
            return json.dumps(value, ensure_ascii=False)
    return default


def blocker_from_dict(agent: dict[str, Any], item: dict[str, Any], source: str) -> dict[str, Any]:
    label = dict_text(item, ("label", "title", "field", "field_id", "blocker_id", "gate_id", "id", "claim_id"), source)
    status = dict_text(item, ("status", "review_status"), "needs_human").lower()
    reason = dict_text(item, ("reason", "message", "description"), "上游报告要求人工处理，但未提供更具体原因。")
    action = dict_text(item, ("unblock_action", "action", "required_action", "required_input"), "")
    if not action:
        action = f"处理 {agent['title']} 中的 {label}，然后重新运行对应上游 agent。"
    return {
        "agent_id": agent["agent_id"],
        "agent_title": agent["title"],
        "owner": agent["owner"],
        "source": source,
        "id": label,
        "status": status,
        "reason": reason,
        "unblock_action": action,
    }


def dedupe_blockers(blockers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str, str, str]] = set()
    result: list[dict[str, Any]] = []
    for blocker in blockers:
        key = (
            blocker.get("agent_id", ""),
            blocker.get("id", ""),
            blocker.get("reason", ""),
            blocker.get("unblock_action", ""),
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(blocker)
    return result


def collect_blockers(agent: dict[str, Any], data: dict[str, Any] | None, error: str | None) -> list[dict[str, Any]]:
    if error:
        reason = "缺少上游机器输出。" if error == "missing" else f"上游机器输出无法解析：{error}"
        return [
            {
                "agent_id": agent["agent_id"],
                "agent_title": agent["title"],
                "owner": agent["owner"],
                "source": "required_output",
                "id": agent["output"],
                "status": "missing" if error == "missing" else "invalid",
                "reason": reason,
                "unblock_action": f"先运行 {agent['agent_id']} 并生成 {agent['output']}。",
            }
        ]

    blockers: list[dict[str, Any]] = []
    if not data:
        return blockers

    for key in ("blockers", "gate_blockers"):
        value = data.get(key)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    blockers.append(blocker_from_dict(agent, item, key))
                elif isinstance(item, str) and item.strip():
                    blockers.append(
                        {
                            "agent_id": agent["agent_id"],
                            "agent_title": agent["title"],
                            "owner": agent["owner"],
                            "source": key,
                            "id": item.strip()[:80],
                            "status": "blocked",
                            "reason": item.strip(),
                            "unblock_action": f"处理 {agent['title']} 报告中的该阻塞项后重跑对应 agent。",
                        }
                    )

    human_fields = data.get("human_required_fields")
    if isinstance(human_fields, dict):
        for field, item in human_fields.items():
            if not isinstance(item, dict):
                continue
            status = str(item.get("status") or item.get("review_status") or "").lower()
            needs_human = item.get("human_review_required") is True or status in {"missing", "needs_human", "blocked"}
            if needs_human:
                reason = dict_text(item, ("reason",), f"字段 {field} 需要人工补充。")
                blockers.append(
                    {
                        "agent_id": agent["agent_id"],
                        "agent_title": agent["title"],
                        "owner": agent["owner"],
                        "source": "human_required_fields",
                        "id": str(field),
                        "status": status or "needs_human",
                        "reason": reason,
                        "unblock_action": f"补充并确认 {field}。",
                    }
                )

    return dedupe_blockers(blockers)


def collect_files(agent: dict[str, Any], data: dict[str, Any] | None, root: Path, reports_dir: Path) -> list[FileRecord]:
    candidates: list[tuple[str, str]] = [
        ("machine_report", str(reports_dir / agent["output"])),
        ("human_report", str(reports_dir / agent["human_report"])),
    ]
    if data:
        for key in ("generated_files", "output_paths"):
            for role, path in flatten_file_values(data.get(key)):
                candidates.append((role, path))

    seen: set[str] = set()
    records: list[FileRecord] = []
    for role, path_value in candidates:
        path = normalize_path(path_value, root)
        display = rel_path(path, root)
        if display in seen:
            continue
        seen.add(display)
        exists = path.exists()
        records.append(
            FileRecord(
                source_agent=agent["agent_id"],
                role=role,
                path=display,
                exists=exists,
                size_bytes=path.stat().st_size if exists and path.is_file() else None,
            )
        )
    return records


def agent_entry(agent: dict[str, Any], root: Path, reports_dir: Path) -> dict[str, Any]:
    path = reports_dir / agent["output"]
    data, error = read_json(path)
    blockers = collect_blockers(agent, data, error)
    status = status_from_data(data, error, blockers)
    files = collect_files(agent, data, root, reports_dir)
    entry = {
        "agent_id": agent["agent_id"],
        "title": agent["title"],
        "purpose": agent["purpose"],
        "owner": agent["owner"],
        "required_output": rel_path(path, root),
        "status": status,
        "hard_gate": agent["hard_gate"],
        "blocker_count": len(blockers),
        "blockers": blockers,
        "generated_at": data.get("generated_at") if isinstance(data, dict) else None,
        "files": [record.__dict__ for record in files],
    }
    if agent["agent_id"] == "screenshot-capture-agent" and isinstance(data, dict):
        screenshots = data.get("screenshots")
        entry["capture_status"] = data.get("capture_status")
        entry["screenshot_count"] = len(screenshots) if isinstance(screenshots, list) else 0
        if isinstance(screenshots, list):
            entry["raw_screenshot_paths"] = [
                item.get("path")
                for item in screenshots
                if isinstance(item, dict) and isinstance(item.get("path"), str)
            ][:8]
    return entry


def dedupe_text(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def classify_package(materials: list[dict[str, Any]]) -> tuple[str, str, bool, list[str]]:
    reasons: list[str] = []
    any_red = False
    any_yellow = False

    for material in materials:
        status = str(material["status"]).lower()
        if material["blocker_count"] > 0:
            if material["hard_gate"]:
                any_red = True
            else:
                any_yellow = True
            preview = []
            for blocker in material["blockers"][:3]:
                preview.append(f"{blocker['id']}：{blocker['reason']}")
            suffix = "；".join(preview)
            if material["blocker_count"] > 3:
                suffix += f"；另有 {material['blocker_count'] - 3} 项"
            reasons.append(f"{material['title']} 未通过：{suffix}")
        elif status in RED_STATUSES:
            any_red = True
            reasons.append(f"{material['title']} 状态为 {material['status']}，但未提供具体阻塞原因。")
        elif status in YELLOW_STATUSES or status not in PASS_STATUSES:
            any_yellow = True
            reasons.append(f"{material['title']} 状态为 {material['status']}，仍需复核。")

        missing_files = [
            file for file in material["files"]
            if not file["exists"] and file["role"] in {"machine_report", "human_report"}
        ]
        if missing_files:
            any_red = True
            reasons.append(f"{material['title']} 缺少必需报告文件。")

    if any_red:
        return "blocked", "RED", False, dedupe_text(reasons)
    if any_yellow:
        return "needs_human", "YELLOW", False, dedupe_text(reasons)
    return "ready", "GREEN", True, []


def summarize_blockers(materials: list[dict[str, Any]]) -> list[dict[str, Any]]:
    blockers: list[dict[str, Any]] = []
    for material in materials:
        blockers.extend(material["blockers"])
    return dedupe_blockers(blockers)


def release_gate_currently_passed(materials: list[dict[str, Any]]) -> bool:
    for material in materials:
        if material["agent_id"] != "release-build-agent":
            continue
        return str(material["status"]).lower() in PASS_STATUSES and material["blocker_count"] == 0
    return False


def stale_release_gate_blocker(blocker: dict[str, Any]) -> bool:
    text = " ".join(
        str(blocker.get(key, ""))
        for key in ("agent_id", "id", "reason", "unblock_action", "source")
    ).lower()
    return "release_gate_not_passed" in text


def reconcile_stale_downstream_release_blockers(materials: list[dict[str, Any]]) -> None:
    if not release_gate_currently_passed(materials):
        return

    for material in materials:
        if material["agent_id"] not in {"screenshot-storyboard", "screenshot-capture-agent"}:
            continue

        retained: list[dict[str, Any]] = []
        stale: list[dict[str, Any]] = []
        for blocker in material["blockers"]:
            if stale_release_gate_blocker(blocker):
                stale.append({
                    **blocker,
                    "resolution": "latest_release_build_agent_passed",
                })
            else:
                retained.append(blocker)

        if not stale:
            continue

        material["blockers"] = retained
        material["blocker_count"] = len(retained)
        material.setdefault("resolved_stale_blockers", []).extend(stale)
        if not retained and str(material["status"]).lower() in RED_STATUSES:
            material["status"] = "needs_human"


def screenshot_capture_has_raw_evidence(materials: list[dict[str, Any]]) -> bool:
    for material in materials:
        if material["agent_id"] != "screenshot-capture-agent":
            continue
        status = str(material["status"]).lower()
        count = int(material.get("screenshot_count") or 0)
        return count > 0 and status not in {"blocked", "missing", "invalid", "error", "fail", "failed"}
    return False


def stale_raw_screenshot_blocker(blocker: dict[str, Any]) -> bool:
    if blocker.get("agent_id") != "screenshot-storyboard":
        return False
    text = " ".join(
        str(blocker.get(key, ""))
        for key in ("id", "reason", "unblock_action", "source")
    ).lower()
    return "raw_screenshots_not_captured" in text or "真实 raw screenshots" in text


def reconcile_stale_storyboard_capture_blockers(materials: list[dict[str, Any]]) -> None:
    if not screenshot_capture_has_raw_evidence(materials):
        return

    for material in materials:
        if material["agent_id"] != "screenshot-storyboard":
            continue

        retained: list[dict[str, Any]] = []
        stale: list[dict[str, Any]] = []
        for blocker in material["blockers"]:
            if stale_raw_screenshot_blocker(blocker):
                stale.append({
                    **blocker,
                    "resolution": "latest_screenshot_capture_has_raw_evidence",
                })
            else:
                retained.append(blocker)

        if not stale:
            continue

        material["blockers"] = retained
        material["blocker_count"] = len(retained)
        material.setdefault("resolved_stale_blockers", []).extend(stale)
        if not retained and str(material["status"]).lower() in RED_STATUSES:
            material["status"] = "needs_human"


ACTION_BLUEPRINTS = {
    "engineering_release_gate": {
        "priority": "P0",
        "owner": "工程",
        "title": "修复并证明工程发布门禁通过",
        "why": "没有真实通过 build、typecheck、smoke、preflight，就不能证明当前 app 可以作为发布候选。",
        "done_when": "release-build-agent 重新运行后，build/typecheck/smoke/preflight 均有真实命令证据且状态通过。",
        "next_step": "先查看 release-build-agent 报告里的 build/smoke 失败原因，补齐项目已有脚本体系中的 typecheck，再重跑 release-build-agent。",
    },
    "privacy_policy": {
        "priority": "P0",
        "owner": "产品/隐私/法务",
        "title": "提供公开隐私政策 URL 并确认覆盖当前数据行为",
        "why": "隐私政策 URL 同时阻塞隐私披露、Data safety 和 Google Play listing，是提交前的硬性材料。",
        "done_when": "提供可公开访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享、删除流程和儿童/敏感数据边界。",
        "next_step": "准备隐私政策页面；把公开 URL 填入 play-store-launch/inputs/privacy-data-safety-owner-input.json 和 google-play-listing.json；确认 URL 可访问后重跑 privacy-disclosure-prep、google-data-safety-agent 和 google-play-listing。",
    },
    "data_safety_answers": {
        "priority": "P0",
        "owner": "产品/隐私/法务",
        "title": "逐项确认 Google Play Data safety 答案",
        "why": "当前只能从证据推断数据类型候选，不能替 owner 回答是否收集、共享、关联身份或用于追踪。",
        "done_when": "每个数据类型都确认 collected/shared/purpose/identity/tracking/required，并确认传输加密、儿童/敏感数据风险。",
        "next_step": "填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中的隐私政策 URL、加密传输、删除请求、儿童/敏感数据和逐数据类型答案；确认后重跑 privacy-disclosure-prep 与 google-data-safety-agent。",
    },
    "store_listing_metadata": {
        "priority": "P0",
        "owner": "产品/运营",
        "title": "补齐 Google Play 主商店 listing 文案和分类信息",
        "why": "缺少可提交的 title、short description、full description、开发者联系信息、分类、内容分级和目标受众。",
        "done_when": "提供正式 listing metadata；title <= 30 字符，short description <= 80 字符，full description 可提交且没有误导、促销或过度格式化内容。",
        "next_step": "提供 listing JSON 或 fastlane metadata，并确认 category、content rating、target audience、developer contact。",
    },
    "store_assets": {
        "priority": "P0",
        "owner": "设计/产品/运营",
        "title": "补齐 Google Play preview assets",
        "why": "app icon、feature graphic 和 screenshots 是主商店 listing 的核心素材，当前缺失或没有合规证明。",
        "done_when": "app icon 为 512x512 32-bit PNG 且 <=1024KB；feature graphic、至少 2 张截图和可选 video 均有文件与规格证据。",
        "next_step": "准备 app icon、feature graphic；等真实截图捕获通过后再生成最终截图素材。",
    },
    "real_screenshot_capture": {
        "priority": "P0",
        "owner": "工程/设计",
        "title": "用真实 app UI 逐张捕获 raw screenshots",
        "why": "截图必须来自真实 app UI；当前目标 app 没有处于前台，且不能把同一屏幕重复当作多个 route 的截图证据。",
        "done_when": "每个 shot 都有真实设备/模拟器、route、locale、raw PNG 和导航证明；截图捕获报告不再 blocked。",
        "next_step": "安装或打开可代表最终体验的 app；按 screenshot-shot-list.json 逐张导航和捕获，确保每张截图都有对应 route 证明。",
    },
    "launch_info_truth": {
        "priority": "P1",
        "owner": "产品/运营",
        "title": "确认上架基础信息 source of truth",
        "why": "App 名称、定位、目标用户、账号系统和支持方式会影响 listing、Data safety、截图文案和审核材料。",
        "done_when": "最终 App 名称、备用名、定位、目标用户、账号/删除流程、support URL/email/FAQ 均有 owner 确认。",
        "next_step": "补齐 launch-info-collector 报告中缺失或冲突的信息，然后重跑 launch-info-collector。",
    },
    "screenshot_public_review": {
        "priority": "P1",
        "owner": "产品/设计/法务",
        "title": "完成截图公开使用审核",
        "why": "即使 raw screenshot 捕获成功，也需要确认标题、裁切、安全区、第三方内容、商标和宣传 claim 不误导。",
        "done_when": "所有最终商店截图均完成公开使用、内容授权、商标和 claim 审核。",
        "next_step": "在 raw screenshots 捕获通过后，基于真实截图完成设计稿并进行公开使用审核。",
    },
    "final_repackage": {
        "priority": "P2",
        "owner": "发布负责人",
        "title": "重跑所有受影响 agent 并重新生成上架总包",
        "why": "当前总包只是 blocked 状态快照；修复上游材料后必须重新生成，才能形成新的提交判断。",
        "done_when": "相关上游报告全部更新，本报告重新生成后 readiness 不再是 RED。",
        "next_step": "按 P0/P1 顺序处理后，重新运行 launch-package-agent。",
    },
}


ACTION_ORDER = [
    "engineering_release_gate",
    "privacy_policy",
    "data_safety_answers",
    "store_listing_metadata",
    "store_assets",
    "real_screenshot_capture",
    "launch_info_truth",
    "screenshot_public_review",
    "final_repackage",
]


LISTING_HUMAN_FIELD_LABELS = {
    "privacy_policy_url": "隐私政策 URL",
    "developer_contact_email": "开发者联系邮箱",
    "developer_contact": "开发者联系信息",
    "contact_email": "开发者联系邮箱",
    "category": "应用分类",
    "content_rating": "内容分级",
    "target_audience": "目标受众",
}


def action_category(blocker: dict[str, Any]) -> str:
    agent_id = str(blocker.get("agent_id", ""))
    text = " ".join(
        str(blocker.get(key, ""))
        for key in ("id", "reason", "unblock_action", "source")
    ).lower()

    if agent_id == "release-build-agent" or "release_gate_not_passed" in text:
        return "engineering_release_gate"
    if "privacy_policy" in text or "隐私政策" in text:
        return "privacy_policy"
    if agent_id == "google-data-safety-agent":
        return "data_safety_answers"
    if agent_id == "launch-info-collector":
        return "launch_info_truth"
    if agent_id == "google-play-listing":
        if any(token in text for token in ("preview_assets", "app icon", "feature graphic", "screenshots", "截图素材")):
            return "store_assets"
        return "store_listing_metadata"
    if agent_id in {"screenshot-storyboard", "screenshot-capture-agent"}:
        if any(token in text for token in ("public_use", "privacy_or_target_audience", "target audience", "商标", "误导", "公开上架", "公开使用", "目标受众", "隐私、data safety")):
            return "screenshot_public_review"
        return "real_screenshot_capture"
    return "final_repackage"


def engineering_release_next_step(related: list[dict[str, Any]], fallback: str) -> str:
    gate_ids: list[str] = []
    for blocker in related:
        blocker_id = str(blocker.get("id", ""))
        if blocker_id.startswith("gate:"):
            gate = blocker_id.split(":", 1)[1].strip()
            if gate and gate not in gate_ids:
                gate_ids.append(gate)

    if not gate_ids:
        return fallback

    gate_text = "、".join(gate_ids)
    if gate_ids == ["smoke"]:
        return "当前 build/typecheck/preflight 已通过；集中修复 release-build-agent 报告中的 smoke 阻塞，完成后重跑 release-build-agent 和 launch-package-agent。"
    return f"当前未通过的工程 gate 是 {gate_text}；按 release-build-agent 报告逐项修复这些 gate，完成后重跑 release-build-agent 和 launch-package-agent。"


def listing_human_field_labels(related: list[dict[str, Any]]) -> list[str]:
    labels: list[str] = []
    for blocker in related:
        if str(blocker.get("source", "")) != "human_required_fields":
            continue
        text = str(blocker.get("id", "")).lower()
        exact_label = LISTING_HUMAN_FIELD_LABELS.get(text)
        if exact_label:
            if exact_label not in labels:
                labels.append(exact_label)
            continue
        for token, label in LISTING_HUMAN_FIELD_LABELS.items():
            if token in text and label not in labels:
                labels.append(label)
                break

    if labels:
        return labels

    text = " ".join(
        str(blocker.get(key, ""))
        for blocker in related
        for key in ("id", "reason", "unblock_action", "source")
    ).lower()
    if "human_required_fields" in text:
        return ["开发者联系邮箱", "应用分类", "内容分级", "目标受众"]
    return []


def has_listing_text_or_source_blocker(related: list[dict[str, Any]]) -> bool:
    text = " ".join(
        str(blocker.get(key, ""))
        for blocker in related
        for key in ("id", "reason", "unblock_action", "source")
    ).lower()
    tokens = (
        "listing_metadata_source",
        "listing_text_fields",
        "app title",
        "short description",
        "full description",
        "title、short",
        "文案缺失",
        "字段存在",
    )
    return any(token in text for token in tokens)


def store_listing_metadata_overrides(related: list[dict[str, Any]]) -> dict[str, str] | None:
    if has_listing_text_or_source_blocker(related):
        return None

    labels = listing_human_field_labels(related)
    if not labels:
        return None

    field_text = "、".join(labels)
    return {
        "title": "确认 Google Play listing 人工必填信息",
        "why": (
            "当前 app title、short description、full description 已由 google-play-listing 检查通过；"
            f"剩余阻塞是 {field_text} 仍需 owner 确认，脚本不能替产品/运营/法务做最终提交判断。"
        ),
        "done_when": (
            f"{field_text} 已提供或确认，隐私政策 URL 按单独 P0 项处理；"
            "重跑 google-play-listing 后不再报告 human_required_fields 阻塞。"
        ),
        "next_step": (
            "在 play-store-launch/inputs/google-play-listing.json 或项目既有 fastlane/metadata 输入中"
            f"补齐/确认 {field_text}；如果字段值仍是 NEED_HUMAN，必须替换为真实可提交值或明确 owner 确认值。"
        ),
    }


def real_screenshot_capture_overrides(related: list[dict[str, Any]]) -> dict[str, str] | None:
    text = " ".join(
        str(blocker.get(key, ""))
        for blocker in related
        for key in ("id", "reason", "unblock_action", "source")
    ).lower()

    if "device_missing" in text:
        return {
            "title": "启动或连接 Android 设备后捕获 raw screenshots",
            "why": "screenshot-capture-agent 最新真实运行显示 adb 未发现在线 Android device/emulator；没有真实设备就无法证明截图来自真实 app UI。",
            "done_when": "adb 至少发现 1 台在线 Android 设备或模拟器，并且 screenshot-capture-agent 对指定 shot 生成 raw PNG、设备、package、locale 和截图规格证据。",
            "next_step": "启动 Android 模拟器或连接真机后，先运行 `adb devices -l` 确认在线；再运行 `python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-list play-store-launch/reports/screenshot-shot-list.json --shot-id shot_01_home_feed --launch`。如果已手动导航到目标页面，再加 `--navigation-verified`。",
        }

    if "target_app_not_foreground" in text:
        return {
            "title": "把目标 app 打到前台后捕获 raw screenshots",
            "why": "screenshot-capture-agent 发现设备在线，但前台应用不是目标 app；不能把 launcher、系统页或非目标 app 当成商店截图证据。",
            "done_when": "目标 package 位于前台，且每个 captured shot 都有 raw PNG、foreground package 和 route 导航证据。",
            "next_step": "启动目标 app 或使用 capture 脚本的 `--launch`；确认目标页面在前台后按 `--shot-id` 逐张捕获。",
        }

    if "multi_shot_navigation_unverified" in text:
        return {
            "title": "按 shot-id 逐张导航并捕获 raw screenshots",
            "why": "shot-list 包含多个 route；没有逐张导航证明时，不能把同一屏幕重复绑定成多张商店截图。",
            "done_when": "每个 shot 都单独运行 capture，或在人工/自动导航完成后显式提供 `--navigation-verified`。",
            "next_step": "按 `screenshot-shot-list.json` 中的 `shot_id` 逐张运行 screenshot-capture-agent；每张截图都确认 route 后再进入公开使用审核。",
        }

    if "debug_container_needs_human" in text or "google_play_spec_needs_work" in text:
        return {
            "title": "补齐 release app 与最终截图规格证据",
            "why": (
                "最新 screenshot-capture-agent 已从真实设备捕获到 raw PNG，但当前运行的是 HBuilderX debug 容器，"
                "且 raw Android screencap 还不是可直接提交的 24-bit 商店截图素材；其余 shot 也需要逐张补齐 route 证据。"
            ),
            "done_when": (
                "安装 release package 后重跑，或由 owner 明确确认 debug 容器画面可代表最终 app；"
                "shot-list 中每个必需 shot 都有 raw PNG、route、locale、device 和 commit 证据；最终截图完成规格转换和人工公开使用审核。"
            ),
            "next_step": (
                "优先安装 `com.daowei2026.magazinedigest` release 包后重跑 capture；如果暂时只能使用 HBuilderX debug 容器，"
                "需 owner 书面确认可代表最终体验。随后按 `screenshot-shot-list.json` 逐张捕获剩余 route，并把 raw PNG 转成符合 Google Play 要求的最终截图素材。"
            ),
        }

    return None


def build_owner_actions(blockers: list[dict[str, Any]], materials: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for blocker in blockers:
        grouped.setdefault(action_category(blocker), []).append(blocker)

    if any(material["status"] != "pass" or material["blocker_count"] > 0 for material in materials):
        grouped.setdefault("final_repackage", [])

    actions: list[dict[str, Any]] = []
    for action_id in ACTION_ORDER:
        if action_id not in grouped:
            continue
        blueprint = ACTION_BLUEPRINTS[action_id]
        related = grouped[action_id]
        next_step = blueprint["next_step"]
        title = blueprint["title"]
        why = blueprint["why"]
        done_when = blueprint["done_when"]
        if action_id == "engineering_release_gate":
            next_step = engineering_release_next_step(related, next_step)
        elif action_id == "store_listing_metadata":
            overrides = store_listing_metadata_overrides(related)
            if overrides:
                title = overrides["title"]
                why = overrides["why"]
                done_when = overrides["done_when"]
                next_step = overrides["next_step"]
        elif action_id == "real_screenshot_capture":
            overrides = real_screenshot_capture_overrides(related)
            if overrides:
                title = overrides["title"]
                why = overrides["why"]
                done_when = overrides["done_when"]
                next_step = overrides["next_step"]
        actions.append(
            {
                "id": action_id,
                "priority": blueprint["priority"],
                "owner": blueprint["owner"],
                "title": title,
                "why": why,
                "done_when": done_when,
                "next_step": next_step,
                "related_blocker_count": len(related),
                "related_blockers": related,
            }
        )
    return actions


def material_usability(material: dict[str, Any]) -> dict[str, Any]:
    title = material["title"]
    status = material["status"]
    blocked = material["blocker_count"] > 0 or status in RED_STATUSES

    by_agent = {
        "release-build-agent": (
            "可用于定位工程发布门禁失败原因。",
            "不能作为 build/typecheck/smoke/preflight 已通过的发布证明。",
        ),
        "privacy-disclosure-prep": (
            "可用于内部隐私复核和确认隐私政策缺口。",
            "不能作为最终隐私披露或 Data safety 答案。",
        ),
        "launch-info-collector": (
            "可用于整理产品上架信息候选项。",
            "不能作为 owner 已确认的唯一 source of truth。",
        ),
        "google-data-safety-agent": (
            "可用于 Data safety 草稿和逐项确认清单。",
            "不能直接提交到 Play Console Data safety 表单。",
        ),
        "google-play-listing": (
            "可用于 listing 缺口检查和文案草稿起点。",
            "不能作为最终 Play Store listing metadata。",
        ),
        "screenshot-storyboard": (
            "可用于截图规划、shot-list 和 capture handoff。",
            "不能证明真实截图已经捕获或素材可公开使用。",
        ),
        "screenshot-capture-agent": (
            "可用于定位截图捕获环境和设备阻塞。",
            "不能作为最终截图素材证据。",
        ),
    }
    can_use, cannot_use = by_agent.get(material["agent_id"], ("可用于内部复核。", "不能作为最终提交材料。"))
    if material["agent_id"] == "screenshot-capture-agent" and int(material.get("screenshot_count") or 0) > 0:
        count = int(material.get("screenshot_count") or 0)
        can_use = f"可用于证明已从真实设备捕获 {count} 张 raw screenshot，并追溯 package、route、locale、commit 和 PNG 规格。"
        cannot_use = "不能直接作为最终 Play Store 截图素材；仍需 release app/公开使用审核和 Google Play 规格转换。"
    if not blocked:
        can_use = f"{title} 当前未报告阻塞，可进入 owner 复核。"
        cannot_use = "仍需最终人工确认后再用于提交。"

    blockers = material.get("blockers", [])
    top_blockers = [
        {
            "id": human_issue_title(blocker),
            "reason": human_issue_reason(blocker),
            "unblock_action": blocker["unblock_action"],
        }
        for blocker in blockers[:3]
    ]
    return {
        "agent_id": material["agent_id"],
        "title": title,
        "status": status,
        "owner": material["owner"],
        "can_use_for": can_use,
        "cannot_use_for": cannot_use,
        "blocker_count": material["blocker_count"],
        "top_blockers": top_blockers,
    }


def human_issue_title(blocker: dict[str, Any]) -> str:
    raw = str(blocker.get("id", ""))
    text = " ".join(str(blocker.get(key, "")) for key in ("id", "reason", "unblock_action")).lower()
    mappings = [
        ("gate:build", "Build 未通过"),
        ("gate:typecheck", "Typecheck 门禁缺失"),
        ("gate:smoke", "Smoke 未通过"),
        ("privacy_policy_url", "隐私政策 URL 缺失"),
        ("隐私政策", "隐私政策 URL 缺失"),
        ("listing_metadata_source", "Listing metadata 来源缺失"),
        ("listing_text_fields", "Listing 文案缺失或不合规"),
        ("preview_assets", "Preview assets 缺失或不合规"),
        ("human_required_fields", "Listing 必填人工信息缺失"),
        ("developer_contact_email", "开发者联系邮箱缺失"),
        ("category", "应用分类缺失"),
        ("content_rating", "内容分级缺失"),
        ("target_audience", "目标受众缺失"),
        ("release_gate_not_passed", "工程门禁未通过"),
        ("raw_screenshots_not_captured", "真实截图未捕获"),
        ("privacy_or_target_audience", "隐私或目标受众未确认"),
        ("debug_container", "当前是 HBuilderX debug 容器"),
        ("target_app_not_foreground", "目标 app 未在前台"),
        ("multi_shot_navigation", "多张截图导航未证明"),
        ("google_play_public_use", "截图公开使用未审核"),
    ]
    for token, label in mappings:
        if token in text:
            return label
    return raw


def human_issue_reason(blocker: dict[str, Any]) -> str:
    text = " ".join(str(blocker.get(key, "")) for key in ("id", "reason", "unblock_action")).lower()
    mapping = [
        ("gate:build", "Build 没有证明可发布构建成功；需要查看工程门禁报告中的详细失败日志并修复。"),
        ("gate:typecheck", "项目当前没有可执行的 typecheck 门禁，不能证明类型检查通过。"),
        ("gate:smoke", "Smoke 流程没有真实通过，不能证明 app 的基础启动或核心路径可用。"),
        ("listing_metadata_source", "没有找到可提交的 Google Play listing metadata 来源。"),
        ("listing_text_fields", "listing 文案存在缺失、占位或长度不合规。"),
        ("preview_assets", "app icon、feature graphic 或 screenshots 缺失，或还没有规格证明。"),
        ("release_gate_not_passed", "工程发布门禁仍然阻塞，因此截图规划不能代表可提交素材。"),
        ("raw_screenshots_not_captured", "还没有从真实 app UI 捕获可追溯的 raw screenshots。"),
        ("target_app_not_foreground", "设备当前没有停留在目标 app，不能证明截图来自目标 app。"),
        ("multi_shot_navigation", "多个截图 shot 没有逐张导航和捕获证明。"),
        ("debug_container", "当前运行目标是调试容器，不能自动等同于最终 release app 体验。"),
    ]
    for token, reason in mapping:
        if token in text:
            return reason
    return str(blocker.get("reason", "需要查看上游报告确认原因。"))


def build_owner_summary(output: dict[str, Any]) -> dict[str, Any]:
    can_submit = output["can_submit_google_play"]
    actions = output["owner_actions"]
    p0_titles = [action["title"] for action in actions if action["priority"] == "P0"]
    release_passed = release_gate_currently_passed(output["materials"])
    if release_passed:
        recommended_order = [
            "工程发布门禁已通过；优先补齐隐私政策 URL 和 Data safety 人工答案，因为它们会影响 listing、目标受众和截图文案。",
            "确认产品上架 source of truth，再补齐 listing 文案、分类、开发者联系信息和 preview assets。",
            "基于当前可运行 app 重跑 screenshot-storyboard / screenshot-capture-agent，用真实 app UI 逐张捕获 raw screenshots。",
            "完成截图公开使用审核，确认标题、裁切、安全区、商标和 claim 不误导。",
            "重跑受影响的上游 agent，最后重新生成 launch-package-agent 总包。",
        ]
    else:
        recommended_order = [
            "先修复工程发布门禁，因为截图规划和真实截图都依赖可运行、可代表最终体验的 app。",
            "补齐隐私政策 URL 和 Data safety 人工答案，因为它们会影响 listing、目标受众和截图文案。",
            "确认产品上架 source of truth，再补齐 listing 文案、分类、开发者联系信息和 preview assets。",
            "用真实 app UI 逐张捕获 raw screenshots，完成公开使用审核。",
            "重跑受影响的上游 agent，最后重新生成 launch-package-agent 总包。",
        ]
    return {
        "decision": "可以进入最终提交复核" if can_submit else "当前不能提交 Google Play",
        "current_use": "内部复核、分工推进、缺口追踪" if not can_submit else "最终人工复核与提交准备",
        "not_safe_for": [] if can_submit else ["Play Console 最终提交", "对外公开素材发布", "声明 release ready"],
        "p0_count": len(p0_titles),
        "p0_titles": p0_titles,
        "recommended_order": recommended_order,
    }


def render_action_reason(action: dict[str, Any]) -> str:
    count = action.get("related_blocker_count", 0)
    suffix = f"（关联 {count} 个原始阻塞项）" if count else ""
    return f"{action['title']}：{action['why']}{suffix}"


def render_table_row(values: list[str]) -> str:
    return "| " + " | ".join(value.replace("\n", " ").strip() for value in values) + " |"


def short_files(files: list[dict[str, Any]]) -> str:
    existing = [file for file in files if file["exists"]]
    if not existing:
        return "无已存在文件"
    primary = []
    for file in existing:
        if file["role"] in {"human_report", "machine_report", "source_of_truth", "csv_draft", "shot_list", "manifest_json"}:
            primary.append(file["path"])
    if not primary:
        primary = [file["path"] for file in existing[:3]]
    if len(primary) > 3:
        return "<br>".join(primary[:3]) + "<br>..."
    return "<br>".join(primary)


def render_human_report(output: dict[str, Any]) -> str:
    lines: list[str] = []
    owner_summary = output["owner_summary"]
    lines.append("# Google Play 上架材料总包")
    lines.append("")
    lines.append(f"- 生成时间：{output['generated_at']}")
    lines.append(f"- 总状态：{output['overall_status']}")
    lines.append(f"- readiness：{output['readiness']}")
    lines.append(f"- 结论：{owner_summary['decision']}")
    lines.append("")
    lines.append("本报告面向 owner 复核：它只打包和解释已有上游材料，不提交 Play Console，也不把草稿或阻塞项包装成最终可提交材料。")
    lines.append("")

    lines.append("## 一页结论")
    lines.append("")
    lines.append(render_table_row(["问题", "结论"]))
    lines.append(render_table_row(["---", "---"]))
    lines.append(render_table_row(["现在能否提交 Google Play", "不能" if not output["can_submit_google_play"] else "可以进入最终人工复核"]))
    lines.append(render_table_row(["当前总包能用来做什么", owner_summary["current_use"]]))
    lines.append(render_table_row(["当前不能用来做什么", "、".join(owner_summary["not_safe_for"]) if owner_summary["not_safe_for"] else "未发现禁止用途"]))
    lines.append(render_table_row(["最高优先级阻塞", f"{owner_summary['p0_count']} 个 P0 行动项"]))
    lines.append(render_table_row(["完整文件清单", "`launch-package-manifest.json` 和 `launch-package-files-included.txt`"]))

    lines.append("")
    lines.append("## Owner 优先行动项")
    lines.append("")
    if output["owner_actions"]:
        lines.append(render_table_row(["优先级", "负责人", "行动项", "为什么重要", "完成标准", "下一步"]))
        lines.append(render_table_row(["---", "---", "---", "---", "---", "---"]))
        for action in output["owner_actions"]:
            lines.append(
                render_table_row(
                    [
                        action["priority"],
                        action["owner"],
                        action["title"],
                        action["why"],
                        action["done_when"],
                        action["next_step"],
                    ]
                )
            )
    else:
        lines.append("- 未发现需要 owner 处理的行动项。")

    lines.append("")
    lines.append("## 推荐处理顺序")
    lines.append("")
    for index, item in enumerate(owner_summary["recommended_order"], start=1):
        lines.append(f"{index}. {item}")

    lines.append("")
    lines.append("## 材料可用性看板")
    lines.append("")
    lines.append(render_table_row(["材料", "状态", "当前能用来做什么", "当前不能用来做什么", "主要阻塞"]))
    lines.append(render_table_row(["---", "---", "---", "---", "---"]))
    for item in output["material_usability"]:
        top = []
        for blocker in item["top_blockers"]:
            top.append(f"{blocker['id']}：{blocker['reason']}")
        if item["blocker_count"] > len(item["top_blockers"]):
            top.append(f"另有 {item['blocker_count'] - len(item['top_blockers'])} 项")
        lines.append(
            render_table_row(
                [
                    item["title"],
                    item["status"],
                    item["can_use_for"],
                    item["cannot_use_for"],
                    "<br>".join(top) if top else "未发现阻塞",
                ]
            )
        )

    lines.append("")
    lines.append("## 为什么现在不能提交")
    lines.append("")
    p0_actions = [action for action in output["owner_actions"] if action["priority"] == "P0"]
    if p0_actions:
        for action in p0_actions:
            lines.append(f"- {render_action_reason(action)}")
    elif output["readiness_reasons"]:
        for reason in output["readiness_reasons"]:
            lines.append(f"- {reason}")
    else:
        lines.append("- 未发现阻塞项；仍建议由 owner 做最终人工复核。")

    lines.append("")
    lines.append("## 文件索引")
    lines.append("")
    existing = [file for file in output["included_files"] if file["exists"]]
    missing = [file for file in output["included_files"] if not file["exists"]]
    lines.append(f"- 已纳入文件：{len(existing)} 个。完整列表见 `launch-package-files-included.txt`。")
    lines.append(f"- 缺失文件或目录：{len(missing)} 个。完整列表见 `launch-package-manifest.json`。")
    lines.append("- owner 主读报告只保留材料级索引，避免把文件流水账混入决策部分。")

    if missing:
        lines.append("")
        lines.append("### 关键缺失")
        lines.append("")
        for file in missing:
            lines.append(f"- `{file['path']}`：来自 {file['source_agent']} / {file['role']}")

    lines.append("")
    lines.append("## 已生成的关键包文件")
    lines.append("")
    for label, path in output["generated_files"].items():
        lines.append(f"- {label}: `{path}`")

    lines.append("")
    lines.append("## 原始明细在哪里")
    lines.append("")
    lines.append("- 合并后的人工处理清单见 `launch-package-need-human.md`。")
    lines.append("- 原始 blocker、材料矩阵和文件存在性见 `launch-package-agent-output.json`。")
    lines.append("- 完整纳入文件和缺失文件见 `launch-package-manifest.json`。")

    lines.append("")
    lines.append("## 最终总结")
    lines.append("")
    if output["can_submit_google_play"]:
        lines.append("所有必需上架材料均已存在且未发现阻塞项。该总包可以进入最终人工复核与 Play Console 提交流程。")
    else:
        p0_titles = [action["title"] for action in output["owner_actions"] if action["priority"] == "P0"]
        if p0_titles:
            lines.append(
                "当前总包是一个真实的 blocked 状态快照，适合 owner 做内部复核和分工推进；"
                "它还不是可提交 Play Console 的最终包。请按 P0 行动项处理："
                f"{'、'.join(p0_titles)}。处理后重跑受影响的上游 agent，最后重新生成本总包。"
            )
        else:
            lines.append(
                "当前总包仍需人工复核和重新打包；请按 Owner 优先行动项处理后，"
                "重跑受影响的上游 agent，最后重新生成本总包。"
            )
    lines.append("")
    return "\n".join(lines)


def render_need_human(output: dict[str, Any]) -> str:
    lines = [
        "# Google Play 上架材料人工处理清单",
        "",
        f"- 生成时间：{output['generated_at']}",
        f"- 总状态：{output['overall_status']}",
        "",
    ]
    if not output["owner_actions"]:
        lines.append("当前没有上游报告声明的人工处理项。")
        lines.append("")
        return "\n".join(lines)
    lines.append("## 合并行动项")
    lines.append("")
    lines.append(render_table_row(["优先级", "负责人", "行动项", "完成标准", "关联原始阻塞数"]))
    lines.append(render_table_row(["---", "---", "---", "---", "---"]))
    for action in output["owner_actions"]:
        lines.append(
            render_table_row(
                [
                    action["priority"],
                    action["owner"],
                    action["title"],
                    action["done_when"],
                    str(action["related_blocker_count"]),
                ]
            )
        )
    lines.append("")
    lines.append("## 原始阻塞项附录")
    lines.append("")
    if not output["consolidated_blockers"]:
        lines.append("- 无原始阻塞项。")
        lines.append("")
        return "\n".join(lines)
    lines.append(render_table_row(["归属", "来源材料", "处理项", "原因", "完成标准"]))
    lines.append(render_table_row(["---", "---", "---", "---", "---"]))
    for blocker in output["consolidated_blockers"]:
        lines.append(
            render_table_row(
                [
                    blocker["owner"],
                    blocker["agent_title"],
                    blocker["id"],
                    blocker["reason"],
                    blocker["unblock_action"],
                ]
            )
        )
    lines.append("")
    return "\n".join(lines)


def write_outputs(root: Path, output_dir: Path, output: dict[str, Any]) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    human_path = output_dir / "launch-package-agent.zh.md"
    machine_path = output_dir / "launch-package-agent-output.json"
    manifest_path = output_dir / "launch-package-manifest.json"
    need_human_path = output_dir / "launch-package-need-human.md"
    files_path = output_dir / "launch-package-files-included.txt"

    output["generated_files"] = {
        "human_report": rel_path(human_path, root),
        "machine_report": rel_path(machine_path, root),
        "manifest": rel_path(manifest_path, root),
        "need_human": rel_path(need_human_path, root),
        "files_included": rel_path(files_path, root),
    }

    human_path.write_text(render_human_report(output), encoding="utf-8")
    need_human_path.write_text(render_need_human(output), encoding="utf-8")
    files_path.write_text(
        "\n".join(file["path"] for file in output["included_files"] if file["exists"]) + "\n",
        encoding="utf-8",
    )
    manifest = {
        "schema_version": "launch_package_manifest.v1",
        "generated_at": output["generated_at"],
        "readiness": output["readiness"],
        "can_submit_google_play": output["can_submit_google_play"],
        "included_files": output["included_files"],
        "missing_files": [file for file in output["included_files"] if not file["exists"]],
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    machine_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output["generated_files"]


def assemble(root: Path, output_dir: Path) -> dict[str, Any]:
    reports_dir = output_dir if output_dir.is_absolute() else root / output_dir
    materials = [agent_entry(agent, root, reports_dir) for agent in REQUIRED_AGENTS]
    reconcile_stale_downstream_release_blockers(materials)
    reconcile_stale_storyboard_capture_blockers(materials)
    blockers = summarize_blockers(materials)
    overall_status, readiness, can_submit, readiness_reasons = classify_package(materials)
    owner_actions = build_owner_actions(blockers, materials)
    material_board = [material_usability(material) for material in materials]
    included_files = []
    seen_files: set[tuple[str, str, str]] = set()
    for material in materials:
        for file in material["files"]:
            key = (file["source_agent"], file["role"], file["path"])
            if key in seen_files:
                continue
            seen_files.add(key)
            included_files.append(file)

    output: dict[str, Any] = {
        "schema_version": "launch_package_agent_output.v1",
        "generated_at": utc_now(),
        "proof_mode": "upstream_report_packaging_only",
        "overall_status": overall_status,
        "readiness": readiness,
        "can_submit_google_play": can_submit,
        "output_dir": rel_path(reports_dir, root),
        "required_upstream_reports": [agent["output"] for agent in REQUIRED_AGENTS],
        "materials": materials,
        "material_usability": material_board,
        "owner_actions": owner_actions,
        "consolidated_blockers": blockers,
        "readiness_reasons": readiness_reasons,
        "included_files": included_files,
        "owner_summary": {},
        "generated_files": {},
    }
    output["owner_summary"] = build_owner_summary(output)
    write_outputs(root, reports_dir, output)
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Assemble Google Play launch package reports.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Directory containing and receiving reports")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = Path(args.output_dir)
    output = assemble(root, output_dir)
    generated = output["generated_files"]
    print(f"launch-package-agent: {output['overall_status']} / {output['readiness']}")
    print(f"can_submit_google_play: {str(output['can_submit_google_play']).lower()}")
    print(f"human_report: {generated['human_report']}")
    print(f"machine_report: {generated['machine_report']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
