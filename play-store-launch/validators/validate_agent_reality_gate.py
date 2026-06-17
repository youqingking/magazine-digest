#!/usr/bin/env python3
"""Validate Play Store agent reality-gate audit documents.

This validator intentionally proves that the reality gate exists and currently
fails closed. It must not be used to claim the existing eight agents are
reality-proven.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)


REQUIRED_FILES = (
    "docs/agents/PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md",
    "docs/agents/PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md",
    "docs/harness/play-store-agent-harness/REALITY_GATE.md",
    "docs/harness/play-store-agent-harness/CROSS_PRD_PROOF_PROTOCOL.md",
    "docs/harness/play-store-agent-harness/AGNO_REAL_RUN_STANDARD.md",
    "docs/harness/play-store-agent-harness/PER_AGENT_TRUTH_TABLE.md",
    "scripts/agent_tools/validate_agent_reality_gate.py",
)

AGENT_IDS = (
    "release-build-agent",
    "privacy-disclosure-prep",
    "google-play-listing",
    "screenshot-storyboard",
    "launch-info-collector",
    "google-data-safety-agent",
    "screenshot-capture-agent",
    "launch-package-agent",
)

AUDIT_TERMS = (
    "当前结论：不可以安全强化代理输出",
    "哪些输出是通用的",
    "哪些主张缺乏证据",
    "哪些验证者是浅层的",
    "哪些代理缺少下游使用",
    "Agno 是否实际运行过",
    "是否存在对比性的产品需求文档",
    "Reality Gate 当前状态：FAIL",
)

REALITY_GATE_TERMS = (
    "Reality Gate 当前状态：FAIL",
    "R3a",
    "R3b",
    "真实杂志摘要",
    "product_key",
    "禁止把字段存在当作现实完成",
    "Generic Output 检测",
    "M0 决策：阻断强化",
)

CROSS_PRD_TERMS = (
    "PRD-A",
    "PRD-B",
    "泄漏检测",
    "差异矩阵",
    "负例",
    "通过条件",
    "失败条件",
    "当前仓库判定",
)

AGNO_TERMS = (
    "当前 Agno 分类：A2 deterministic workflow wrapper",
    "A2",
    "A3",
    "A4",
    "deterministic workflow wrapper",
    "model-backed agent",
    "不能证明 Agno Agent/Team/model-backed reasoning",
)

TRUTH_TABLE_TERMS = (
    "当前八个 Play Store 代理都不能被标记为 reality passed",
    "当前不可以安全强化代理输出",
    "A2 wrapper step only",
)

PRO_REVIEW_TERMS = (
    "Review Scope",
    "Files Included",
    "docs/agents/PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md",
    "Manifest Mapping",
    "Explicit Non-Inclusions",
    "Pro Review Questions",
    "Validation Evidence",
    "safe_to_strengthen_agent_outputs=false",
    "accept_fail_closed_gate",
)

FORBIDDEN_UNBOUNDED_SUCCESS = (
    "Reality Gate 当前状态：PASS",
    "当前结论：可以安全强化代理输出",
    "跨 PRD 已通过",
    "Agno 已证明八代理真实可靠",
    "Agno L3 证明可泛化",
)

NEGATING_MARKERS = (
    "不",
    "未",
    "没有",
    "不得",
    "不能",
    "禁止",
    "禁用",
    "只要",
    "除非",
    "当前状态：未运行",
    "forbidden",
    "cannot",
    "must not",
    "not ",
)


def read_text(root: Path, relative: str, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def require_terms(text: str, terms: tuple[str, ...], source: str, errors: list[str]) -> None:
    for term in terms:
        if term not in text:
            errors.append(f"{source} missing required term: {term}")


def validate_required_files(root: Path, errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        path = root / relative
        if not path.is_file():
            errors.append(f"missing required file: {relative}")
        elif path.stat().st_size == 0:
            errors.append(f"required file is empty: {relative}")


def validate_agent_coverage(text: str, source: str, errors: list[str]) -> None:
    for agent_id in AGENT_IDS:
        if agent_id not in text:
            errors.append(f"{source} missing agent id: {agent_id}")


def validate_no_unbounded_success(all_docs: dict[str, str], errors: list[str]) -> None:
    for relative, text in all_docs.items():
        for line_number, line in enumerate(text.splitlines(), start=1):
            for phrase in FORBIDDEN_UNBOUNDED_SUCCESS:
                if phrase not in line:
                    continue
                if any(marker in line for marker in NEGATING_MARKERS):
                    continue
                errors.append(f"{relative}:{line_number} contains unbounded success claim: {phrase}")


def validate_truth_table(text: str, errors: list[str]) -> None:
    rows = [line for line in text.splitlines() if line.startswith("| `")]
    for agent_id in AGENT_IDS:
        matching = [row for row in rows if f"`{agent_id}`" in row]
        if len(matching) != 1:
            errors.append(f"PER_AGENT_TRUTH_TABLE.md expected exactly one table row for {agent_id}")
            continue
        row = matching[0]
        if "FAIL" not in row:
            errors.append(f"PER_AGENT_TRUTH_TABLE.md row for {agent_id} must fail closed")
        if "A2 wrapper step only" not in row:
            errors.append(f"PER_AGENT_TRUTH_TABLE.md row for {agent_id} must classify Agno evidence as A2 only")


def validate_current_agno_classifier(root: Path, agno_doc: str, errors: list[str]) -> None:
    runner_paths = (
        root / "play-store-launch/workflow/run_play_store_agno_workflow.py",
        root / "scripts/agent_tools/run_play_store_agno_workflow.py",
    )
    adapter_paths = (
        root / "play-store-launch/workflow/play_store_agno_adapters.py",
        root / "scripts/agent_tools/play_store_agno_adapters.py",
    )
    for runner in runner_paths:
        if not runner.is_file():
            continue
        runner_text = runner.read_text(encoding="utf-8")
        if "Workflow(" in runner_text and "run_all_adapters" in runner_text:
            if "当前 Agno 分类：A2 deterministic workflow wrapper" not in agno_doc:
                errors.append("AGNO_REAL_RUN_STANDARD.md must classify current Workflow + adapters as A2")
            break
    for adapters in adapter_paths:
        if not adapters.is_file():
            continue
        adapter_text = adapters.read_text(encoding="utf-8")
        if re.search(r"run_agent_adapter|run_all_adapters", adapter_text):
            if "A2 不能声明" not in agno_doc:
                errors.append("AGNO_REAL_RUN_STANDARD.md must list what A2 cannot claim")
            break


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    validate_required_files(root, errors)

    audit = read_text(root, "docs/agents/PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md", errors)
    pro_review = read_text(root, "docs/agents/PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md", errors)
    reality = read_text(root, "docs/harness/play-store-agent-harness/REALITY_GATE.md", errors)
    cross_prd = read_text(root, "docs/harness/play-store-agent-harness/CROSS_PRD_PROOF_PROTOCOL.md", errors)
    agno = read_text(root, "docs/harness/play-store-agent-harness/AGNO_REAL_RUN_STANDARD.md", errors)
    truth = read_text(root, "docs/harness/play-store-agent-harness/PER_AGENT_TRUTH_TABLE.md", errors)

    require_terms(audit, AUDIT_TERMS, "PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md", errors)
    require_terms(pro_review, PRO_REVIEW_TERMS, "PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md", errors)
    require_terms(reality, REALITY_GATE_TERMS, "REALITY_GATE.md", errors)
    require_terms(cross_prd, CROSS_PRD_TERMS, "CROSS_PRD_PROOF_PROTOCOL.md", errors)
    require_terms(agno, AGNO_TERMS, "AGNO_REAL_RUN_STANDARD.md", errors)
    require_terms(truth, TRUTH_TABLE_TERMS, "PER_AGENT_TRUTH_TABLE.md", errors)

    validate_agent_coverage(audit, "PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md", errors)
    validate_agent_coverage(truth, "PER_AGENT_TRUTH_TABLE.md", errors)
    validate_truth_table(truth, errors)
    validate_current_agno_classifier(root, agno, errors)
    validate_no_unbounded_success(
        {
            "PLAY_STORE_AGENT_REALITY_GAP_AUDIT.md": audit,
            "PLAY_STORE_AGENT_REALITY_GATE_PRO_REVIEW.md": pro_review,
            "REALITY_GATE.md": reality,
            "CROSS_PRD_PROOF_PROTOCOL.md": cross_prd,
            "AGNO_REAL_RUN_STANDARD.md": agno,
            "PER_AGENT_TRUTH_TABLE.md": truth,
        },
        errors,
    )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Play Store agent reality gate docs.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)
    if errors:
        print("PLAY_STORE_AGENT_REALITY_GATE_VALIDATION_FAILED")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PLAY_STORE_AGENT_REALITY_GATE_VALIDATION_PASSED")
    print("status=pass")
    print("reality_gate_current_status=FAIL_CLOSED")
    print("safe_to_strengthen_agent_outputs=false")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print(f"checked_agents={len(AGENT_IDS)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
