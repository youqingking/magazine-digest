# Command Safety Matrix

## Purpose

Freeze the no-credential safety profile for content and runtime fixture commands before Expo shell work begins. This matrix is documentation-only; it does not authorize app source, Expo config, dependency, schema, auth, payment, push, production config, or fixture source changes.

## Safety Classes

| Class | Meaning | Codex Goal default |
| --- | --- | --- |
| read-only | Reads repo state or fixture source without writing files. | Safe when prerequisites exist. |
| report-mutating | Writes validation or diagnostic reports only. | Safe when report churn is expected and reviewed. |
| generated-output-mutating | Regenerates files under generated output paths. | Safe only with before/after `git status` and restore unless the goal intends to commit generated output. |
| source-adjacent | Writes generated files inside legacy app/runtime fixture areas where generated and app-consumed files sit close together. | Prefer Worktree; restore unless explicitly committed by a fixture refresh goal. |
| source-mutating | Writes app, admin, backend, contract, fixture source, or registry source paths. | Requires explicit implementation goal and usually Worktree. |
| credential-required | Requires cloud, admin, push, store, or production secrets/accounts. | Requires `NEED_HUMAN`; do not run as no-credential validation. |
| platform-specific | Requires Windows PowerShell, HBuilderX, Android tooling, browser tooling, or shell-specific behavior. | Run only on the matching platform with prerequisites confirmed. |
| unsafe-without-human | Can affect cloud state, production-like state, desktop/device workflows, or source behavior without enough local guarantees. | Do not run without human confirmation and recorded owner/prereqs. |

## Content And Runtime Commands

| npm script | Exact Windows / PowerShell form | Classes | Expected touched paths | Rollback / restore | Codex Goal validation |
| --- | --- | --- | --- | --- | --- |
| `validate:test-inputs` | `npm.cmd run validate:test-inputs` | report-mutating, platform-specific | `output/test-input-pack/reports/validation-report.json` | `git restore -- output/test-input-pack/reports/validation-report.json` when tracked and not intended; remove untracked report only after confirming path. | Safe no-credential validation. Check status before and after. |
| `build:test-inputs` | `npm.cmd run build:test-inputs` | generated-output-mutating, platform-specific | `output/test-input-pack/reports/source-index.json`, `output/test-input-pack/reports/build-report.json`; ensures generated dirs exist. | `git restore -- output/test-input-pack/reports/source-index.json output/test-input-pack/reports/build-report.json`; remove untracked generated report files only after path confirmation. | Safe in Codex Goal validation only when generated churn is restored. |
| `export:runtime-scenarios` | `npm.cmd run export:runtime-scenarios` | generated-output-mutating, platform-specific | Everything from `build:test-inputs`, plus `output/test-input-pack/runtime/*.bundle.json`, `output/test-input-pack/reports/export-report.json`, `mobile/fixtures/runtime/scenarios/*.bundle.json`. | `git restore -- output/test-input-pack mobile/fixtures/runtime/scenarios`; remove untracked generated bundles only after reviewing `git status --short`. | Use Worktree or restore generated files before completion unless goal explicitly commits regenerated fixtures. |
| `select:runtime-scenario` | `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | generated-output-mutating, platform-specific | `mobile/fixtures/runtime/current/**`, `output/test-input-pack/reports/current-scenario.json`. Requires existing `mobile/fixtures/runtime/scenarios/<scenario>.bundle.json`. | Restore selected projection and report: `git restore -- mobile/fixtures/runtime/current output/test-input-pack/reports/current-scenario.json`; if untracked files appear, inspect before removal. | Safe no-credential validation only with the PowerShell `-ScenarioId` form and post-run restore. |
| `smoke:test-inputs` | `npm.cmd run smoke:test-inputs` | generated-output-mutating, platform-specific | Runs export, selects `s01_normal_full_matrix`, `s02_general_fallback`, then `s03_teen_unavailable`; writes scenario bundles, current projection, export/build reports, and `output/test-input-pack/reports/smoke-test-input-pack.json`. | Restore `output/test-input-pack` and `mobile/fixtures/runtime/scenarios`; restore `mobile/fixtures/runtime/current` to the pre-run scenario. | Use Worktree for broad smoke. Avoid as routine validation unless mutation is acceptable and restorable. |
| `export:mobile-fixtures` | `npm.cmd run export:mobile-fixtures` | generated-output-mutating, source-adjacent, platform-specific | Root mobile fixture files under `mobile/fixtures/runtime/*.json`, `mobile/fixtures/runtime/index.js`, plus `output/stage-e0/mobile-runtime-fixtures.*.json`. | `git restore -- mobile/fixtures/runtime output/stage-e0`; inspect untracked files before removal. | Not preferred for Goal validation. Use Worktree because it rewrites legacy mobile fixture surfaces outside the scenario/current generated set. |
| direct Node selector | `node scripts/content/select-runtime-scenario.mjs --scenario-id s01_normal_full_matrix` | generated-output-mutating | Same as `select:runtime-scenario`. | Same as `select:runtime-scenario`. | Allowed only when bypassing npm is intentional; docs should teach the npm PowerShell wrapper form first. |
| direct content validator | `node scripts/content/validate-synthetic-test-pack.mjs` | report-mutating | `output/test-input-pack/reports/validation-report.json`. | Same as `validate:test-inputs`. | Safe when Node exists; npm wrapper is preferred for consistency. |

## Related Harness And Legacy Commands

| npm script | Exact Windows / PowerShell form | Classes | Expected touched paths | Rollback / restore | Codex Goal validation |
| --- | --- | --- | --- | --- | --- |
| `preflight` | `npm.cmd run preflight` | read-only to report-like console output, platform-specific | No committed file expected from `scripts/harness/preflight.ps1`; reads git, tools, env presence. | No restore expected. | Safe for local readiness checks. Missing env/tool output may create `NEED_HUMAN` records in docs-only threads. |
| `validate:preflight` | `npm.cmd run validate:preflight` | read-only console output, platform-specific | No committed file expected. | No restore expected. | Safe when PowerShell exists. Clean `main`/`master` is allowed for post-merge validation; protected branches with worktree changes fail. |
| `validate:preflight:sh` | `npm run validate:preflight:sh` | read-only console output, platform-specific | No committed file expected. | No restore expected. | Use only on POSIX shell environments. Clean `main`/`master` is allowed for post-merge validation; protected branches with worktree changes fail. |
| `verify` | `npm.cmd run verify` | report-mutating, source-risk validation, platform-specific | May run contract validators and write reports depending on stage scripts. | Review `git status --short`; restore generated reports only when not intended. | Not a content/runtime default; run only when the goal is harness-wide verification. |
| `smoke` and `smoke:stage-*` | `npm.cmd run smoke:stage-h0` style | generated-output-mutating or platform-specific depending on stage | Usually writes under `output/stage-*`; some checks read legacy app/backend/admin paths. | Restore `output/stage-*` if tracked; inspect untracked reports. | Use only with a stage-specific goal. Several legacy stages need HBuilderX/browser/device context. |
| `build:mobile` | `npm.cmd run build:mobile` | report-mutating, platform-specific, unsafe-without-human for real compile | `output/stage-e1/mobile-build-report.json` and related readiness reports. Reads HBuilderX paths. | Restore generated reports if tracked. | Requires human/tool confirmation for real HBuilderX compile; no-credential agents may only treat as readiness evidence. |
| `build:admin` / `generate-admin` | `npm.cmd run build:admin`; `npm.cmd run generate-admin` | source-mutating, platform-specific | Generated admin resources/registries. | Use only in Worktree and restore or commit intentionally. | Not safe for this command-safety goal. |
| `build:backend` | `npm.cmd run build:backend` | source or generated-output mutating depending backend CLI, platform-specific | Backend CLI output. | Worktree required; inspect diff. | Not safe for no-credential content/runtime validation. |
| `sync:unicloud-database` | `npm.cmd run sync:unicloud-database` | credential-required, source/cloud-risk, unsafe-without-human | May touch `uniCloud/database/**` and/or require service context. | Human-owned rollback. | Do not run without explicit human confirmation and credential owner. |
| `smoke:h0_5-h5`, `smoke:h0_5-hbuilderx`, `smoke:h0_5-android`, `smoke:h0_5-android-ui` | `npm.cmd run smoke:h0_5-h5` etc. | platform-specific, credential/tool-dependent, unsafe-without-human when device/cloud/browser state is required | `output/stage-h0_5-*` reports; may require HBuilderX, Android, H5/browser prerequisites. | Restore generated reports if tracked. | Defer to a dedicated legacy/device validation goal with recorded prerequisites. |

## Git Status Rules

Before any generated-output-mutating command:

1. Run `git status --short`.
2. Confirm the worktree has no unrelated changes, or record them as pre-existing.
3. Prefer a Worktree when the command touches `mobile/fixtures/runtime/**`, `output/test-input-pack/**`, or legacy `output/stage-*` broadly.

After any generated-output-mutating command:

1. Run `git status --short`.
2. Confirm changed paths match the matrix.
3. Restore generated outputs unless the goal explicitly intends to commit them.
4. Run `git status --short` again and record remaining changes.

## NEED_HUMAN Triggers

Record or preserve a `NEED_HUMAN` item when a command requires:

- Real cloud credentials or service spaces.
- HBuilderX desktop compile proof.
- Android device/emulator, push, store, or production service state.
- A decision to commit generated mobile fixture churn.
- A decision to mutate source fixtures under `fixtures/test-inputs/**`.
