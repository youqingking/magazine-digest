# Play Store Launch Boundary

This directory is the boundary for the Play Store 8-agent + Agno launch-readiness workflow.

Recommended command:

```powershell
python scripts/agent_tools/run_play_store_agno_workflow.py --root . --mode launch-readiness
```

The command above is kept for compatibility. Its implementation is now delegated to the canonical workflow under `play-store-launch/`.

## Current Shape

- Phase 1 moved the Play Store workflow, shared runtime, and validators into `play-store-launch/`.
- Phase 2 adds skill-local bundled resources for each of the 8 agent skills.
- Phase 3 records each agent step's `skill_path` and SHA-256 `skill_hash` in current-run outputs.
- Phase 4 owns source schemas, artifact policy, and reference indexes inside `play-store-launch/`.
- Phase 5 adds a source-controlled reference catalog for Play Store audit, harness, Agno, and archive materials.
- Phase 6 makes `launch-readiness` an Agno-native 8-step sequential workflow, with one explicit Agno `Step` per Play Store agent.
- `scripts/agent_tools/` remains a compatibility wrapper layer for existing commands.
- App project docs remain evidence inputs only; they are not agent-owned source.

## Agno Orchestration Proof

The recommended command now runs `agno_native_8_step_pipeline`. Each run must create `artifacts/play-store-launch/<run-id>/agno-step-ledger.jsonl`, with exactly one row for each required agent step. The launch package step may only consume the first seven current-run step outputs.

Use the run validator for a concrete artifact:

```powershell
python scripts/agent_tools/validate_play_store_launch_readiness_run.py . --run-id <run-id>
```

## Canonical Owners

- Workflow entrypoints: `play-store-launch/workflow/`
- Shared runtime: `play-store-launch/shared/`
- Shared validators: `play-store-launch/validators/`
- Source schemas: `play-store-launch/schemas/`
- Artifact policy: `play-store-launch/artifacts/README.md`
- Reference index: `play-store-launch/references/README.md`
- Reference catalog: `play-store-launch/references/catalog.json`
- Boundary manifest: `play-store-launch/manifest.json`
- Skill entrypoints: `.agents/skills/<agent-name>/SKILL.md`
- Skill-local scripts: `.agents/skills/<agent-name>/scripts/`
- Skill-local references: `.agents/skills/<agent-name>/references/`

## Skill Resources

Each Play Store agent skill now owns only lightweight, skill-specific bundled resources:

- `.agents/skills/<agent-name>/scripts/validate.py`
- `.agents/skills/<agent-name>/references/boundary.md`

The skill-local validator is a thin entrypoint that delegates to the canonical validator in `play-store-launch/validators/`.

Do not copy shared model clients, evidence models, status rules, renderers, or workflow orchestration into individual skill directories. Keep those in `play-store-launch/shared/`, `play-store-launch/workflow/`, or `play-store-launch/validators/`.

## Boundary Rules

- Keep all 8 agent steps and the Agno workflow public shape.
- Keep standard skill discovery at `.agents/skills/<agent-name>/SKILL.md`.
- Keep app-owned evidence in `docs/launch/`, `docs/privacy/`, `docs/release/`, app config, and source files.
- Generated runtime artifacts are not committed by default.
- Historical M0/M1/M2/M4/L3 files remain audit/reference material, not the ordinary user entrypoint.
- Every current run step output must bind back to `.agents/skills/<agent-name>/SKILL.md` using `skill_path` and `skill_hash`.
- Every current run must copy the canonical Codex output schema from `play-store-launch/schemas/codex-agent-output.schema.json`.
- Every current run must prove Agno-native orchestration with `agno_native_8_step_pipeline` and `agno-step-ledger.jsonl`.
- Source validators must not depend on uncommitted runtime artifacts; validate a concrete run with `validate_play_store_launch_readiness_run.py --run-id <run-id>`.
- Historical Play Store audit, harness, Agno, and archive materials must be listed in `play-store-launch/references/catalog.json`.

## Explicit Non-Migration

These paths are intentionally not moved in Phase 2:

- `docs/agents/**`
- `docs/harness/**`
- `docs/agno/**`
- `docs/launch/**`
- `docs/privacy/**`
- `docs/release/**`
- `artifacts/**`
- `evals/agents/**`

## Reality Gate

Reality Gate remains `FAIL_CLOSED`.

This boundary does not claim Play Store production readiness, legal approval, privacy approval, store approval, or permission to submit to Google Play.
