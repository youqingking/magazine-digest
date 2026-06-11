# Runtime Command Runbook

## Purpose

Give Codex agents a short, exact checklist for running no-credential content/runtime validation without accidentally committing generated fixture churn.

## Before Running

1. Confirm the goal allows the command class in `docs/harness/COMMAND_SAFETY_MATRIX.md`.
2. Run `git status --short` and record any pre-existing changes.
3. Prefer `npm.cmd` on Windows PowerShell.
4. Use a Worktree for broad generated-output-mutating commands unless the goal is docs-only and the restore path is clear.
5. Do not run credential-required or unsafe-without-human commands without a recorded human owner and prerequisite decision.

## Safe Goal Validation Sequence

Use this sequence for command-safety docs validation:

```powershell
python scripts/agent_tools/validate_command_safety_matrix.py .
npm.cmd run validate:test-inputs
npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix
git status --short
```

If `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` mutates generated files, restore them before completion:

```powershell
git restore -- mobile/fixtures/runtime/current output/test-input-pack/reports/current-scenario.json
git status --short
```

If `npm.cmd run validate:test-inputs` mutates its generated report and that report is tracked, restore it before completion:

```powershell
git restore -- output/test-input-pack/reports/validation-report.json
git status --short
```

After restoring generated output, `npm.cmd run validate:preflight` may be run on clean `main` as a post-merge gate. It must still fail on `main` or `master` if validation left worktree changes behind.

## Exact Command Forms

| Intent | Preferred command | Notes |
| --- | --- | --- |
| Validate command-safety docs | `python scripts/agent_tools/validate_command_safety_matrix.py .` | Local docs-only validator. |
| Validate synthetic content package | `npm.cmd run validate:test-inputs` | Writes validation report under `output/test-input-pack/reports`. |
| Build synthetic test pack reports | `npm.cmd run build:test-inputs` | Writes generated build/source reports. |
| Export all runtime scenarios | `npm.cmd run export:runtime-scenarios` | Rewrites generated runtime bundles. Prefer Worktree. |
| Select runtime scenario through npm wrapper | `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | PowerShell wrapper requires `-ScenarioId`; do not use npm `-- --scenario-id` form. |
| Select runtime scenario directly through Node | `node scripts/content/select-runtime-scenario.mjs --scenario-id s01_normal_full_matrix` | Direct Node form is valid but bypasses the package script wrapper. |
| Smoke synthetic test pack | `npm.cmd run smoke:test-inputs` | Broad generated-output mutation; avoid for docs-only validation unless needed. |
| Export legacy mobile root fixtures | `npm.cmd run export:mobile-fixtures` | Source-adjacent generated churn; use Worktree. |
| Post-merge preflight | `npm.cmd run validate:preflight` | Run only after generated outputs have been restored; clean `main`/`master` passes, dirty protected branches fail. |

## After Running

1. Read the command exit code and output.
2. Run `git status --short`.
3. Compare changed paths against `docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md`.
4. Restore generated outputs that the goal does not explicitly intend to commit.
5. Run `git status --short` again.
6. Report changed docs/tooling files separately from generated files touched and restored.

## Rollback Recipes

Restore validation report only:

```powershell
git restore -- output/test-input-pack/reports/validation-report.json
```

Restore selected current scenario:

```powershell
git restore -- mobile/fixtures/runtime/current output/test-input-pack/reports/current-scenario.json
```

Restore full runtime scenario export:

```powershell
git restore -- output/test-input-pack mobile/fixtures/runtime/scenarios
```

Restore legacy mobile fixture export:

```powershell
git restore -- mobile/fixtures/runtime output/stage-e0
```

For untracked generated files, do not use blanket recursive deletes. First inspect:

```powershell
git status --short
```

Then remove only confirmed generated paths with explicit `Remove-Item -LiteralPath <path>` commands.

## Stop Conditions

Stop and report `NEED_HUMAN` when:

- The same command class fails three times.
- A command asks for cloud, admin, push, store, or production credentials.
- A command mutates `fixtures/test-inputs/**` unexpectedly.
- A command touches app source behavior, Expo config, dependencies, schema, auth, payment, push, or production config.
- HBuilderX, Android, browser, or shell prerequisites are unavailable for a platform-specific validation goal.
