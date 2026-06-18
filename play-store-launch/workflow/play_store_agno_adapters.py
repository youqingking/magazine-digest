#!/usr/bin/env python3
"""Local adapters for the Play Store Agno L3 workflow runner.

The adapters do not call Play Console, do not submit Google Play metadata,
and do not use credentials. They execute repo-local validators, bind each
agent output into L3 step provenance artifacts, and make launch-package-agent
write a run-scoped owner-facing Chinese readiness package.
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)


EXECUTION_MODE = "real_agno_orchestration"
AGNO_STATUS = "real_run"
STEP_SCHEMA = "play_store_agno_l3_step_artifact.v1"
DEPENDENCY_REF = "docs/agno/requirements-agno.txt"
RUNNER_REF = "scripts/agent_tools/run_play_store_agno_workflow.py"

LAUNCH_PACKAGE_OUTPUT_NAMES = (
    "PLAY_STORE_RELEASE_READINESS.zh-CN.md",
    "readiness-report.md",
    "manifest.json",
    "launch-package-agent-output.json",
    "NEED_HUMAN.md",
    "FILES_INCLUDED.txt",
)

AGENT_OUTPUT_REFS = {
    "release-build-agent": "docs/release/release-build-agent-output.json",
    "privacy-disclosure-prep": "docs/privacy/privacy-disclosure-prep-output.json",
    "google-play-listing": "docs/launch/google-play/google-play-listing-agent-output.json",
    "screenshot-storyboard": "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
    "launch-info-collector": "docs/launch/launch-info-collector-output.json",
    "google-data-safety-agent": "docs/launch/google-play/google-data-safety-agent-output.json",
    "screenshot-capture-agent": "docs/launch/screenshots/screenshot-capture-agent-output.json",
    "launch-package-agent": "artifacts/launch-package/launch-package-agent-output.json",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def launch_package_dir_ref(run_id: str) -> str:
    return f"artifacts/launch-package/{run_id}"


def launch_package_output_refs(run_id: str) -> list[str]:
    base = launch_package_dir_ref(run_id)
    return [f"{base}/{name}" for name in LAUNCH_PACKAGE_OUTPUT_NAMES]


@dataclass(frozen=True)
class AgentAdapterSpec:
    agent_id: str
    validator_script: str
    output_ref: str
    skill_ref: str
    l2_artifact_ref: str
    extra_input_refs: tuple[str, ...]

    @property
    def validator_command(self) -> str:
        return f"python {self.validator_script} ."


AGENT_SPECS: tuple[AgentAdapterSpec, ...] = (
    AgentAdapterSpec(
        agent_id="release-build-agent",
        validator_script="scripts/agent_tools/validate_release_build_agent.py",
        output_ref="docs/release/release-build-agent-output.json",
        skill_ref=".agents/skills/release-build-agent/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/release-build-agent.json",
        extra_input_refs=(
            "docs/release/PLAY_STORE_RELEASE_GATE.md",
            "docs/release/ANDROID_BUILD_READINESS.md",
            "docs/release/PLAY_STORE_TECHNICAL_BLOCKERS.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="privacy-disclosure-prep",
        validator_script="scripts/agent_tools/validate_privacy_disclosure_prep.py",
        output_ref="docs/privacy/privacy-disclosure-prep-output.json",
        skill_ref=".agents/skills/privacy-disclosure-prep/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/privacy-disclosure-prep.json",
        extra_input_refs=(
            "docs/privacy/DATA_INVENTORY.md",
            "docs/privacy/SDK_INVENTORY.md",
            "docs/launch/privacy/privacy-disclosure-draft.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="google-play-listing",
        validator_script="scripts/agent_tools/validate_google_play_listing.py",
        output_ref="docs/launch/google-play/google-play-listing-agent-output.json",
        skill_ref=".agents/skills/google-play-listing/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/google-play-listing.json",
        extra_input_refs=(
            "docs/launch/google-play/listing.en-US.json",
            "docs/launch/google-play/listing.zh-CN.json",
            "docs/launch/google-play/listing-validation-report.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="screenshot-storyboard",
        validator_script="scripts/agent_tools/validate_screenshot_storyboard.py",
        output_ref="docs/launch/screenshots/screenshot-storyboard-agent-output.json",
        skill_ref=".agents/skills/screenshot-storyboard/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/screenshot-storyboard.json",
        extra_input_refs=(
            "docs/launch/screenshots/storyboard.md",
            "docs/launch/screenshots/shot-list.json",
            "docs/launch/screenshots/screenshot-human-review-required.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="launch-info-collector",
        validator_script="scripts/agent_tools/validate_launch_info_collector.py",
        output_ref="docs/launch/launch-info-collector-output.json",
        skill_ref=".agents/skills/launch-info-collector/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/launch-info-collector.json",
        extra_input_refs=(
            "docs/launch/LAUNCH_INFO.md",
            "docs/launch/store-fields/source-of-truth.json",
        ),
    ),
    AgentAdapterSpec(
        agent_id="google-data-safety-agent",
        validator_script="scripts/agent_tools/validate_google_data_safety_agent.py",
        output_ref="docs/launch/google-play/google-data-safety-agent-output.json",
        skill_ref=".agents/skills/google-data-safety-agent/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/google-data-safety-agent.json",
        extra_input_refs=(
            "docs/launch/google-play/data-safety-draft.md",
            "docs/launch/google-play/data-safety-evidence.md",
            "docs/launch/google-play/data-safety-human-review-required.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="screenshot-capture-agent",
        validator_script="scripts/agent_tools/validate_screenshot_capture_agent.py",
        output_ref="docs/launch/screenshots/screenshot-capture-agent-output.json",
        skill_ref=".agents/skills/screenshot-capture-agent/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/screenshot-capture-agent.json",
        extra_input_refs=(
            "docs/launch/screenshots/capture-report.md",
            "docs/launch/screenshots/capture-blockers.md",
        ),
    ),
    AgentAdapterSpec(
        agent_id="launch-package-agent",
        validator_script="scripts/agent_tools/validate_launch_package_agent.py",
        output_ref="artifacts/launch-package/launch-package-agent-output.json",
        skill_ref=".agents/skills/launch-package-agent/SKILL.md",
        l2_artifact_ref="artifacts/agno/play-store/m4/launch-package-agent.json",
        extra_input_refs=(
            "artifacts/launch-package/manifest.json",
            "artifacts/launch-package/readiness-report.md",
            "artifacts/launch-package/launch-package-agent-output.json",
        ),
    ),
)


def read_json(root: Path, relative: str) -> dict[str, Any]:
    return json.loads((root / relative).read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def run_command(root: Path, command: list[str], timeout_seconds: int = 120) -> dict[str, Any]:
    started = utc_now()
    before = time.perf_counter()
    try:
        result = subprocess.run(
            command,
            cwd=root,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
        return {
            "command": command,
            "started_at": started,
            "finished_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "command": command,
            "started_at": started,
            "finished_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": 127,
            "stdout": "",
            "stderr": str(exc),
        }


def summarize_output(output: dict[str, Any]) -> dict[str, Any]:
    claims = output.get("claims", [])
    evidence = output.get("evidence", [])
    human_gates = output.get("human_approval_gates", [])
    claim_ids: list[str] = []
    claim_classes: set[str] = set()
    evidence_refs: list[str] = []
    blockers: list[str] = []
    unresolved_human_gate_ids: list[str] = []
    c345_human_gate_violations: list[str] = []

    for claim in claims if isinstance(claims, list) else []:
        if not isinstance(claim, dict):
            continue
        claim_id = str(claim.get("claim_id", "unknown_claim"))
        claim_ids.append(claim_id)
        claim_class = str(claim.get("claim_class", "unknown"))
        claim_classes.add(claim_class)
        evidence_refs.extend(str(ref) for ref in claim.get("evidence_refs", []) if isinstance(ref, str))
        if claim.get("status") in {"blocked", "needs_human", "missing"}:
            blockers.append(f"{claim_id}: {claim.get('status')}")
        if claim.get("human_review_required") is True:
            unresolved_human_gate_ids.append(claim_id)
        if claim_class in {"C3", "C4", "C5"} and claim.get("human_review_required") is not True:
            c345_human_gate_violations.append(claim_id)
        if claim_class == "C5" and claim.get("status") not in {"blocked", "needs_human", "missing", "not_applicable"}:
            blockers.append(f"{claim_id}: C5 action not blocker-only")

    for entry in evidence if isinstance(evidence, list) else []:
        if isinstance(entry, dict) and isinstance(entry.get("evidence_id"), str):
            evidence_refs.append(entry["evidence_id"])

    for gate in human_gates if isinstance(human_gates, list) else []:
        if not isinstance(gate, dict):
            continue
        if gate.get("required") is True and gate.get("status") in {"needs_human", "blocked", "missing"}:
            unresolved_human_gate_ids.append(str(gate.get("approval_id", "unknown_approval")))

    return {
        "claim_ids": claim_ids,
        "claim_classes": sorted(claim_classes),
        "evidence_refs": sorted(set(evidence_refs)),
        "blocked_reasons": sorted(set(blockers)),
        "unresolved_human_gate_ids": sorted(set(unresolved_human_gate_ids)),
        "c345_human_gate_violations": sorted(set(c345_human_gate_violations)),
    }


def collect_blockers_from_output(output: dict[str, Any]) -> list[str]:
    blockers: list[str] = []
    for claim in output.get("claims", []):
        if not isinstance(claim, dict):
            continue
        if claim.get("status") in {"blocked", "needs_human", "missing"}:
            blockers.append(f"{claim.get('claim_id')}: {claim.get('value')}")
    return blockers


def generate_launch_package_outputs(root: Path, branch: str, commit: str, run_id: str) -> str:
    source_outputs = {
        agent_id: read_json(root, relative)
        for agent_id, relative in AGENT_OUTPUT_REFS.items()
        if agent_id != "launch-package-agent"
    }
    legacy_manifest = read_json(root, "artifacts/launch-package/manifest.json")
    package_dir_ref = launch_package_dir_ref(run_id)
    package_refs = launch_package_output_refs(run_id)
    chinese_report_ref = f"{package_dir_ref}/PLAY_STORE_RELEASE_READINESS.zh-CN.md"
    readiness_report_ref = f"{package_dir_ref}/readiness-report.md"
    manifest_ref = f"{package_dir_ref}/manifest.json"
    output_ref = f"{package_dir_ref}/launch-package-agent-output.json"
    need_human_ref = f"{package_dir_ref}/NEED_HUMAN.md"
    files_included_ref = f"{package_dir_ref}/FILES_INCLUDED.txt"

    fixed_blockers = {
        "Play Console app/account needs owner input.",
        "EAS owner/projectId/build profile and signing policy need owner input.",
        "Privacy policy URL and Developer contact are missing.",
        "Data Safety evidence remains draft and needs owner/Pro review.",
        "Content rating and target audience need owner/Pro decisions.",
        "Screenshot device/emulator is missing; capture_status remains blocked.",
        "signed Android build missing.",
        "real screenshot capture is blocked until an Android device/emulator is available.",
    }
    all_blockers = sorted(
        {
            blocker
            for output in source_outputs.values()
            for blocker in collect_blockers_from_output(output)
        }
        | set(str(item) for item in legacy_manifest.get("blockers", []))
        | fixed_blockers
    )
    readiness = "RED" if all_blockers else "GREEN"
    can_submit_google_play = readiness == "GREEN"
    readiness_reason = (
        "存在 signed Android build、Play Console、privacy/Data Safety、content rating、target audience "
        "和 screenshot capture 等未解除 blocker。"
        if all_blockers
        else "所有 blocker 已解除。"
    )
    top_blockers = [
        "signed Android build / EAS / signing 尚缺",
        "Play Console app/account source-of-truth 尚缺",
        "Privacy policy URL 与 Developer contact 尚缺",
        "Data Safety owner answers 与 Pro review 尚缺",
        "real screenshot capture 因无 device/emulator 仍 blocked",
    ]
    materials = [
        {
            "module": "release/build",
            "what": "已有 release gate、Android build readiness、technical blockers 与 release-build-agent output。",
            "evidence": [
                "docs/release/PLAY_STORE_RELEASE_GATE.md",
                "docs/release/ANDROID_BUILD_READINESS.md",
                "docs/release/PLAY_STORE_TECHNICAL_BLOCKERS.md",
                "docs/release/release-build-agent-output.json",
            ],
            "direct_use": "否。当前只能作为发布前技术审查材料，signed Android build / EAS / signing 仍 blocked。",
            "human_review": "需要 owner/dev 确认 EAS project、签名策略和真实 Android build。",
        },
        {
            "module": "privacy inventory",
            "what": "已有 DATA_INVENTORY 和 privacy disclosure draft。",
            "evidence": [
                "docs/privacy/DATA_INVENTORY.md",
                "docs/launch/privacy/privacy-disclosure-draft.md",
                "docs/privacy/privacy-disclosure-prep-output.json",
            ],
            "direct_use": "否。它是 evidence draft，不是 privacy approval。",
            "human_review": "需要 owner/Pro 审核 C3 privacy claims。",
        },
        {
            "module": "SDK inventory",
            "what": "已有 SDK_INVENTORY，可用于 Data Safety draft 的 SDK evidence。",
            "evidence": ["docs/privacy/SDK_INVENTORY.md"],
            "direct_use": "否。SDK inventory 需要结合真实 release artifact 复核。",
            "human_review": "需要 dev/Pro 复核依赖和 release artifact 差异。",
        },
        {
            "module": "Google Play listing draft",
            "what": "已有 en-US 与 zh-CN listing draft 以及 validation report。",
            "evidence": [
                "docs/launch/google-play/listing.en-US.json",
                "docs/launch/google-play/listing.zh-CN.json",
                "docs/launch/google-play/listing-validation-report.md",
                "docs/launch/google-play/google-play-listing-agent-output.json",
            ],
            "direct_use": "否。listing copy 是 draft，需要 owner/Pro review。",
            "human_review": "需要 owner/Pro 审核 C2 marketing wording 与 C4 store submission claim。",
        },
        {
            "module": "screenshot storyboard",
            "what": "已有 storyboard、shot list 和 human review note。",
            "evidence": [
                "docs/launch/screenshots/storyboard.md",
                "docs/launch/screenshots/shot-list.json",
                "docs/launch/screenshots/screenshot-storyboard-agent-output.json",
            ],
            "direct_use": "否。这里只是截图规划，不是截图文件。",
            "human_review": "需要 owner/Pro 审核画面表达，dev 后续用真实 device/emulator capture。",
        },
        {
            "module": "launch info / source-of-truth",
            "what": "已有 LAUNCH_INFO 和 store-fields source-of-truth draft。",
            "evidence": [
                "docs/launch/LAUNCH_INFO.md",
                "docs/launch/store-fields/source-of-truth.json",
                "docs/launch/launch-info-collector-output.json",
            ],
            "direct_use": "否。Play Console app/account、package identity 等仍需 owner 补齐。",
            "human_review": "需要 owner 提供 store source-of-truth。",
        },
        {
            "module": "Data Safety evidence draft",
            "what": "已有 Data Safety draft、evidence 和 human review required。",
            "evidence": [
                "docs/launch/google-play/data-safety-draft.md",
                "docs/launch/google-play/data-safety-evidence.md",
                "docs/launch/google-play/data-safety-human-review-required.md",
                "docs/launch/google-play/google-data-safety-agent-output.json",
            ],
            "direct_use": "否。它是 C3/C4 evidence draft，不是 approved Data Safety answer。",
            "human_review": "需要 owner/Pro 逐项回答并审批。",
        },
        {
            "module": "launch package manifest / readiness report",
            "what": "本次 L3 workflow 已生成 run-scoped launch package。",
            "evidence": [manifest_ref, readiness_report_ref, output_ref, need_human_ref, files_included_ref],
            "direct_use": "可直接用于 owner review，但不能当作 store submission approval。",
            "human_review": "需要 owner/Pro 根据 NEED_HUMAN 解除 blocker。",
        },
    ]
    missing_items = [
        ("signed Android build / EAS / signing", "没有真实可签名 Android release artifact，无法进入 Play Store 上传与发布验证。", "dev + owner", "EAS owner/projectId/build profile、Android signing policy、release build 命令或 CI evidence。", "signed Android build evidence 与更新后的 release gate。", "rba.c4.android_release_build_blocked"),
        ("Play Console app/account", "没有 Play Console source-of-truth，无法确认 package identity、app listing target 或发布权限。", "owner", "Play Console app id、package name、account ownership、发布权限边界。", "Play Console source-of-truth 记录。", "lic.c5.play_console_action_blocked / lpa.c5.play_console_action_blocked"),
        ("Privacy policy URL", "Google Play listing 和 Data Safety 通常需要公开 privacy policy URL。", "owner / Pro", "正式 privacy policy URL 与适用区域。", "privacy disclosure draft 更新并解除 privacy URL blocker。", "pdp.c3.privacy_policy_url_missing"),
        ("Developer contact", "缺少开发者联系信息会影响 Play Store metadata 和用户支持入口。", "owner", "开发者邮箱、网站或支持联系渠道。", "store-fields/source-of-truth.json 更新。", "Play Console app/account needs owner input"),
        ("Data Safety owner answers", "Data Safety 涉及 C3/C4 声明，不能由 repo 推断成事实。", "owner / Pro", "数据收集、共享、加密、删除请求、SDK 行为确认。", "reviewed Data Safety answers 与更新后的 evidence draft。", "gdsa.c4.play_console_answers_need_human"),
        ("content rating", "内容分级是 Play Store 提交流程的一部分，需要人工确认问卷答案。", "owner / Pro", "内容分级问卷答案和目标国家/地区。", "content rating source-of-truth。", "content rating and target audience needs_human"),
        ("target audience", "目标受众会影响 Play policy、文案和素材审查。", "owner / Pro", "目标年龄层、区域、受众限制和政策判断。", "target audience source-of-truth。", "content rating and target audience needs_human"),
        ("real screenshot capture", "当前只有 storyboard，没有真实截图文件；screenshots 未 captured。", "dev", "Android device/emulator、Expo tooling、可渲染 route、locale 和 fixture。", "真实 screenshot files 与 capture report。", "sca.c4.capture_blocked_no_device"),
        ("public asset selection", "公开商店素材需要 owner/Pro 审核，不能由 storyboard 自动批准。", "owner / Pro", "截图候选、文案、品牌和政策审查意见。", "public asset approval record。", "sca.c2.public_asset_selection_needs_review / ss.c4.play_screenshot_use_needs_review"),
    ]
    blocker_groups = [
        ("release", [("缺 signed Android build / EAS / signing", "blocked", "C4/C5", True, ["docs/release/ANDROID_BUILD_READINESS.md"], "dev + owner 补齐 EAS 和签名 evidence。")]),
        ("privacy", [("Privacy policy URL 与 Developer contact 缺失", "needs_human", "C3", True, ["docs/privacy/DATA_INVENTORY.md"], "owner/Pro 提供并审核 privacy source-of-truth。")]),
        ("Data Safety", [("Data Safety 仍是 evidence draft", "needs_human", "C3/C4", True, ["docs/launch/google-play/data-safety-evidence.md"], "owner/Pro 回答 Play Console Data Safety 问题。")]),
        ("listing", [("listing copy 是 draft，不能当 not final approval", "needs_human", "C2/C4", True, ["docs/launch/google-play/listing-validation-report.md"], "owner/Pro 审核商店文案和 category。")]),
        ("screenshot", [("真实截图 capture_status=blocked，screenshots 未 captured", "blocked", "C2/C4", True, ["docs/launch/screenshots/capture-blockers.md"], "dev 接入 device/emulator 后重新 capture。")]),
        ("Play Console", [("Play Console API、credentials、submission 都禁止在本 workflow 执行", "blocked", "C5", True, ["docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md"], "owner 在外部审批 C5 action。")]),
    ]
    non_claims = [
        "not submitted",
        "not production_ready",
        "not Data Safety approved",
        "not screenshots captured",
        "not Play Store ready",
        "Play Console API not called",
        "real credentials not used",
    ]
    agent_outputs = dict(AGENT_OUTPUT_REFS)
    agent_outputs["launch-package-agent"] = output_ref

    def evidence_list(paths: list[str]) -> str:
        return "\n".join(f"  - evidence: `{path}`" for path in paths)

    materials_text = "\n\n".join(
        "\n".join(
            [
                f"### {item['module']}",
                f"- 有什么：{item['what']}",
                evidence_list(item["evidence"]),
                f"- 是否可直接使用：{item['direct_use']}",
                f"- 是否还需要人审：{item['human_review']}",
            ]
        )
        for item in materials
    )
    missing_text = "\n\n".join(
        "\n".join(
            [
                f"### {name}",
                f"- 缺什么：{name}",
                f"- 为什么影响上架：{why}",
                f"- 谁需要补：{owner}",
                f"- 输入是什么：{input_text}",
                f"- 产出是什么：{output_text}",
                f"- 补完后解除哪个 blocker：`{unblocks}`",
            ]
        )
        for name, why, owner, input_text, output_text, unblocks in missing_items
    )
    blocker_text = "\n\n".join(
        "\n".join(
            [f"### {group}"]
            + [
                "\n".join(
                    [
                        f"- blocker 是什么：{name}",
                        f"  - 当前 status：`{status}`",
                        f"  - claim_class：`{claim_class}`",
                        f"  - human_review_required：`{str(human_required).lower()}`",
                        f"  - evidence_refs：{', '.join(f'`{ref}`' for ref in refs)}",
                        f"  - 下一步动作：{next_action}",
                    ]
                )
                for name, status, claim_class, human_required, refs, next_action in entries
            ]
        )
        for group, entries in blocker_groups
    )
    owner_actions_text = "\n".join(
        "\n".join(
            [
                f"{index}. {name}",
                f"   - 要做什么：补齐并确认 {name}。",
                f"   - 输入是什么：{input_text}",
                f"   - 产出是什么：{output_text}",
                f"   - 负责人类型：{owner}",
                f"   - 解除哪个 blocker：`{unblocks}`",
            ]
        )
        for index, (name, _why, owner, input_text, output_text, unblocks) in enumerate(missing_items, start=1)
    )
    report = f"""# Play Store 发布准备汇总报告

Run id: `{run_id}`

本报告由 `launch-package-agent` 在 8-agent Agno L3 workflow 跑完后直接生成。它面向 owner / Pro / 发布负责人，用中文说明当前 Play Store 发布材料状态；它不是 Play Console 操作记录，也不是发布批准。

## 一、结论摘要

- 当前是否可以提交 Google Play：否
- readiness：{readiness}
- 为什么是这个颜色：{readiness_reason}
- 当前最大 3-5 个阻塞点：
{chr(10).join(f"  - {item}" for item in top_blockers)}

结论：当前不能提交 Google Play，因为 release/build、Play Console、privacy/Data Safety、listing 审核和 real screenshot capture 都仍有 blocker。已有材料可以进入 owner review，但不能当作 not final approval 或 store submission approval。

## 二、已经具备的材料

{materials_text}

## 三、还没有或不完整的材料

{missing_text}

## 四、Blockers / NEED_HUMAN

{blocker_text}

## 五、不可声称事项

- 不是 Play Store ready。
- not submitted：未 submitted。
- not production_ready：未 production_ready。
- not Data Safety approved：Data Safety 未 approved。
- not screenshots captured：screenshots 未 captured。
- Play Console API not called：未调用 Play Console API。
- real credentials not used：未使用 real credentials。
- 当前 listing、privacy、Data Safety、screenshot 相关材料都是 draft 或 evidence draft，需要 human review required。

## 六、Owner 下一步行动

{owner_actions_text}

## Agent output coverage

{chr(10).join(f"- `{agent_id}`: `{relative}`" for agent_id, relative in agent_outputs.items())}

## 全部 blocker 原文

{chr(10).join(f"- {item}" for item in all_blockers)}

human review required before any public store use.
"""
    need_human = f"""# NEED_HUMAN

Run id: `{run_id}`

本文件列出解除 Play Store 发布 blocker 需要人工补齐的事项。所有条目都不代表 approval；它们是 owner / Pro / dev 的下一步清单。

{blocker_text}

## Owner / Pro / dev actions

{owner_actions_text}
"""
    files_included = "\n".join(package_refs) + "\n"
    materials_available = [f"{item['module']}: {item['what']}" for item in materials]
    missing_materials = [item[0] for item in missing_items]

    manifest = {
        "schema_version": "play_store_launch_package_manifest.v1",
        "run_id": run_id,
        "branch": branch,
        "source_commit": commit,
        "readiness": readiness,
        "readiness_reason": readiness_reason,
        "can_submit_google_play": can_submit_google_play,
        "agno_status": AGNO_STATUS,
        "execution_mode": EXECUTION_MODE,
        "generated_by": "launch-package-agent",
        "agent_outputs": agent_outputs,
        "launch_package_outputs": package_refs,
        "materials_available": materials_available,
        "missing_materials": missing_materials,
        "blockers": all_blockers,
        "owner_next_actions": [
            {
                "action": name,
                "owner_type": owner,
                "input": input_text,
                "output": output_text,
                "unblocks": unblocks,
            }
            for name, _why, owner, input_text, output_text, unblocks in missing_items
        ],
        "safety": {
            "play_console_api_called": False,
            "google_play_submission_attempted": False,
            "credentials_used": False,
            "production_action_performed": False,
            "c5_action_executed": False,
            "raw_screenshot_fabricated": False,
        },
        "non_claims": non_claims,
    }
    output = {
        "schema_version": "play_store_agent_output.v1",
        "agent_id": "launch-package-agent",
        "agent_maturity": "L2",
        "agno_status": "dry_run_only",
        "readiness": readiness,
        "can_submit_google_play": can_submit_google_play,
        "chinese_report_ref": chinese_report_ref,
        "summary_report_ref": readiness_report_ref,
        "manifest_ref": manifest_ref,
        "need_human_ref": need_human_ref,
        "files_included_ref": files_included_ref,
        "blockers": all_blockers,
        "non_claims": non_claims,
        "claims": [
            {
                "claim_id": "lpa.c0.eight_agent_outputs_present",
                "value": "All eight Play Store agent outputs are represented in the run-scoped launch package manifest.",
                "source": [manifest_ref],
                "status": "observed_in_repo",
                "confidence": 0.94,
                "claim_class": "C0",
                "human_review_required": False,
                "evidence_refs": ["evidence.lpa.run_manifest"],
                "limitations": ["Presence of outputs does not resolve human gates."],
            },
            {
                "claim_id": "lpa.c0.l3_real_run_present",
                "value": "The launch package was generated during a repo-owned Agno L3 real_run workflow.",
                "source": [f"artifacts/agno/play-store/l3/{run_id}"],
                "status": "observed_in_repo",
                "confidence": 0.9,
                "claim_class": "C0",
                "human_review_required": False,
                "evidence_refs": ["evidence.lpa.l3_run"],
                "limitations": ["L3 orchestration does not mean Play Store submission readiness."],
            },
            {
                "claim_id": "lpa.c4.readiness_red_due_to_store_blockers",
                "value": "Readiness is RED because store submission blockers and C3/C4/C5 human gates remain unresolved.",
                "source": [chinese_report_ref, readiness_report_ref],
                "status": "blocked",
                "confidence": 0.95,
                "claim_class": "C4",
                "human_review_required": True,
                "evidence_refs": ["evidence.lpa.readiness_report"],
                "limitations": ["Owner decisions can change readiness later."],
            },
            {
                "claim_id": "lpa.c5.play_console_action_blocked",
                "value": "Play Console credentials, API calls, submission, and rollout are forbidden in this workflow.",
                "source": ["docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md", chinese_report_ref],
                "status": "blocked",
                "confidence": 0.96,
                "claim_class": "C5",
                "human_review_required": True,
                "evidence_refs": ["evidence.lpa.play_console_blocker"],
                "limitations": ["C5 work requires external owner workflow, not this repo run."],
            },
            {
                "claim_id": "lpa.c2.owner_review_required",
                "value": "The Chinese readiness report is owner-review ready but needs owner/Pro review before public or store use.",
                "source": [chinese_report_ref, need_human_ref],
                "status": "needs_human",
                "confidence": 0.88,
                "claim_class": "C2",
                "human_review_required": True,
                "evidence_refs": ["evidence.lpa.owner_review"],
                "limitations": ["Owner may adjust wording and decisions before PR or store use."],
            },
        ],
        "evidence": [
            {
                "evidence_id": "evidence.lpa.run_manifest",
                "source_type": "repo_file",
                "source_ref": manifest_ref,
                "observed_value": "8-agent outputs and run-scoped launch package outputs listed",
                "status": "observed_in_repo",
            },
            {
                "evidence_id": "evidence.lpa.l3_run",
                "source_type": "repo_file",
                "source_ref": f"artifacts/agno/play-store/l3/{run_id}",
                "observed_value": "Agno real_run artifacts exist for this run",
                "status": "observed_in_repo",
            },
            {
                "evidence_id": "evidence.lpa.readiness_report",
                "source_type": "repo_file",
                "source_ref": chinese_report_ref,
                "observed_value": "readiness RED due to unresolved gates",
                "status": "blocked",
            },
            {
                "evidence_id": "evidence.lpa.play_console_blocker",
                "source_type": "blocked_external_source",
                "source_ref": "Play Console credentials/API/submission/rollout",
                "observed_value": "out of scope for this workflow",
                "status": "blocked",
            },
            {
                "evidence_id": "evidence.lpa.owner_review",
                "source_type": "repo_file",
                "source_ref": need_human_ref,
                "observed_value": "owner next steps and blockers are listed",
                "status": "needs_human",
            },
        ],
        "human_approval_gates": [
            {
                "approval_id": "approval.lpa.google_play_launch_package_review",
                "claim_ids": [
                    "lpa.c4.readiness_red_due_to_store_blockers",
                    "lpa.c5.play_console_action_blocked",
                    "lpa.c2.owner_review_required",
                ],
                "required": True,
                "owner_role": "owner/Pro/store reviewer",
                "status": "needs_human",
            }
        ],
    }

    write_json(root / manifest_ref, manifest)
    write_json(root / output_ref, output)
    write_text(root / chinese_report_ref, report)
    write_text(root / readiness_report_ref, report)
    write_text(root / need_human_ref, need_human)
    write_text(root / files_included_ref, files_included)
    return output_ref


def output_refs_for(spec: AgentAdapterSpec, run_id: str) -> list[str]:
    if spec.agent_id == "launch-package-agent":
        return launch_package_output_refs(run_id)
    return [spec.output_ref]


def screenshot_environment_check(root: Path) -> dict[str, Any]:
    return {"adb_devices": run_command(root, ["adb", "devices"], timeout_seconds=20)}


def run_agent_adapter(
    *,
    root: Path,
    run_dir: Path,
    run_id: str,
    step_index: int,
    spec: AgentAdapterSpec,
    branch: str,
    commit: str,
    dependency_pin: str,
    agno_version: str,
) -> dict[str, Any]:
    started = utc_now()
    before = time.perf_counter()
    output_ref = spec.output_ref
    if spec.agent_id == "launch-package-agent":
        output_ref = generate_launch_package_outputs(root, branch, commit, run_id)
    output = read_json(root, output_ref)
    summary = summarize_output(output)
    environment_checks: dict[str, Any] = {}

    if spec.agent_id == "screenshot-capture-agent":
        environment_checks = screenshot_environment_check(root)
        if output.get("capture_status") == "blocked":
            summary["blocked_reasons"].append("screenshot-capture-agent: capture_status=blocked")
            screenshots = output.get("screenshots")
            if screenshots:
                summary["blocked_reasons"].append("screenshot-capture-agent: blocked output must not list screenshots")

    validator_result = run_command(root, [sys.executable, spec.validator_script, str(root)], timeout_seconds=180)
    logs_dir = run_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    stdout_ref = logs_dir / f"{step_index:02d}-{spec.agent_id}.stdout.txt"
    stderr_ref = logs_dir / f"{step_index:02d}-{spec.agent_id}.stderr.txt"
    stdout_ref.write_text(validator_result["stdout"], encoding="utf-8")
    stderr_ref.write_text(validator_result["stderr"], encoding="utf-8")

    local_errors = list(summary["c345_human_gate_violations"])
    exit_code = 0 if validator_result["exit_code"] == 0 and not local_errors else 1
    blocked_reasons = sorted(set(summary["blocked_reasons"]))
    maturity_level = "L3-with-blockers" if blocked_reasons or summary["unresolved_human_gate_ids"] else "L3"
    finished = utc_now()

    step_artifact = {
        "schema_version": STEP_SCHEMA,
        "run_id": run_id,
        "step_id": f"l3-{step_index:02d}-{spec.agent_id}",
        "agent_id": spec.agent_id,
        "execution_mode": EXECUTION_MODE,
        "agno_status": AGNO_STATUS,
        "maturity_level": maturity_level,
        "input_contract_ref": "docs/harness/play-store-agent-harness/INPUT_CONTRACT.md",
        "output_contract_ref": "docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md",
        "evidence_ledger_ref": "docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md",
        "human_approval_gate_ref": "docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md",
        "input_refs": [
            "docs/harness/play-store-agent-harness/INPUT_CONTRACT.md",
            "docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md",
            "docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md",
            "docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md",
            spec.skill_ref,
            spec.l2_artifact_ref,
            *spec.extra_input_refs,
        ],
        "output_refs": output_refs_for(spec, run_id),
        "evidence_refs": summary["evidence_refs"],
        "claim_ids": summary["claim_ids"],
        "claim_classes": summary["claim_classes"],
        "validator_command": spec.validator_command,
        "validator_exit_code": validator_result["exit_code"],
        "validation_results": {
            "validator_command": spec.validator_command,
            "executed_command": validator_result["command"],
            "exit_code": validator_result["exit_code"],
            "status": "pass" if validator_result["exit_code"] == 0 else "fail",
            "stdout_ref": stdout_ref.relative_to(root).as_posix(),
            "stderr_ref": stderr_ref.relative_to(root).as_posix(),
        },
        "started_at": started,
        "finished_at": finished,
        "duration_ms": int((time.perf_counter() - before) * 1000),
        "exit_code": exit_code,
        "generated_by_runner": True,
        "runtime_provenance": {
            "runner": RUNNER_REF,
            "dependency_lock_ref": DEPENDENCY_REF,
            "dependency_pin": dependency_pin,
            "agno_package": "agno",
            "agno_version": agno_version,
            "workflow_module": "agno.workflow",
            "adapter_module": "scripts/agent_tools/play_store_agno_adapters.py",
            "branch": branch,
            "commit": commit,
        },
        "environment_checks": environment_checks,
        "blocked_reason": blocked_reasons,
        "unresolved_human_gate_ids": summary["unresolved_human_gate_ids"],
        "next_allowed_action": "owner_review" if blocked_reasons or summary["unresolved_human_gate_ids"] else "continue",
    }
    step_path = run_dir / "steps" / f"{step_index:02d}-{spec.agent_id}.json"
    write_json(step_path, step_artifact)
    return step_artifact


def run_all_adapters(
    *,
    root: Path,
    run_dir: Path,
    run_id: str,
    branch: str,
    commit: str,
    dependency_pin: str,
    agno_version: str,
) -> list[dict[str, Any]]:
    steps: list[dict[str, Any]] = []
    for index, spec in enumerate(AGENT_SPECS, start=1):
        steps.append(
            run_agent_adapter(
                root=root,
                run_dir=run_dir,
                run_id=run_id,
                step_index=index,
                spec=spec,
                branch=branch,
                commit=commit,
                dependency_pin=dependency_pin,
                agno_version=agno_version,
            )
        )
    return steps
