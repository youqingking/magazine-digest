# Input Contract

Every Play Store agent run must declare a common input object before producing
any claim or output artifact.

## Required Fields

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `schema_version` | string | yes | Must be `play_store_agent_input.v1`. |
| `agent_id` | string | yes | Stable agent name. |
| `run_id` | string | yes | Unique local dry-run id. |
| `repo_root` | string | yes | Local repo root used by validators. |
| `branch` | string | yes | Branch name or `detached_head`. |
| `commit` | string | yes | Short or full git commit. |
| `allowed_paths` | array | yes | Paths the run may read or write. |
| `forbidden_paths` | array | yes | Paths the run must not touch. |
| `required_sources` | array | yes | Repo files or commands the agent must inspect. |
| `owner_decisions` | array | yes | Owner constraints for the run. |
| `agno_status` | string | yes | Must preserve M0 status, currently `dry_run_only`. |
| `target_harness_maturity` | string | yes | M1 target is `H1`. |
| `target_agent_maturity` | string | yes | Current route allows `L2`, not `L3`. |

## Minimal JSON Shape

```json
{
  "schema_version": "play_store_agent_input.v1",
  "agent_id": "google-play-listing",
  "run_id": "local-dry-run-YYYYMMDD-HHMMSS",
  "repo_root": ".",
  "branch": "codex/play-store-agent-harness-mvp-m1",
  "commit": "914f0ce",
  "allowed_paths": [
    "docs/harness/play-store-agent-harness/**",
    "docs/agents/**",
    "docs/agno/**",
    "scripts/agent_tools/**",
    "evals/agents/**",
    "codex_prompts/**"
  ],
  "forbidden_paths": [
    "apps/mobile/**",
    "packages/core-runtime/**",
    "package.json",
    "package-lock.json",
    "production config",
    "applied migrations",
    "fixture source data",
    "real service credentials"
  ],
  "required_sources": [],
  "owner_decisions": [],
  "agno_status": "dry_run_only",
  "target_harness_maturity": "H1",
  "target_agent_maturity": "L2"
}
```

## Input Rules

- Inputs must be explicit before a claim is made.
- Inputs must include the repo position used for validation.
- Inputs must include M0 Agno status.
- Inputs must not silently promote `dry_run_only` to `L3`.
- Missing owner decisions must be represented as `needs_human` or `blocked`.
