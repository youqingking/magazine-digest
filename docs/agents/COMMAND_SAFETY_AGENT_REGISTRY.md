# Command Safety Agent Registry

## Purpose

Define the narrow ownership model for command safety, generated-output mutation, and no-credential runtime validation. This registry is documentation-only and does not authorize implementation changes.

## Command Safety Agent

| Field | Value |
| --- | --- |
| area | Content/runtime command classification |
| owner_role | Repo Bootstrap Agent + Migration Architect |
| status | active |
| primary_docs | `docs/harness/COMMAND_SAFETY_MATRIX.md`, `docs/runtime/RUNTIME_COMMAND_RUNBOOK.md` |
| source_evidence | `package.json`, `scripts/content/**`, `scripts/bootstrap/export-mobile-runtime-fixtures.*`, `scripts/harness/**`, `scripts/validate/**` |
| allowed_paths | `docs/runtime/**`, `docs/harness/**`, `docs/architecture/**`, `docs/agents/**`, `scripts/agent_tools/**`, `codex_prompts/**` |
| forbidden | Changing package scripts, app behavior, Expo config, dependencies, schema, auth, payment, push, production config, or fixture source data |

## Generated Output Steward

| Field | Value |
| --- | --- |
| area | Generated output mutation and rollback profile |
| owner_role | Runtime fixture contract maintainer |
| status | active |
| primary_docs | `docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md`, `docs/runtime/RUNTIME_FIXTURE_CONTRACT.md` |
| source_evidence | `scripts/content/synthetic-test-pack-lib.mjs`, `scripts/bootstrap/export-mobile-runtime-fixtures.mjs`, `mobile/fixtures/runtime/**`, `output/test-input-pack/**` |
| allowed_paths | `docs/runtime/**`, `docs/harness/**`, `scripts/agent_tools/**` |
| forbidden | Hand-authoring generated runtime output as final committed changes unless an explicit fixture refresh goal approves it |

## Credential Gatekeeper

| Field | Value |
| --- | --- |
| area | Commands needing human-owned accounts, credentials, desktop tools, or devices |
| owner_role | Human service/tool owner plus future implementation agent |
| status | blocked until explicit goal |
| primary_docs | `docs/NEED_HUMAN.md`, `docs/harness/COMMAND_SAFETY_MATRIX.md` |
| source_evidence | `scripts/harness/preflight.ps1`, `scripts/contracts/sync-unicloud-database.*`, `scripts/bootstrap/*hbuilderx*`, `scripts/bootstrap/*android*` |
| allowed_paths | No implementation paths in this docs-only freeze |
| forbidden | Running cloud sync, production-like, desktop compile, Android/device, push, subscription, or service commands as no-credential validation |

## Registry Rules

- Keep command safety docs aligned with executable wrappers in `package.json` and `scripts/**`.
- Teach the Windows PowerShell npm wrapper form for `select:runtime-scenario`: `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix`.
- Treat generated output mutations as validation evidence, not final source truth, unless a future fixture refresh goal explicitly says to commit them.
- Preserve `product_key` support across all content/runtime command docs.
- Escalate to `NEED_HUMAN` for credentials, desktop tools, Android/device validation, or decisions to mutate source fixtures.
