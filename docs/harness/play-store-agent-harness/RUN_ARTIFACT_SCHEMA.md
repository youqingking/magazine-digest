# Run Artifact Schema

The run artifact schema defines the future wrapper around input, output,
evidence, approval, validation, and Agno step artifacts.

## Required Run Fields

- `schema_version`
- `run_id`
- `branch`
- `commit`
- `agent_ids`
- `harness_maturity`
- `agent_maturity`
- `agno_status`
- `input_contract`
- `output_contract`
- `evidence_ledger`
- `human_approval_gate`
- `agno_step_artifacts`
- `validation_results`
- `failure_modes`
- `owner_decisions_needed`

## Minimal JSON Shape

```json
{
  "schema_version": "play_store_agent_run_artifact.v1",
  "run_id": "local-dry-run-YYYYMMDD-HHMMSS",
  "branch": "codex/play-store-agent-harness-mvp-m1",
  "commit": "914f0ce",
  "agent_ids": [],
  "harness_maturity": "H1",
  "agent_maturity": "L2",
  "agno_status": "dry_run_only",
  "input_contract": "docs/harness/play-store-agent-harness/INPUT_CONTRACT.md",
  "output_contract": "docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md",
  "evidence_ledger": "docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md",
  "human_approval_gate": "docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md",
  "agno_step_artifacts": [],
  "validation_results": [],
  "failure_modes": [],
  "owner_decisions_needed": []
}
```

## Maturity Guard

- `H1` is the target for M1 docs.
- `H2` requires validators plus per-agent plugin specs.
- `H3` requires real Agno run artifacts, evidence ledger instances, and readiness report.
- `H4` requires a later automation decision.
- M0 `dry_run_only` may be represented as L2 Agno-ready.
- M0 `dry_run_only` must not be represented as `L3`.

## L3-A Run Artifact Extension

Owner approval for L3-A adds a repo-owned Agno run wrapper. L3-A run artifacts
use schema `play_store_agno_l3_run.v1` and are written under:

```text
artifacts/agno/play-store/l3/<run_id>/run.json
```

Required L3-A run fields:

- `schema_version`
- `run_id`
- `execution_mode`: must be `real_agno_orchestration`.
- `agno_status`: must be `real_run`.
- `runner_command`
- `dependency_lock_ref`
- `dependency_pin`
- `branch`
- `commit`
- `started_at`
- `finished_at`
- `workflow_provenance`
- `step_order`
- `step_artifacts`
- `validation_results`
- `readiness_color`
- `blocked_reasons`
- `human_approval_summary`
- `safety`
- `next_allowed_action`

The L3-A run artifact must not set readiness to `GREEN` while unresolved human
approval gates remain. It must also record safety booleans proving no Play
Console API, Google Play submission, real credentials, production action, or C5
action was executed.
