# Agno Step Protocol

This protocol is L2 Agno-ready only. It describes how an Agno step artifact must
look in a future run, but M1 does not add Agno dependency or L3 runtime adoption.

## Current Agno Boundary

- M0 Agno status: `dry_run_only`
- Current allowed level: L2 Agno-ready
- Current disallowed level: `L3`
- No Agno dependency is approved in M1.
- No real Agno workflow run is approved in M1.

## Step Artifact Schema

Required Agno step artifact fields:

- `schema_version`
- `run_id`
- `step_id`
- `agent_id`
- `input_contract_ref`
- `output_contract_ref`
- `evidence_ledger_ref`
- `claim_ids`
- `claim_classes`
- `human_approval_gate_ref`
- `validation_results`
- `agno_status`
- `maturity_level`
- `next_allowed_action`
- `blocked_reason`

## Minimal JSON Shape

```json
{
  "schema_version": "play_store_agno_step_artifact.v1",
  "run_id": "local-dry-run-YYYYMMDD-HHMMSS",
  "step_id": "step.google_play_listing",
  "agent_id": "google-play-listing",
  "input_contract_ref": "docs/harness/play-store-agent-harness/INPUT_CONTRACT.md",
  "output_contract_ref": "docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md",
  "evidence_ledger_ref": "docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md",
  "claim_ids": [],
  "claim_classes": ["C0", "C1", "C2", "C3", "C4", "C5"],
  "human_approval_gate_ref": "docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md",
  "validation_results": [],
  "agno_status": "dry_run_only",
  "maturity_level": "L2",
  "next_allowed_action": "owner_review",
  "blocked_reason": "No Agno runtime adoption is approved."
}
```

## Protocol Rules

- A step artifact may be described by schema in M1.
- A real step artifact requires future owner approval and a runtime thread.
- `dry_run_only` must not be labeled as `L3`.
- `C3`, `C4`, and `C5` step claims must carry a human approval gate ref.

## L3-A Provenance Extension

Owner approval for L3-A adds a separate repo-owned runtime layer while
preserving the dry-run boundary for older M2/M4 artifacts.

L3-A step artifacts use schema `play_store_agno_l3_step_artifact.v1` and must
include these provenance fields:

- `execution_mode`: must be `real_agno_orchestration`.
- `agno_status`: must be `real_run`.
- `generated_by_runner`: must be true.
- `runtime_provenance.runner`
- `runtime_provenance.dependency_lock_ref`
- `runtime_provenance.agno_package`
- `runtime_provenance.agno_version`
- `runtime_provenance.workflow_module`
- `input_refs`
- `output_refs`
- `evidence_refs`
- `validator_command`
- `validator_exit_code`
- `started_at`
- `finished_at`
- `duration_ms`
- `exit_code`
- `blocked_reason`

Valid L3-A step maturity values are `L3` and `L3-with-blockers`. A step may be
`L3-with-blockers` when the Agno step really executed but store readiness,
privacy, legal, screenshot, credential, or owner-review blockers remain open.

Older artifacts with `agno_status: dry_run_only` remain L2 and are not allowed
to claim L3 maturity.
