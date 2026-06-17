#!/usr/bin/env python3
"""Validate the Play Store Agent Harness M1 substrate."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)


HARNESS_DIR = "docs/harness/play-store-agent-harness"

REQUIRED_FILES = (
    f"{HARNESS_DIR}/README.md",
    f"{HARNESS_DIR}/INPUT_CONTRACT.md",
    f"{HARNESS_DIR}/OUTPUT_CONTRACT.md",
    f"{HARNESS_DIR}/EVIDENCE_LEDGER.md",
    f"{HARNESS_DIR}/CLAIM_CLASSIFICATION.md",
    f"{HARNESS_DIR}/HUMAN_APPROVAL_GATE.md",
    f"{HARNESS_DIR}/VALIDATION_MATRIX.md",
    f"{HARNESS_DIR}/AGNO_STEP_PROTOCOL.md",
    f"{HARNESS_DIR}/RUN_ARTIFACT_SCHEMA.md",
    f"{HARNESS_DIR}/EVAL_PROTOCOL.md",
    f"{HARNESS_DIR}/FAILURE_MODES.md",
    f"{HARNESS_DIR}/AGENT_PLUGIN_SPEC.md",
    "scripts/agent_tools/validate_play_store_agent_harness.py",
    "docs/agents/PLAY_STORE_AGENT_MVP_GAP_AUDIT.md",
    "docs/agno/AGNO_RUNTIME_CHECK.md",
)

CLAIM_STATUS_ENUM = (
    "observed_in_repo",
    "inferred",
    "missing",
    "blocked",
    "needs_human",
    "not_applicable",
)

CLAIM_CLASSES = ("C0", "C1", "C2", "C3", "C4", "C5")

FORBIDDEN_CONCLUSION_TERMS = (
    "final",
    "approved",
    "submitted",
    "complete",
    "production_ready",
)

OUTPUT_REQUIRED_FIELDS = (
    "value",
    "source",
    "status",
    "confidence",
    "claim_class",
    "human_review_required",
)

EVIDENCE_LEDGER_FIELDS = (
    "evidence_id",
    "source_type",
    "source_ref",
    "observed_value",
    "status",
    "collected_by",
    "collected_at",
    "validator",
    "limitations",
    "product_key_scope",
    "human_review_required",
)

AGNO_STEP_FIELDS = (
    "schema_version",
    "run_id",
    "step_id",
    "agent_id",
    "input_contract_ref",
    "output_contract_ref",
    "evidence_ledger_ref",
    "claim_ids",
    "claim_classes",
    "human_approval_gate_ref",
    "validation_results",
    "agno_status",
    "maturity_level",
    "next_allowed_action",
    "blocked_reason",
)

RUN_ARTIFACT_FIELDS = (
    "schema_version",
    "run_id",
    "branch",
    "commit",
    "agent_ids",
    "harness_maturity",
    "agent_maturity",
    "agno_status",
    "input_contract",
    "output_contract",
    "evidence_ledger",
    "human_approval_gate",
    "agno_step_artifacts",
    "validation_results",
    "failure_modes",
    "owner_decisions_needed",
)

EVAL_FIELDS = (
    "eval_id",
    "agent_id",
    "input_contract_fixture",
    "expected_claims",
    "expected_evidence",
    "expected_human_gates",
    "forbidden_actions",
    "validator_commands",
    "expected_result",
)

OLD_FOUR_AGENTS = (
    "release-build-agent",
    "privacy-disclosure-prep",
    "google-play-listing",
    "screenshot-storyboard",
)

REMAINING_FOUR_AGENTS = (
    "launch-info-collector",
    "google-data-safety-agent",
    "screenshot-capture-agent",
    "launch-package-agent",
)

ALL_AGENT_IDS = OLD_FOUR_AGENTS + REMAINING_FOUR_AGENTS

PLUGIN_REQUIRED_FIELDS = (
    "agent_id",
    "implementation_status",
    "current_maturity",
    "target_maturity",
    "implementation_milestone",
    "actual_outputs_present",
    "validator_present",
    "agno_step_artifact_present",
    "allowed_inputs",
    "forbidden_inputs",
    "evidence_requirements",
    "human_gate_rules",
    "forbidden_actions",
    "readiness_blockers",
    "output_schema_ref",
    "expected_claim_classes",
)

FORBIDDEN_CONTEXT_MARKERS = (
    "forbidden",
    "must not",
    "not ",
    "does not",
    "do not",
    "no ",
    "without",
    "disallowed",
    "blocked",
    "negative",
    "warning",
    "human-review",
    "human review",
    "needs_human",
    "human_review_required",
    "guard",
    "guardrail",
    "allowed usage",
    "forbidden-term",
    "unapproved",
    "example",
    "term",
    "terms",
)


def read_text(root: Path, relative: str, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def require_files(root: Path, errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        if not (root / relative).is_file():
            errors.append(f"missing required file: {relative}")


def require_terms(text: str, terms: tuple[str, ...], source: str, errors: list[str]) -> None:
    for term in terms:
        if term not in text:
            errors.append(f"{source} missing required term: {term}")


def validate_claim_status_enum(root: Path, errors: list[str]) -> None:
    classification = read_text(root, f"{HARNESS_DIR}/CLAIM_CLASSIFICATION.md", errors)
    readme = read_text(root, f"{HARNESS_DIR}/README.md", errors)
    for source, text in (
        ("CLAIM_CLASSIFICATION.md", classification),
        ("README.md", readme),
    ):
        for status in CLAIM_STATUS_ENUM:
            if f"`{status}`" not in text:
                errors.append(f"{source} missing claim status enum value: {status}")


def validate_claim_classes(root: Path, errors: list[str]) -> None:
    classification = read_text(root, f"{HARNESS_DIR}/CLAIM_CLASSIFICATION.md", errors)
    for claim_class in CLAIM_CLASSES:
        if f"`{claim_class}`" not in classification:
            errors.append(f"CLAIM_CLASSIFICATION.md missing claim class: {claim_class}")

    required_rules = (
        "`C0` and `C1`: Codex may draft, but validator must check evidence.",
        "`C2`: Codex may draft, but Pro or owner human review is required.",
        "`C3` and `C4`: evidence draft only, must set `human_review_required=true`.",
        "`C5`: action is forbidden in this harness. Only blocker entries are allowed and must set `human_review_required=true`.",
    )
    require_terms(classification, required_rules, "CLAIM_CLASSIFICATION.md", errors)


def validate_output_contract(root: Path, errors: list[str]) -> None:
    output = read_text(root, f"{HARNESS_DIR}/OUTPUT_CONTRACT.md", errors)
    require_terms(output, tuple(f"`{field}`" for field in OUTPUT_REQUIRED_FIELDS), "OUTPUT_CONTRACT.md", errors)
    require_terms(
        output,
        (
            "`C3` and `C4` claims are evidence drafts only and must set `human_review_required=true`.",
            "`C5` claims must not execute actions. They may only list blockers and must set `human_review_required=true`.",
            "No output may promote M0 `dry_run_only` to `L3`.",
        ),
        "OUTPUT_CONTRACT.md",
        errors,
    )


def validate_evidence_ledger_schema(root: Path, errors: list[str]) -> None:
    ledger = read_text(root, f"{HARNESS_DIR}/EVIDENCE_LEDGER.md", errors)
    require_terms(ledger, tuple(f"`{field}`" for field in EVIDENCE_LEDGER_FIELDS), "EVIDENCE_LEDGER.md", errors)
    require_terms(
        ledger,
        (
            "play_store_evidence_ledger.v1",
            "`repo_file`",
            "`repo_command`",
            "`validator_result`",
            "`owner_decision`",
            "`m0_audit`",
            "`blocked_external_source`",
        ),
        "EVIDENCE_LEDGER.md",
        errors,
    )


def validate_human_approval_gate(root: Path, errors: list[str]) -> None:
    gate = read_text(root, f"{HARNESS_DIR}/HUMAN_APPROVAL_GATE.md", errors)
    required_gate_fields = (
        "approval_id",
        "claim_id",
        "claim_class",
        "required",
        "human_review_required",
        "owner_role",
        "status",
        "decision_ref",
        "expires_at",
        "limitations",
    )
    require_terms(gate, tuple(f"`{field}`" for field in required_gate_fields), "HUMAN_APPROVAL_GATE.md", errors)
    require_terms(
        gate,
        (
            "`C3`, `C4`, and `C5` must set `human_review_required=true`.",
            "`C5` may never execute inside this harness.",
            "Validator must fail if a `C3`, `C4`, or `C5` example omits `human_review_required=true`.",
        ),
        "HUMAN_APPROVAL_GATE.md",
        errors,
    )


def validate_agno_step_schema(root: Path, errors: list[str]) -> None:
    protocol = read_text(root, f"{HARNESS_DIR}/AGNO_STEP_PROTOCOL.md", errors)
    run_schema = read_text(root, f"{HARNESS_DIR}/RUN_ARTIFACT_SCHEMA.md", errors)
    require_terms(protocol, tuple(f"`{field}`" for field in AGNO_STEP_FIELDS), "AGNO_STEP_PROTOCOL.md", errors)
    require_terms(run_schema, tuple(f"`{field}`" for field in RUN_ARTIFACT_FIELDS), "RUN_ARTIFACT_SCHEMA.md", errors)
    require_terms(
        protocol,
        (
            "play_store_agno_step_artifact.v1",
            '"agno_status": "dry_run_only"',
            '"maturity_level": "L2"',
            "Current disallowed level: `L3`",
        ),
        "AGNO_STEP_PROTOCOL.md",
        errors,
    )
    require_terms(
        run_schema,
        (
            "play_store_agent_run_artifact.v1",
            '"harness_maturity": "H1"',
            '"agent_maturity": "L2"',
            '"agno_status": "dry_run_only"',
        ),
        "RUN_ARTIFACT_SCHEMA.md",
        errors,
    )


def validate_eval_protocol(root: Path, errors: list[str]) -> None:
    eval_doc = read_text(root, f"{HARNESS_DIR}/EVAL_PROTOCOL.md", errors)
    require_terms(eval_doc, tuple(f"`{field}`" for field in EVAL_FIELDS), "EVAL_PROTOCOL.md", errors)
    require_terms(
        eval_doc,
        (
            "Future evals must fail when evidence-bound claims have no evidence ledger entry.",
            "Future evals must fail when `C3`, `C4`, or `C5` omit human review.",
            "Future evals must fail when `dry_run_only` is claimed as `L3`.",
        ),
        "EVAL_PROTOCOL.md",
        errors,
    )


def validate_forbidden_terms(root: Path, errors: list[str]) -> None:
    classification = read_text(root, f"{HARNESS_DIR}/CLAIM_CLASSIFICATION.md", errors)
    readme = read_text(root, f"{HARNESS_DIR}/README.md", errors)
    for term in FORBIDDEN_CONCLUSION_TERMS:
        if f"`{term}`" not in classification:
            errors.append(f"CLAIM_CLASSIFICATION.md missing forbidden conclusion term: {term}")
        if f"`{term}`" not in readme:
            errors.append(f"README.md missing forbidden conclusion term: {term}")

    files_to_scan = [
        relative
        for relative in REQUIRED_FILES
        if relative.startswith(HARNESS_DIR)
    ]
    patterns = {
        term: re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
        for term in FORBIDDEN_CONCLUSION_TERMS
    }
    for relative in files_to_scan:
        text = read_text(root, relative, errors)
        boundary_section = False
        for line_number, line in enumerate(text.splitlines(), start=1):
            lowered = line.lower()
            if lowered.startswith("#"):
                boundary_section = any(marker in lowered for marker in FORBIDDEN_CONTEXT_MARKERS)
            for term, pattern in patterns.items():
                if not pattern.search(line):
                    continue
                if boundary_section or any(marker in lowered for marker in FORBIDDEN_CONTEXT_MARKERS):
                    continue
                errors.append(
                    f"{relative}:{line_number} has unguarded forbidden conclusion term "
                    f"{term!r}: {line.strip()}"
                )


def validate_dry_run_not_l3(root: Path, errors: list[str]) -> None:
    m0_agno = read_text(root, "docs/agno/AGNO_RUNTIME_CHECK.md", errors)
    protocol = read_text(root, f"{HARNESS_DIR}/AGNO_STEP_PROTOCOL.md", errors)
    run_schema = read_text(root, f"{HARNESS_DIR}/RUN_ARTIFACT_SCHEMA.md", errors)
    readme = read_text(root, f"{HARNESS_DIR}/README.md", errors)

    if "Agno status: `dry_run_only`" not in m0_agno:
        errors.append("docs/agno/AGNO_RUNTIME_CHECK.md must preserve M0 Agno status: dry_run_only")

    disallowed_promotions = (
        '"maturity_level": "L3"',
        '"agent_maturity": "L3"',
        "Agno status: `real_run_possible`",
        "real_run_possible",
    )
    for source, text in (
        ("AGNO_STEP_PROTOCOL.md", protocol),
        ("RUN_ARTIFACT_SCHEMA.md", run_schema),
        ("README.md", readme),
    ):
        for phrase in disallowed_promotions:
            if phrase in text:
                errors.append(f"{source} promotes dry_run_only beyond M1 boundary: {phrase}")

    require_terms(
        protocol + "\n" + run_schema + "\n" + readme,
        (
            "`dry_run_only`",
            "L2",
            "`L3`",
            "not allowed",
        ),
        "Agno dry-run boundary docs",
        errors,
    )


def validate_failure_modes(root: Path, errors: list[str]) -> None:
    failure_modes = read_text(root, f"{HARNESS_DIR}/FAILURE_MODES.md", errors)
    require_terms(
        failure_modes,
        (
            "`missing_required_file`",
            "`invalid_claim_status`",
            "`missing_evidence_binding`",
            "`human_gate_missing`",
            "`forbidden_action_requested`",
            "`forbidden_conclusion_word`",
            "`agno_runtime_not_approved`",
            "`credential_or_account_needed`",
            "`production_path_touched`",
            "`eval_protocol_missing`",
        ),
        "FAILURE_MODES.md",
        errors,
    )


def extract_agent_specs(plugin_spec: str, errors: list[str]) -> dict[str, str]:
    specs: dict[str, str] = {}
    for agent_id in ALL_AGENT_IDS:
        pattern = re.compile(
            rf"^## `{re.escape(agent_id)}`\s*\n\s*```yaml\s*\n(?P<body>.*?)\n```",
            re.MULTILINE | re.DOTALL,
        )
        match = pattern.search(plugin_spec)
        if not match:
            errors.append(f"AGENT_PLUGIN_SPEC.md missing agent spec block: {agent_id}")
            continue
        specs[agent_id] = match.group("body")
    return specs


def require_plugin_field(block: str, agent_id: str, field: str, errors: list[str]) -> None:
    if not re.search(rf"^{re.escape(field)}:", block, re.MULTILINE):
        errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing required field: {field}")


def require_plugin_value(block: str, agent_id: str, field: str, value: str, errors: list[str]) -> None:
    expected = f"{field}: {value}"
    if not re.search(rf"^{re.escape(expected)}$", block, re.MULTILINE):
        errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} expected {expected}")


def validate_agent_plugin_specs(root: Path, errors: list[str]) -> None:
    plugin_spec = read_text(root, f"{HARNESS_DIR}/AGENT_PLUGIN_SPEC.md", errors)
    require_terms(
        plugin_spec,
        (
            "These specs are adapter contracts only",
            "M2 hardens the old four agents to L2 evidence-bound outputs",
            "M4 implements the remaining four agents to L2 evidence-bound outputs.",
            "Current Agno status inherited from M0: `dry_run_only`.",
            "Current Agno boundary: L2 Agno-ready only, not `L3`.",
            "`C3`, `C4`, and `C5` claims must set `human_review_required=true`.",
        ),
        "AGENT_PLUGIN_SPEC.md",
        errors,
    )

    for agent_id in ALL_AGENT_IDS:
        if f"agent_id: {agent_id}" not in plugin_spec:
            errors.append(f"AGENT_PLUGIN_SPEC.md missing agent_id: {agent_id}")

    specs = extract_agent_specs(plugin_spec, errors)
    for agent_id, block in specs.items():
        for field in PLUGIN_REQUIRED_FIELDS:
            require_plugin_field(block, agent_id, field, errors)

        if not (
            "expected_outputs_human_readable:" in block
            or "required_outputs_human_readable:" in block
        ):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing human-readable output field")
        if not (
            "expected_outputs_machine_readable:" in block
            or "required_outputs_machine_readable:" in block
        ):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing machine-readable output field")
        if not ("validator_command:" in block or "future_validator_command:" in block):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing validator command field")
        if not ("eval_cases_ref:" in block or "future_eval_cases_ref:" in block):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing eval cases ref field")
        if not ("agno_step_adapter:" in block or "future_agno_step_adapter:" in block):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} missing Agno step adapter field")

    for agent_id in OLD_FOUR_AGENTS:
        block = specs.get(agent_id, "")
        require_plugin_value(block, agent_id, "implementation_status", "existing_needs_hardening", errors)
        require_plugin_value(block, agent_id, "current_maturity", "L2", errors)
        require_plugin_value(block, agent_id, "target_maturity", "L2", errors)
        require_plugin_value(block, agent_id, "implementation_milestone", "M2", errors)
        require_plugin_value(block, agent_id, "actual_outputs_present", "true", errors)
        require_plugin_value(block, agent_id, "validator_present", "true", errors)
        require_plugin_value(block, agent_id, "agno_step_artifact_present", "true", errors)

    for agent_id in REMAINING_FOUR_AGENTS:
        block = specs.get(agent_id, "")
        require_plugin_value(block, agent_id, "implementation_status", "implemented", errors)
        require_plugin_value(block, agent_id, "current_maturity", "L2", errors)
        require_plugin_value(block, agent_id, "target_maturity", "L2", errors)
        require_plugin_value(block, agent_id, "implementation_milestone", "M4", errors)
        require_plugin_value(block, agent_id, "actual_outputs_present", "true", errors)
        require_plugin_value(block, agent_id, "validator_present", "true", errors)
        require_plugin_value(block, agent_id, "agno_step_artifact_present", "true", errors)
        if re.search(r"^current_maturity: L3$", block, re.MULTILINE):
            errors.append(f"AGENT_PLUGIN_SPEC.md {agent_id} must not claim L3 while Agno is dry_run_only")

    screenshot_capture = specs.get("screenshot-capture-agent", "")
    require_terms(
        screenshot_capture,
        (
            "capture_status=blocked",
            "route, device, locale, and commit hash",
            "do not fabricate screenshots",
        ),
        "AGENT_PLUGIN_SPEC.md screenshot-capture-agent",
        errors,
    )

    launch_package = specs.get("launch-package-agent", "")
    require_terms(
        launch_package,
        (
            "readiness can only be GREEN, YELLOW, or RED",
            "do not package drafts as approved submission",
            "do not claim production_ready",
        ),
        "AGENT_PLUGIN_SPEC.md launch-package-agent",
        errors,
    )


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    require_files(root, errors)
    validate_claim_status_enum(root, errors)
    validate_claim_classes(root, errors)
    validate_output_contract(root, errors)
    validate_evidence_ledger_schema(root, errors)
    validate_human_approval_gate(root, errors)
    validate_agno_step_schema(root, errors)
    validate_eval_protocol(root, errors)
    validate_forbidden_terms(root, errors)
    validate_dry_run_not_l3(root, errors)
    validate_failure_modes(root, errors)
    validate_agent_plugin_specs(root, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Play Store Agent Harness M1 substrate.")
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = validate(root)

    if errors:
        print("PLAY_STORE_AGENT_HARNESS_VALIDATION_FAILED")
        print("校验结果：失败。M1 common substrate 仍有 blocker。")
        for error in errors:
            print(f"- fail: {error}")
        return 1

    print("PLAY_STORE_AGENT_HARNESS_VALIDATION_PASSED")
    print("校验结果：通过。M1 common substrate 文档和 validator 规则已落地。")
    print(f"- required_files: {len(REQUIRED_FILES)}")
    print("- claim_status_enum: pass")
    print("- forbidden_conclusion_terms: pass")
    print("- c3_c4_c5_human_review_required: pass")
    print("- evidence_ledger_schema: pass")
    print("- agno_step_artifact_schema: pass")
    print("- output_contract_claim_fields: pass")
    print("- m0_dry_run_only_not_l3: pass")
    print("- agent_plugin_specs_8_agents: pass")
    print("- remaining_agents_l2: pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
