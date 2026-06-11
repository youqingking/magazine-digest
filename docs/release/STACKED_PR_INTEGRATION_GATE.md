# Stacked PR Integration Gate

## Scope

This rerun is a docs/tooling-only validation gate for the mobile runtime foundation stack after the Expo lockfile repair in `codex/expo-shell-foundation@55478976061c5b6ecd83346f29733f7fbedcaa3c`.

It does not add app features, change mobile runtime behavior, add dependencies, connect Supabase, apply migrations, add credentials, change production config, change RevenueCat or push setup, mutate fixture source data, or commit generated runtime outputs.

## Branch Relationship

| Branch | Role | Rerun evidence |
| --- | --- | --- |
| `codex/expo-shell-foundation` | Base mobile runtime foundation PR. | Head is `55478976061c5b6ecd83346f29733f7fbedcaa3c`, commit message `fix mobile expo lockfile reproducibility`. |
| `codex/pr-stack-integration-gate-rerun` | This gate branch. | Created from `5547897` in `D:/Projects/daowei2026/magazine-digest-worktrees/pr-stack-integration-gate-rerun`. |
| `codex/supabase-migration-review` | Dependent Supabase review PR. | Head is `e28613509019deb12538ee8b47eb345cf333836f`; current merge-base with foundation is older commit `406ccf014d210cbfc7c451569463433bf7f58957`. |

Additional stack evidence:

- `git diff --name-status 406ccf014d210cbfc7c451569463433bf7f58957 codex/supabase-migration-review` shows only `docs/NEED_HUMAN.md`, `docs/supabase/**`, `infra/supabase/reviewed-candidates/**`, and `scripts/agent_tools/validate_supabase_migration_review.py`.
- `git diff --name-status codex/expo-shell-foundation...codex/supabase-migration-review` shows the same review-only dependent diff.
- `git merge-tree --write-tree codex/expo-shell-foundation codex/supabase-migration-review` exited 0 and produced tree `005dbad4f44c3ae654ad26e6032007e890e33057`.
- `git diff --name-status codex/expo-shell-foundation 005dbad4f44c3ae654ad26e6032007e890e33057` shows only the dependent review docs/candidates/validator and does not change `apps/mobile/package.json` or `package-lock.json`.

## Recommended PR Order

1. Foundation PR: move `codex/expo-shell-foundation@5547897` from HOLD to MERGE if reviewers accept the no-credential evidence, Expo canary pins, and npm audit warning profile.
2. Dependent Supabase review PR: keep `codex/supabase-migration-review` targeting `codex/expo-shell-foundation` until the foundation is merged.
3. After foundation merges to `main`, retarget or rebase the Supabase review PR onto `main` so its visible diff remains limited to review docs, reviewed candidates, and its validator.
4. Open a separate human-approved Supabase implementation goal before moving any candidate SQL into an applied migration path or running Supabase CLI commands that need credentials.

## Supabase Review Target

`codex/supabase-migration-review` should still target `codex/expo-shell-foundation` until the foundation merges.

The branch is not currently descended from the repaired foundation commit `5547897`, but the dependent PR's own diff remains review-only and a virtual merge with the repaired foundation is clean. This means the dependency remains valid, while the branch should be refreshed before final review if the PR UI shows stale branch relationship or endpoint diffs.

## Validation Summary

Validation ran on 2026-06-07 in `codex/pr-stack-integration-gate-rerun` unless noted.

| Command | Status | Evidence |
| --- | --- | --- |
| `npm.cmd ci` | Passed | Exit 0; installed 663 packages and audited 676 packages. Previous missing `expo-linking` lockfile blocker did not reproduce. npm reported Expo canary peer warnings and 31 moderate audit vulnerabilities. |
| `python scripts/agent_tools/validate_mobile_runtime_foundation_pr.py .` | Passed | `MOBILE_RUNTIME_FOUNDATION_PR_VALIDATION_PASSED`; checked 21 files, 4 existing validators, and 3 applied migration dirs. |
| `python scripts/agent_tools/validate_mobile_runtime_shell.py .` | Passed | `MOBILE_RUNTIME_SHELL_VALIDATION_PASSED`; checked 12 files. |
| `python scripts/agent_tools/validate_mobile_dependency_workflow.py .` | Passed | `MOBILE_DEPENDENCY_WORKFLOW_VALIDATION_PASSED`; mobile scripts include `typecheck`, `smoke:fixture`, and `start:smoke`. |
| `python scripts/agent_tools/validate_runtime_data_port.py .` | Passed | `RUNTIME_DATA_PORT_VALIDATION_PASSED`; checked 7 files. |
| `python scripts/agent_tools/validate_supabase_runtime_contract.py .` | Passed | `SUPABASE_RUNTIME_CONTRACT_VALIDATION_PASSED`; checked 8 files and 10 tables. |
| `python scripts/agent_tools/validate_supabase_migration_review.py .` | Passed on `codex/supabase-migration-review@e286135` | Validator is not present on the foundation gate branch; on the dependent branch it reported `SUPABASE_MIGRATION_REVIEW_VALIDATION_PASSED`, checked 8 files and 10 tables. |
| `npm.cmd run validate:test-inputs` | Passed | Exit 0; summary reported 20 scenarios, 38 markdown files, 3 publications, 25 articles. It changed `output/test-input-pack/reports/validation-report.json`, which was restored. |
| `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | Passed | Exit 0; selected `s01_normal_full_matrix`. It changed generated `mobile/fixtures/runtime/current/**` and `output/test-input-pack/reports/current-scenario.json`, which were restored. |
| `npm.cmd --prefix apps/mobile run typecheck` | Passed | `tsc --noEmit` exited 0. |
| `npm.cmd --prefix apps/mobile run smoke:fixture` | Passed | `MOBILE_FIXTURE_READER_SMOKE_PASSED`; current scenario `data2_multi_publication_release_candidate`, `s01_normal_full_matrix`, and Supabase `unavailable reason=missing_env` were verified. |
| `npm.cmd --prefix apps/mobile run start:smoke` | Passed | `MOBILE_EXPO_START_SMOKE_PASSED`; `expo_url=http://localhost:19001`, `fixture_scenario=s01_normal_full_matrix`. |
| `npm.cmd run validate:preflight` | Passed | `missing_count=0`, `passed=true`; no credentialed Supabase action. |

Final checks must also pass after these docs/tooling changes:

- `python scripts/agent_tools/validate_pr_stack_integration_gate.py .`
- `git diff --check`
- `git status --short`

## Generated Outputs Touched And Restored

| Command | Generated paths touched | Restore action |
| --- | --- | --- |
| `npm.cmd run validate:test-inputs` | `output/test-input-pack/reports/validation-report.json` | Restored with `git restore -- output/test-input-pack/reports/validation-report.json`. |
| `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | `mobile/fixtures/runtime/current/**`, `output/test-input-pack/reports/current-scenario.json` | Restored with `git restore -- mobile/fixtures/runtime/current output/test-input-pack/reports/current-scenario.json`. |

No generated output is intended for commit in this gate.

## Merge Risks

- Expo 55 canary pins remain an intentional review risk. Accepting or changing the canary set should be a human review decision or a later dependency goal.
- `npm.cmd ci` now passes, but npm reported peer override warnings around Expo canary packages and 31 moderate audit vulnerabilities.
- `package-lock.json` must remain aligned with root `package.json` and `apps/mobile/package.json`; do not hand-edit the lockfile.
- Generated-output hygiene remains fragile for `output/test-input-pack/**` and `mobile/fixtures/runtime/**`.
- No real Supabase URL, anon key, service-role secret, RevenueCat key, push credential, EAS production ownership, or production endpoint is validated by this gate.
- Supabase drafts and reviewed candidates remain non-production review material, not applied migration SQL.
- `product_key` context, premium body exposure, notification read/archive mutation, public-safe change-log payload, and local RLS harness ownership remain human decisions for the dependent Supabase review.

## Rollback Plan

If this gate is rejected:

1. Drop only `docs/release/**` and `scripts/agent_tools/validate_pr_stack_integration_gate.py` changes from `codex/pr-stack-integration-gate-rerun`.
2. Leave `codex/expo-shell-foundation` runtime files and dependency lockfile unchanged unless reviewers reject the foundation itself.
3. Do not copy reviewed candidates into migrations as rollback work.
4. Restore any generated output churn before changing branch state.
5. Keep `codex/supabase-migration-review` paused or targeted to `codex/expo-shell-foundation` until the foundation is on `main`.

## Reviewer Checklist

- Confirm the gate branch changes only release docs and agent tooling.
- Confirm `npm.cmd ci` passed on `codex/expo-shell-foundation@5547897`.
- Confirm no dependency files changed in this gate.
- Confirm no generated output remains in `git status --short`.
- Confirm no applied migration SQL exists under `infra/supabase/migrations/**`, `infra/supabase/applied/**`, or `supabase/migrations/**`.
- Confirm `.env.example` files contain no real Supabase, RevenueCat, push, or production credentials.
- Confirm the Supabase review branch remains docs/review/candidate-only and does not alter the repaired Expo lockfile when virtually merged with foundation.
- Confirm `docs/NEED_HUMAN.md` still blocks real Supabase org/project, secret ownership, auth mapping, migration application, RevenueCat sync, push ownership, and local RLS harness decisions.

## Explicit Non-Goals

- No feature work in `apps/mobile/**` or `packages/core-runtime/**`.
- No real Supabase project, credentials, CLI link, remote command, applied migration, auth provider, storage bucket, edge function, or production config.
- No RevenueCat setup, entitlement grant, pricing, quota, free limit, subscription benefit, or service sync.
- No push credential setup, Expo Push token registration, FCM/APNs setup, or notification delivery provider.
- No external content pipeline work: no PDF parsing, web scraping, prompt generation, markdown generation, package production, or scheduler work.
- No generated runtime output, fixture source data edit, or legacy `mobile/`, `uniCloud/`, or `admin/` behavior change.
