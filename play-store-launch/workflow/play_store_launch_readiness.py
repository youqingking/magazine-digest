#!/usr/bin/env python3
"""Build fresh AI-backed Play Store launch-readiness run artifacts."""

from __future__ import annotations

import hashlib
import json
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from play_store_model_client import (
    ModelConfig,
    ModelUnavailableError,
    call_codex_cli,
    call_openai_chat,
    load_model_config,
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

UPSTREAM_AGENTS = AGENTS[:-1]
RUN_SCHEMA = "play_store_launch_readiness_run.v2"
REPORT_SCHEMA = "play_store_launch_readiness_report.v2"
STEP_SCHEMA = "play_store_launch_readiness_step.v2"
AGNO_ORCHESTRATION_MODE = "agno_native_8_step_pipeline"
AGNO_WORKFLOW_ID = "play-store-launch-readiness-workflow"
SENTINEL = "DO_NOT_READ_OLD_AGENT_OUTPUT_SENTINEL"
FORBIDDEN_OLD_PREFIXES = (
    "artifacts/agent-reality-runs/",
    "artifacts/launch-package/",
)

FORBIDDEN_AI_TERMS = (
    "final",
    "approved",
    "submitted",
    "ready_to_submit",
    "can_submit_google_play=true",
)

BOUNDARY_ROOT = Path(__file__).resolve().parents[1]
CODEX_OUTPUT_SCHEMA_PATH = BOUNDARY_ROOT / "schemas" / "codex-agent-output.schema.json"
CODEX_OUTPUT_SCHEMA: dict[str, Any] = json.loads(CODEX_OUTPUT_SCHEMA_PATH.read_text(encoding="utf-8"))

AGENT_LABELS = {
    "release-build-agent": "发布构建检查",
    "privacy-disclosure-prep": "隐私披露准备",
    "google-play-listing": "商店文案草稿",
    "screenshot-storyboard": "截图分镜规划",
    "launch-info-collector": "上架信息收集",
    "google-data-safety-agent": "Data Safety 草稿",
    "screenshot-capture-agent": "真实截图捕获",
    "launch-package-agent": "发布包汇总",
}

AGENT_TASKS = {
    "release-build-agent": "解释本轮命令结果、失败原因、发布风险和下一步。不得决定命令 pass/fail。",
    "launch-info-collector": "从本轮 evidence 中抽取候选 app name、描述、support/privacy/category 字段，缺失项保持 unknown/needs_human。",
    "privacy-disclosure-prep": "生成隐私披露草稿、风险说明和 human review items。不得给出 legal approval 或 privacy approval。",
    "google-data-safety-agent": "生成 Data Safety 草稿和 unknown/needs_human 解释。不得把 unknown 写成 no data collected。",
    "google-play-listing": "生成 title、short description、full description 草稿。不得写无证据营销 claim 或 Play Store 定稿。",
    "screenshot-storyboard": "生成 screenshot storyboard、route/scenario/value proposition。不得声称真实截图已生成。",
    "screenshot-capture-agent": "解释截图采集状态、blocker 和解除方式。不得生成或伪造截图。",
    "launch-package-agent": "只汇总当前 run 前 7 个 step 的 output/evidence。不得新增上游没有的 claim，不得把 RED/YELLOW 改成 GREEN。",
}

AGENT_IMPACTS = {
    "release-build-agent": "无法证明签名 Android 构建、EAS 配置或 Play Console 提交流程可用。",
    "privacy-disclosure-prep": "隐私披露、隐私政策 URL 和法律措辞不能用于公开商店材料。",
    "google-play-listing": "商店文案只能保持草稿，类别、评级、受众和授权不能视为完成。",
    "screenshot-storyboard": "已有截图规划，但还不能作为可上传截图资产。",
    "launch-info-collector": "Play Console、开发者联系人和公开商店字段仍缺 source-of-truth。",
    "google-data-safety-agent": "Data Safety 只能保持 evidence draft，不能视为商店答案。",
    "screenshot-capture-agent": "没有真实设备或模拟器截图证据，不能列出截图文件。",
    "launch-package-agent": "汇总包只能 fail-closed，不得把上游 blocker 改写为可提交。",
}

AGENT_UNBLOCKS = {
    "release-build-agent": "owner/dev 提供 EAS project、签名策略、release build 和 dry-run 证据。",
    "privacy-disclosure-prep": "owner/Pro 提供并审核隐私政策 URL、开发者联系人和适用法律披露。",
    "google-play-listing": "owner/Pro 审核文案、类别、内容评级、目标受众、授权和商标风险。",
    "screenshot-storyboard": "owner/Pro 审核分镜表达，dev 后续用真实设备或模拟器捕获截图。",
    "launch-info-collector": "owner 补齐 Play Console app/account、公开字段和开发者联系信息。",
    "google-data-safety-agent": "owner/Pro 按 Play Console 问题逐项确认 Data Safety、SDK、儿童家庭和广告追踪答案。",
    "screenshot-capture-agent": "dev 连接 Android 设备或模拟器，生成带 route、device、locale、commit 的真实截图证据。",
    "launch-package-agent": "等待前 7 个代理 blocker 解除后重新运行 workflow。",
}


@dataclass(frozen=True)
class EvidenceSource:
    source_kind: str
    source_path: str | None = None
    command: tuple[str, ...] | None = None
    summary_hint: str = ""


@dataclass
class LaunchReadinessRunContext:
    root: Path
    run_dir: Path
    run_id: str
    branch: str
    commit: str
    runner_command: str
    started_at: str
    config: ModelConfig | None
    config_error: str | None
    steps: list[dict[str, Any]] = field(default_factory=list)
    all_evidence: list[dict[str, Any]] = field(default_factory=list)
    model_results: list[bool] = field(default_factory=list)
    agno_step_ledger: list[dict[str, Any]] = field(default_factory=list)


AGENT_EVIDENCE_SOURCES: dict[str, tuple[EvidenceSource, ...]] = {
    "release-build-agent": (
        EvidenceSource("command", command=("python", "scripts/agent_tools/validate_release_build_agent.py", "."), summary_hint="release-build-agent validator"),
        EvidenceSource("repo_file", source_path="docs/release/ANDROID_BUILD_READINESS.md", summary_hint="Android build readiness"),
        EvidenceSource("repo_file", source_path="docs/release/PLAY_STORE_RELEASE_GATE.md", summary_hint="release gate"),
    ),
    "privacy-disclosure-prep": (
        EvidenceSource("repo_file", source_path="docs/privacy/DATA_INVENTORY.md", summary_hint="data inventory"),
        EvidenceSource("repo_file", source_path="docs/privacy/SDK_INVENTORY.md", summary_hint="SDK inventory"),
        EvidenceSource("repo_file", source_path="docs/launch/privacy/privacy-disclosure-draft.md", summary_hint="privacy disclosure draft"),
    ),
    "google-play-listing": (
        EvidenceSource("repo_file", source_path="docs/launch/google-play/listing.en-US.json", summary_hint="en-US listing draft"),
        EvidenceSource("repo_file", source_path="docs/launch/google-play/listing.zh-CN.json", summary_hint="zh-CN listing draft"),
        EvidenceSource("repo_file", source_path="docs/launch/google-play/listing-validation-report.md", summary_hint="listing validation report"),
    ),
    "screenshot-storyboard": (
        EvidenceSource("repo_file", source_path="docs/launch/screenshots/storyboard.md", summary_hint="screenshot storyboard"),
        EvidenceSource("repo_file", source_path="docs/launch/screenshots/shot-list.json", summary_hint="shot list"),
        EvidenceSource("repo_file", source_path="docs/launch/screenshots/screenshot-validation-notes.md", summary_hint="screenshot validation notes"),
    ),
    "launch-info-collector": (
        EvidenceSource("repo_file", source_path="package.json", summary_hint="repo package metadata"),
        EvidenceSource("repo_file", source_path="apps/mobile/README.md", summary_hint="mobile README"),
        EvidenceSource("repo_file", source_path="docs/launch/LAUNCH_INFO.md", summary_hint="launch info"),
        EvidenceSource("repo_file", source_path="docs/launch/store-fields/source-of-truth.json", summary_hint="store fields source of truth"),
    ),
    "google-data-safety-agent": (
        EvidenceSource("repo_file", source_path="docs/launch/google-play/data-safety-draft.md", summary_hint="Data Safety draft"),
        EvidenceSource("repo_file", source_path="docs/launch/google-play/data-safety-evidence.md", summary_hint="Data Safety evidence"),
        EvidenceSource("repo_file", source_path="docs/launch/google-play/data-safety-human-review-required.md", summary_hint="Data Safety human review"),
    ),
    "screenshot-capture-agent": (
        EvidenceSource("command", command=("adb", "devices"), summary_hint="Android device availability"),
        EvidenceSource("repo_file", source_path="docs/launch/screenshots/capture-report.md", summary_hint="capture report"),
        EvidenceSource("repo_file", source_path="docs/launch/screenshots/capture-blockers.md", summary_hint="capture blockers"),
    ),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows), encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def skill_path_for_agent(agent_name: str) -> str:
    return f".agents/skills/{agent_name}/SKILL.md"


def skill_hash_for_agent(root: Path, agent_name: str) -> str:
    skill_path = root / skill_path_for_agent(agent_name)
    return hashlib.sha256(skill_path.read_bytes()).hexdigest()


def agno_step_id_for_agent(agent_name: str, step_index: int) -> str:
    return f"{step_index:02d}-{agent_name}"


def agno_step_order() -> list[str]:
    return [agno_step_id_for_agent(agent_name, index) for index, agent_name in enumerate(AGENTS, start=1)]


def validate_codex_payload(payload: Any, allowed_evidence_ids: set[str]) -> list[str]:
    errors: list[str] = []
    if not isinstance(payload, dict):
        return ["codex output must be a JSON object"]
    for field in CODEX_OUTPUT_SCHEMA["required"]:
        if field not in payload:
            errors.append(f"codex output missing {field}")
    if not isinstance(payload.get("summary_zh"), str) or not payload.get("summary_zh", "").strip():
        errors.append("codex output summary_zh must be a non-empty string")
    for field in ("confirmed_facts", "risks", "human_review_items", "next_steps", "evidence_ids_used"):
        value = payload.get(field)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            errors.append(f"codex output {field} must be an array of strings")
    for evidence_id in payload.get("evidence_ids_used", []):
        if evidence_id not in allowed_evidence_ids:
            errors.append(f"codex output used non-current evidence id: {evidence_id}")
    serialized = json.dumps(payload, ensure_ascii=False).lower()
    if contains_forbidden_ai_claim(serialized):
        errors.append("codex output contains a forbidden final-status claim")
    return errors


def run_command(root: Path, command: tuple[str, ...]) -> dict[str, Any]:
    started = utc_now()
    before = time.perf_counter()
    try:
        result = subprocess.run(command, cwd=root, text=True, capture_output=True, check=False, timeout=120)
        return {
            "started_at": started,
            "completed_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": result.returncode,
            "stdout_excerpt": result.stdout[:1200],
            "stderr_excerpt": result.stderr[:1200],
        }
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "started_at": started,
            "completed_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": 127,
            "stdout_excerpt": "",
            "stderr_excerpt": str(exc)[:1200],
        }


def summarize_file(root: Path, relative: str, hint: str) -> str:
    path = root / relative
    if not path.is_file():
        return f"{hint}: missing file {relative}"
    text = path.read_text(encoding="utf-8", errors="replace")
    first_lines = " ".join(line.strip() for line in text.splitlines()[:8] if line.strip())
    return f"{hint}: {relative}, bytes={path.stat().st_size}, excerpt={first_lines[:600]}"


def forbid_old_source_path(source_path: str | None) -> None:
    if not source_path:
        return
    normalized = source_path.replace("\\", "/")
    if normalized.startswith(FORBIDDEN_OLD_PREFIXES):
        raise ValueError(f"old artifact path is not allowed as fresh evidence: {source_path}")


def collect_agent_evidence(root: Path, run_id: str, agent_name: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for index, source in enumerate(AGENT_EVIDENCE_SOURCES[agent_name], start=1):
        evidence_id = f"{agent_name}.evidence.{index:02d}"
        collected_at = utc_now()
        if source.source_kind == "repo_file":
            forbid_old_source_path(source.source_path)
            summary = summarize_file(root, source.source_path or "", source.summary_hint)
            row = {
                "run_id": run_id,
                "agent_name": agent_name,
                "evidence_id": evidence_id,
                "collected_at": collected_at,
                "source_kind": source.source_kind,
                "source_path": source.source_path,
                "summary": summary,
            }
        elif source.source_kind == "command" and source.command:
            result = run_command(root, source.command)
            command_text = " ".join(source.command)
            row = {
                "run_id": run_id,
                "agent_name": agent_name,
                "evidence_id": evidence_id,
                "collected_at": collected_at,
                "source_kind": "command",
                "command": command_text,
                "summary": (
                    f"{source.summary_hint}: exit_code={result['exit_code']}; "
                    f"stdout={result['stdout_excerpt'][:500]}; stderr={result['stderr_excerpt'][:300]}"
                ),
                "command_result": result,
            }
        else:
            raise ValueError(f"unsupported evidence source for {agent_name}: {source}")
        rows.append(row)
    return rows


def collect_launch_package_evidence(run_id: str, upstream_steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for index, step in enumerate(upstream_steps, start=1):
        rows.append(
            {
                "run_id": run_id,
                "agent_name": "launch-package-agent",
                "evidence_id": f"launch-package-agent.evidence.{index:02d}",
                "collected_at": utc_now(),
                "source_kind": "current_run_step_output",
                "source_path": step["output_paths"]["output"],
                "summary": (
                    f"Current run step {step['agent_name']} readiness={step['readiness']} "
                    f"human_review_count={step['human_review_count']}"
                ),
            }
        )
    return rows


def build_prompt(agent_name: str, evidence: list[dict[str, Any]], upstream_steps: list[dict[str, Any]] | None = None) -> tuple[str, str]:
    prompt_id = f"{agent_name}.launch_readiness.fresh_ai.v1"
    evidence_text = "\n".join(
        f"- {row['evidence_id']}: {row['source_kind']} :: {row['summary']}"
        for row in evidence
    )
    upstream_text = ""
    if upstream_steps:
        upstream_text = "\n".join(
            f"- {step['agent_name']}: readiness={step['readiness']}; blockers={step['human_review_count']}"
            for step in upstream_steps
        )
    prompt = f"""你是 {agent_name}，负责 Play Store 上架准备 workflow 的一个 fresh AI agent step。
任务：{AGENT_TASKS[agent_name]}

只能使用下面的 current-run evidence IDs。不要使用旧 artifacts，不要引用未列出的信息。
Evidence:
{evidence_text}

Upstream current-run steps:
{upstream_text or "- none"}

安全规则：
- 不得把 missing / unknown / needs_human 改成 ready。
- 不得新增没有 evidence_id 支持的 claim。
- 不得使用 final、approved、submitted、ready_to_submit 或 can_submit_google_play=true。
- 不得声称 Play Store production readiness。
- 输出中文为主，简洁说明：已确认事实、风险、人工补充项、下一步。

结构化输出要求：
- 只输出符合 schema 的 JSON object。
- 字段必须包含 summary_zh、confirmed_facts、risks、human_review_items、next_steps、evidence_ids_used。
- evidence_ids_used 只能列出上方 Evidence 中出现的 evidence_id。
- JSON 所有字符串值不得包含这些英文禁词，即使是否定语境也不能写：final、approved、submitted、ready_to_submit、can_submit_google_play=true。
- 如需表达安全边界，请改用中文表述，例如“仍为草稿”“需要人工审核”“不能提交”。
- 不要输出 markdown、代码块或额外解释。
"""
    return prompt_id, prompt


def contains_forbidden_ai_claim(text: str) -> bool:
    lowered = text.lower()
    return any(term in lowered for term in FORBIDDEN_AI_TERMS)


class ModelInvocationError(ModelUnavailableError):
    def __init__(self, message: str, metadata: dict[str, Any]) -> None:
        super().__init__(message)
        self.metadata = metadata


def invoke_model(
    config: ModelConfig,
    agent_name: str,
    evidence: list[dict[str, Any]],
    *,
    root: Path,
    step_dir: Path,
    schema_path: Path,
    upstream_steps: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], str]:
    prompt_id, prompt = build_prompt(agent_name, evidence, upstream_steps)
    started_at = utc_now()
    if config.provider == "codex_cli":
        output_path = step_dir / "model-output.json"
        result = call_codex_cli(
            config,
            prompt=prompt,
            schema_path=schema_path.as_posix(),
            output_path=output_path.as_posix(),
            cwd=root.as_posix(),
        )
        completed_at = utc_now()
        metadata = {
            "required": True,
            "enabled": True,
            "provider": "codex_cli",
            "model": config.model,
            "auth_method": "chatgpt_login_or_cli_cached",
            "command": "codex exec",
            "command_args": [
                "--ignore-user-config",
                "--model",
                config.model,
                "--sandbox",
                "read-only",
                "--ephemeral",
                "--output-schema",
                schema_path.relative_to(root).as_posix(),
                "--output-last-message",
                output_path.relative_to(root).as_posix(),
            ],
            "prompt_id": prompt_id,
            "prompt_hash": sha256_text(prompt),
            "input_evidence_ids": [row["evidence_id"] for row in evidence],
            "output_path": output_path.relative_to(root).as_posix(),
            "schema_path": schema_path.relative_to(root).as_posix(),
            "schema_valid": False,
            "exit_code": result["exit_code"],
            "started_at": started_at,
            "completed_at": completed_at,
            "duration_ms": result["duration_ms"],
        }
        if result["exit_code"] != 0:
            raise ModelInvocationError(
                f"codex_cli_failed: exit_code={result['exit_code']}; {result.get('error_summary', '')[:500]}",
                metadata,
            )
        try:
            payload = read_json(output_path)
        except (OSError, json.JSONDecodeError) as exc:
            raise ModelInvocationError(f"codex_cli_output_invalid_json: {exc}", metadata) from exc
        schema_errors = validate_codex_payload(payload, set(metadata["input_evidence_ids"]))
        if schema_errors:
            raise ModelInvocationError("codex_cli_output_schema_invalid: " + "; ".join(schema_errors), metadata)
        metadata["schema_valid"] = True
        content = str(payload["summary_zh"]).strip()
        return metadata, content

    if config.provider != "openai":
        raise ModelUnavailableError(f"unsupported model provider: {config.provider}")

    response = call_openai_chat(
        config,
        [
            {
                "role": "system",
                "content": "You are an evidence-bound launch readiness agent. Follow the user's safety rules exactly.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    completed_at = utc_now()
    content = response["content"]
    if contains_forbidden_ai_claim(content):
        raise ModelUnavailableError(f"model_output_forbidden_claim: {agent_name}")
    metadata = {
        "required": True,
        "enabled": True,
        "provider": config.provider,
        "model": config.model,
        "prompt_id": prompt_id,
        "prompt_hash": sha256_text(prompt),
        "input_evidence_ids": [row["evidence_id"] for row in evidence],
        "response_id": response["response_id"],
        "started_at": started_at,
        "completed_at": completed_at,
        "duration_ms": response["duration_ms"],
    }
    return metadata, content


def blocked_model_invocation(
    agent_name: str,
    evidence: list[dict[str, Any]],
    error: str,
    config: ModelConfig | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if metadata is not None:
        blocked = dict(metadata)
        blocked["error"] = error
        return blocked
    now = utc_now()
    prompt_id, prompt = build_prompt(agent_name, evidence)
    return {
        "required": True,
        "enabled": config is not None,
        "provider": config.provider if config else None,
        "model": config.model if config else None,
        "prompt_id": prompt_id,
        "prompt_hash": sha256_text(prompt),
        "input_evidence_ids": [row["evidence_id"] for row in evidence],
        "response_id": None,
        "started_at": now,
        "completed_at": now,
        "error": error,
    }


def build_claims(agent_name: str, evidence_ids: list[str], readiness: str) -> list[dict[str, Any]]:
    return [
        {
            "claim_id": f"{agent_name}.fresh_run.current_evidence_collected",
            "status": "observed_in_repo",
            "claim_class": "C1",
            "human_review_required": False,
            "evidence_refs": evidence_ids,
        },
        {
            "claim_id": f"{agent_name}.fresh_run.fail_closed_status",
            "status": "blocked" if readiness == "RED" else "needs_human",
            "claim_class": "C5",
            "human_review_required": True,
            "evidence_refs": evidence_ids,
        },
    ]


def human_items(agent_name: str, claims: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "agent_name": agent_name,
            "claim_id": claim["claim_id"],
            "status": claim["status"],
            "claim_class": claim["claim_class"],
            "reason": f"{AGENT_LABELS[agent_name]} 仍需要人工确认。",
            "impact": AGENT_IMPACTS[agent_name],
            "unblock_action": AGENT_UNBLOCKS[agent_name],
            "evidence_refs": claim["evidence_refs"],
        }
        for claim in claims
        if claim.get("human_review_required") is True
    ]


def build_step(
    *,
    root: Path,
    run_dir: Path,
    run_id: str,
    agent_name: str,
    step_index: int,
    config: ModelConfig | None,
    upstream_steps: list[dict[str, Any]] | None = None,
    model_config_error: str | None = None,
    agno_step_id: str | None = None,
    agno_step_name: str | None = None,
    upstream_agno_step_ids: list[str] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], bool]:
    started_at = utc_now()
    agno_step_id = agno_step_id or agno_step_id_for_agent(agent_name, step_index)
    agno_step_name = agno_step_name or agent_name
    skill_path = skill_path_for_agent(agent_name)
    skill_hash = skill_hash_for_agent(root, agent_name)
    evidence = (
        collect_launch_package_evidence(run_id, upstream_steps or [])
        if agent_name == "launch-package-agent"
        else collect_agent_evidence(root, run_id, agent_name)
    )
    step_dir = run_dir / "steps" / agent_name
    step_dir.mkdir(parents=True, exist_ok=True)
    schema_path = run_dir / "codex-agent-output.schema.json"
    model_ok = False
    ai_summary = ""
    try:
        if config is None:
            raise ModelUnavailableError(model_config_error or "model_required_but_unavailable")
        model_invocation, ai_summary = invoke_model(
            config,
            agent_name,
            evidence,
            root=root,
            step_dir=step_dir,
            schema_path=schema_path,
            upstream_steps=upstream_steps,
        )
        model_ok = True
    except ModelInvocationError as exc:
        model_invocation = blocked_model_invocation(agent_name, evidence, str(exc), config, exc.metadata)
        ai_summary = f"模型调用失败，当前 agent blocked：{exc}"
    except ModelUnavailableError as exc:
        model_invocation = blocked_model_invocation(agent_name, evidence, str(exc), config)
        ai_summary = f"模型不可用，当前 agent blocked：{exc}"

    readiness = "RED"
    claims = build_claims(agent_name, [row["evidence_id"] for row in evidence], readiness)
    items = human_items(agent_name, claims)
    completed_at = utc_now()
    step_output = {
        "schema_version": STEP_SCHEMA,
        "run_id": run_id,
        "agent_name": agent_name,
        "step_index": step_index,
        "agno_step_id": agno_step_id,
        "agno_step_name": agno_step_name,
        "skill_path": skill_path,
        "skill_hash": skill_hash,
        "skill_hash_algorithm": "sha256",
        "agent_status": "completed_model_invocation" if model_ok else "blocked_model_unavailable",
        "readiness": readiness,
        "execution": {
            "mode": "fresh_ai_agent_run",
            "used_prior_outputs": False,
            "source_policy": "no_prior_agent_outputs",
            "started_at": started_at,
            "completed_at": completed_at,
        },
        "model_invocation": model_invocation,
        "ai_summary": ai_summary,
        "claims": claims,
        "human_review_items": items,
        "evidence_count": len(evidence),
        "human_review_count": len(items),
        "output_paths": {
            "output": (step_dir / "output.json").relative_to(root).as_posix(),
            "evidence": (step_dir / "evidence.jsonl").relative_to(root).as_posix(),
            "summary": (step_dir / "summary.zh.md").relative_to(root).as_posix(),
        },
    }
    if agent_name == "launch-package-agent":
        step_output["upstream_agents"] = [step["agent_name"] for step in upstream_steps or []]
        step_output["upstream_step_outputs"] = [step["output_paths"]["output"] for step in upstream_steps or []]
        step_output["upstream_agno_step_ids"] = upstream_agno_step_ids or [
            step.get("agno_step_id") for step in upstream_steps or []
        ]

    write_json(step_dir / "output.json", step_output)
    write_jsonl(step_dir / "evidence.jsonl", evidence)
    write_text(step_dir / "summary.zh.md", render_step_summary(step_output, evidence))
    return step_output, evidence, model_ok


def build_agno_step_ledger_row(
    *,
    context: LaunchReadinessRunContext,
    step: dict[str, Any],
    step_index: int,
    started_at: str,
    completed_at: str,
) -> dict[str, Any]:
    agent_name = step["agent_name"]
    invocation = step.get("model_invocation", {})
    upstream_agno_step_ids = step.get("upstream_agno_step_ids", [])
    return {
        "run_id": context.run_id,
        "agno_workflow_id": AGNO_WORKFLOW_ID,
        "agno_orchestration_mode": AGNO_ORCHESTRATION_MODE,
        "agno_step_id": step["agno_step_id"],
        "agno_step_name": step["agno_step_name"],
        "agent_name": agent_name,
        "step_index": step_index,
        "skill_path": step["skill_path"],
        "skill_hash": step["skill_hash"],
        "skill_hash_algorithm": step["skill_hash_algorithm"],
        "input_kind": "current_run_upstream_steps" if agent_name == "launch-package-agent" else "repo_evidence",
        "upstream_agno_step_ids": upstream_agno_step_ids,
        "output_path": step["output_paths"]["output"],
        "evidence_path": step["output_paths"]["evidence"],
        "summary_path": step["output_paths"]["summary"],
        "model_invocation_provider": invocation.get("provider"),
        "model_invocation_model": invocation.get("model"),
        "model_invocation_prompt_id": invocation.get("prompt_id"),
        "model_invocation_prompt_hash": invocation.get("prompt_hash"),
        "status": step["agent_status"],
        "started_at": started_at,
        "completed_at": completed_at,
    }


def prepare_launch_readiness_context(
    *,
    root: Path,
    run_id: str,
    branch: str,
    commit: str,
    runner_command: str,
    started_at: str,
) -> LaunchReadinessRunContext:
    run_dir = root / "artifacts/play-store-launch" / run_id
    try:
        config = load_model_config()
        config_error = None
    except ModelUnavailableError as exc:
        config = None
        config_error = str(exc)

    if config is not None and config.provider == "codex_cli":
        write_json(run_dir / "codex-agent-output.schema.json", CODEX_OUTPUT_SCHEMA)

    return LaunchReadinessRunContext(
        root=root,
        run_dir=run_dir,
        run_id=run_id,
        branch=branch,
        commit=commit,
        runner_command=runner_command,
        started_at=started_at,
        config=config,
        config_error=config_error,
    )


def run_launch_readiness_agent_step(
    context: LaunchReadinessRunContext,
    *,
    agent_name: str,
    step_index: int,
) -> dict[str, Any]:
    started_at = utc_now()
    agno_step_id = agno_step_id_for_agent(agent_name, step_index)
    upstream_steps = context.steps if agent_name == "launch-package-agent" else None
    upstream_agno_step_ids = [step["agno_step_id"] for step in context.steps] if agent_name == "launch-package-agent" else []
    step, evidence, model_ok = build_step(
        root=context.root,
        run_dir=context.run_dir,
        run_id=context.run_id,
        agent_name=agent_name,
        step_index=step_index,
        config=context.config,
        upstream_steps=upstream_steps,
        model_config_error=context.config_error,
        agno_step_id=agno_step_id,
        agno_step_name=agent_name,
        upstream_agno_step_ids=upstream_agno_step_ids,
    )
    context.steps.append(step)
    context.all_evidence.extend(evidence)
    context.model_results.append(model_ok)
    completed_at = utc_now()
    context.agno_step_ledger.append(
        build_agno_step_ledger_row(
            context=context,
            step=step,
            step_index=step_index,
            started_at=started_at,
            completed_at=completed_at,
        )
    )
    write_jsonl(context.run_dir / "agno-step-ledger.jsonl", context.agno_step_ledger)
    return step


def combined_readiness(steps: list[dict[str, Any]]) -> str:
    if any(step["readiness"] == "RED" for step in steps):
        return "RED"
    if any(step["readiness"] == "YELLOW" for step in steps):
        return "YELLOW"
    return "GREEN"


def render_step_summary(step: dict[str, Any], evidence: list[dict[str, Any]]) -> str:
    evidence_index = "\n".join(
        f"- `{row['evidence_id']}` -> {row.get('source_path') or row.get('command')} ({row['source_kind']})"
        for row in evidence
    )
    human = "\n".join(
        f"- `{item['claim_id']}`：{item['unblock_action']}"
        for item in step["human_review_items"]
    )
    return f"""# {AGENT_LABELS[step['agent_name']]}

Agent: `{step['agent_name']}`
Agno Step: `{step['agno_step_id']}`
Skill: `{step['skill_path']}`
Skill Hash: `{step['skill_hash']}`
状态: {step['readiness']}
执行: fresh_ai_agent_run
模型调用: {'enabled=true' if step['model_invocation']['enabled'] else 'enabled=false'}

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
{step['ai_summary']}

## 人工补充项
{human or "- 无"}

## Evidence Index
{evidence_index}
"""


def build_report(
    run_id: str,
    run_dir: Path,
    steps: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
    all_model_ok: bool,
    provider: str | None,
) -> dict[str, Any]:
    blockers = [item for step in steps for item in step["human_review_items"]]
    maturity = "blocked_model_unavailable"
    status = "blocked_model_unavailable"
    if all_model_ok and provider == "codex_cli":
        maturity = "A3_CODEX_CLI_BACKED"
        status = "codex_cli_model_backed_per_agent_run"
    elif all_model_ok:
        maturity = "A3"
        status = "model_backed_per_agent_run"
    return {
        "schema_version": REPORT_SCHEMA,
        "run_id": run_id,
        "mode": "launch-readiness",
        "readiness": combined_readiness(steps),
        "can_submit_google_play": False,
        "safe_to_strengthen_final_store_claims": False,
        "agno": {
            "maturity": maturity,
            "status": status,
            "model_backed_reasoning": all_model_ok,
            "orchestration_mode": AGNO_ORCHESTRATION_MODE,
            "native_step_count": len(steps),
            "step_order": [step["agno_step_id"] for step in steps],
            "workflow_id": AGNO_WORKFLOW_ID,
            "step_ledger": (run_dir / "agno-step-ledger.jsonl").as_posix(),
        },
        "output_dir": run_dir.as_posix(),
        "confirmed_facts": [
            "8 个 agent step 均在当前 run_id 下重新生成。",
            "每个 step 的 output/evidence/summary 都位于 artifacts/play-store-launch/<run-id>/steps/<agent>/ 下。",
            "launch-package-agent 只消费当前 run 前 7 个 step 的输出。",
            "Reality Gate 继续保持 FAIL_CLOSED；本轮不进入 Goal 2 cross-PRD 或 Goal 3 production proof。",
        ],
        "materials_available": [f"{step['agent_name']}：{step['output_paths']['output']}" for step in steps],
        "missing_materials": sorted({item["unblock_action"] for item in blockers}),
        "blockers": blockers,
        "agent_steps": steps,
        "evidence_index": evidence,
        "non_goals": [
            "Goal 2 cross-PRD not run",
            "Goal 3 production proof not run",
            "Play Store production readiness not claimed",
        ],
    }


def render_report(report: dict[str, Any]) -> str:
    facts = "\n".join(f"- {item}" for item in report["confirmed_facts"])
    materials = "\n".join(f"- {item}" for item in report["materials_available"])
    missing = "\n".join(f"- {item}" for item in report["missing_materials"])
    blockers = "\n".join(
        "\n".join(
            [
                f"### {item['agent_name']} / `{item['claim_id']}`",
                f"- 原因：{item['reason']}",
                f"- 影响：{item['impact']}",
                f"- 解除方式：{item['unblock_action']}",
                f"- evidence：{', '.join(f'`{ref}`' for ref in item['evidence_refs'])}",
            ]
        )
        for item in report["blockers"]
    )
    agent_rows = "\n".join(
        f"| `{step['agent_name']}` | `{step['agno_step_id']}` | `{step['skill_path']}` | `{step['skill_hash']}` | {step['readiness']} | {step['model_invocation']['provider']} | {step['model_invocation']['model']} | `{step['model_invocation']['prompt_id']}` | `{step['model_invocation']['prompt_hash']}` |"
        for step in report["agent_steps"]
    )
    evidence_rows = "\n".join(
        f"- `{row['agent_name']}` / `{row['evidence_id']}` -> `{row.get('source_path') or row.get('command')}`"
        for row in report["evidence_index"]
    )
    return f"""# Play Store 上架准备报告

Run ID: `{report['run_id']}`

本报告由 8-agent Agno launch-readiness workflow 生成。当前 run 要求所有 agent 调用 AI 模型；如果模型不可用，run 不可验收。即使 A3 成立，本报告也不代表 Play Store production readiness。

## 总状态
- Readiness: {report['readiness']}
- Agno maturity: {report['agno']['maturity']}
- Agno orchestration: {report['agno']['orchestration_mode']}
- can_submit_google_play: false
- safe_to_strengthen_final_store_claims: false
- 结论：当前只能进入 owner/Pro review，不能用于提交、上线或对外声称商店结论。

## 已确认事实
{facts}

## 已有材料
{materials}

## 缺失材料
{missing}

## 人工必须补充项
{blockers}

## 每个 Agent 的摘要
| Agent | Agno Step | Skill Path | Skill Hash | 状态 | Provider | Model | Prompt ID | Prompt Hash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
{agent_rows}

## Evidence 索引
{evidence_rows}
"""


def render_human_review(report: dict[str, Any]) -> str:
    items = "\n".join(
        "\n".join(
            [
                f"## {item['agent_name']} / `{item['claim_id']}`",
                f"- 当前状态：{item['status']}",
                f"- 原因：{item['reason']}",
                f"- 影响：{item['impact']}",
                f"- 解除方式：{item['unblock_action']}",
                f"- evidence：{', '.join(f'`{ref}`' for ref in item['evidence_refs'])}",
            ]
        )
        for item in report["blockers"]
    )
    return f"""# Human Review

Run ID: `{report['run_id']}`

以下项目需要 owner/Pro/dev 人工补充或确认。未解除前，workflow 保持 fail-closed，`can_submit_google_play=false`。

{items}
"""


def finalize_launch_readiness_workflow(context: LaunchReadinessRunContext) -> dict[str, Any]:
    all_model_ok = all(context.model_results)
    report = build_report(
        context.run_id,
        context.run_dir.relative_to(context.root),
        context.steps,
        context.all_evidence,
        all_model_ok,
        context.config.provider if context.config else None,
    )
    status = "completed" if all_model_ok else "blocked_model_unavailable"
    output_paths = {
        "run": (context.run_dir / "run.json").relative_to(context.root).as_posix(),
        "launch_readiness_markdown": (context.run_dir / "launch-readiness.zh.md").relative_to(context.root).as_posix(),
        "launch_readiness_json": (context.run_dir / "launch-readiness.json").relative_to(context.root).as_posix(),
        "evidence_ledger": (context.run_dir / "evidence-ledger.jsonl").relative_to(context.root).as_posix(),
        "human_review": (context.run_dir / "human-review.md").relative_to(context.root).as_posix(),
        "agno_step_ledger": (context.run_dir / "agno-step-ledger.jsonl").relative_to(context.root).as_posix(),
    }
    run = {
        "schema_version": RUN_SCHEMA,
        "run_id": context.run_id,
        "mode": "launch-readiness",
        "root": ".",
        "branch": context.branch,
        "commit": context.commit,
        "started_at": context.started_at,
        "finished_at": utc_now(),
        "runner_command": context.runner_command,
        "status": status,
        "readiness": report["readiness"],
        "agno": report["agno"],
        "agent_steps": [
            {
                "agent_name": step["agent_name"],
                "step_index": step["step_index"],
                "agno_step_id": step["agno_step_id"],
                "agno_step_name": step["agno_step_name"],
                "upstream_agno_step_ids": step.get("upstream_agno_step_ids", []),
                "skill_path": step["skill_path"],
                "skill_hash": step["skill_hash"],
                "skill_hash_algorithm": step["skill_hash_algorithm"],
                "agent_status": step["agent_status"],
                "readiness": step["readiness"],
                "output_paths": step["output_paths"],
                "model_invocation": step["model_invocation"],
            }
            for step in context.steps
        ],
        "output_paths": output_paths,
        "safety": {
            "play_console_api_called": False,
            "credentials_used": False,
            "can_submit_google_play": False,
            "safe_to_strengthen_final_store_claims": False,
        },
    }
    write_json(context.run_dir / "run.json", run)
    write_json(context.run_dir / "launch-readiness.json", report)
    write_jsonl(context.run_dir / "evidence-ledger.jsonl", context.all_evidence)
    write_jsonl(context.run_dir / "agno-step-ledger.jsonl", context.agno_step_ledger)
    write_text(context.run_dir / "launch-readiness.zh.md", render_report(report))
    write_text(context.run_dir / "human-review.md", render_human_review(report))
    return run


def run_launch_readiness_workflow(
    *,
    root: Path,
    run_id: str,
    branch: str,
    commit: str,
    runner_command: str,
    started_at: str,
) -> dict[str, Any]:
    context = prepare_launch_readiness_context(
        root=root,
        run_id=run_id,
        branch=branch,
        commit=commit,
        runner_command=runner_command,
        started_at=started_at,
    )
    for index, agent_name in enumerate(AGENTS, start=1):
        run_launch_readiness_agent_step(context, agent_name=agent_name, step_index=index)
    return finalize_launch_readiness_workflow(context)
