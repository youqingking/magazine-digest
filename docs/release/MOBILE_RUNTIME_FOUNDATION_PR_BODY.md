# No-Credential Mobile Runtime Foundation

## PR Head Strategy

Use `codex/expo-shell-foundation` as the PR head.

The final stacked gate evidence from `codex/pr-stack-integration-gate-rerun` has been recreated in this foundation branch instead of using the rerun branch as the PR head. This keeps the PR unit focused on the foundation while still carrying the final MERGE recommendation and dependent Supabase review plan.

Evidence copied into this branch:

- `docs/release/STACKED_PR_INTEGRATION_GATE.md`
- `docs/release/MOBILE_RUNTIME_FOUNDATION_MERGE_DECISION.md`
- `docs/release/SUPABASE_REVIEW_DEPENDENT_PR_PLAN.md`
- `scripts/agent_tools/validate_pr_stack_integration_gate.py`

## Scope Summary

This PR freezes the no-credential Expo-first mobile runtime foundation for human review. It includes the fixture-backed Expo Router shell, npm workspace dependency workflow, shared runtime data port seam, fail-closed Supabase runtime contract, draft-only Supabase schema/RLS handoff docs, and local validators that prove the boundary without credentials.

The merge recommendation is `MERGE` for `codex/expo-shell-foundation@5547897` plus the release-doc and agent-tooling evidence added here.

## Non-Goals

- No product feature work.
- No app runtime behavior changes beyond the existing foundation branch.
- No real Supabase project connection, credentials, CLI link, applied migration, SDK dependency, auth provider, storage, edge function, or production config.
- No RevenueCat setup, entitlement grants, prices, quotas, free limits, subscription benefits, or service sync.
- No push credential setup, Expo Push token registration, FCM/APNs setup, or notification delivery provider.
- No external content pipeline work: no PDF parsing, web scraping, prompt generation, markdown generation, package production, or scheduler work.
- No fixture source data edits and no generated runtime outputs committed as final changes.
- No legacy `mobile/`, `uniCloud/`, or `admin/` behavior changes.

## Validation Evidence

Final validation was run from the `codex/expo-shell-foundation` worktree after integrating the gate evidence:

| Command | Result |
| --- | --- |
| `npm.cmd ci` | Passed; installed 663 packages from the committed lockfile and audited 676 packages. npm reported the known Expo canary peer warning profile and 31 moderate audit vulnerabilities. |
| `python scripts/agent_tools/validate_pr_stack_integration_gate.py .` | Passed: `PR_STACK_INTEGRATION_GATE_VALIDATION_PASSED`. |
| `python scripts/agent_tools/validate_mobile_runtime_foundation_pr.py .` | Passed: `MOBILE_RUNTIME_FOUNDATION_PR_VALIDATION_PASSED`. |
| `python scripts/agent_tools/validate_mobile_runtime_shell.py .` | Passed: `MOBILE_RUNTIME_SHELL_VALIDATION_PASSED`. |
| `python scripts/agent_tools/validate_mobile_dependency_workflow.py .` | Passed: `MOBILE_DEPENDENCY_WORKFLOW_VALIDATION_PASSED`. |
| `python scripts/agent_tools/validate_runtime_data_port.py .` | Passed: `RUNTIME_DATA_PORT_VALIDATION_PASSED`. |
| `python scripts/agent_tools/validate_supabase_runtime_contract.py .` | Passed: `SUPABASE_RUNTIME_CONTRACT_VALIDATION_PASSED`. |
| `npm.cmd run validate:test-inputs` | Passed: 20 scenarios, 38 markdown files, 3 publications, and 25 articles. Generated validation report was restored. |
| `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | Passed: selected `s01_normal_full_matrix`. Generated selected runtime fixture/report was restored. |
| `npm.cmd --prefix apps/mobile run typecheck` | Passed: `tsc --noEmit` exited 0. |
| `npm.cmd --prefix apps/mobile run smoke:fixture` | Passed: `MOBILE_FIXTURE_READER_SMOKE_PASSED`; explicit Supabase mode reported `status=unavailable reason=missing_env`. |
| `npm.cmd --prefix apps/mobile run start:smoke` | Passed: `MOBILE_EXPO_START_SMOKE_PASSED`, `expo_url=http://localhost:19001`. |
| `npm.cmd run validate:preflight` | Passed: `missing_count=0`, `passed=true`. |
| `git diff --check` | Passed after final doc edits. |
| `git status --short` | Shows only the intended release docs and gate validator changes; no generated output churn. |

The prior gate rerun also recorded that these checks passed against `codex/expo-shell-foundation@5547897`, with `npm.cmd ci` fixing the earlier lockfile blocker.

## Generated-Output Restore Note

Some validation commands intentionally mutate generated outputs:

- `npm.cmd run validate:test-inputs` may update `output/test-input-pack/reports/validation-report.json`.
- `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` may update `mobile/fixtures/runtime/current/**` and `output/test-input-pack/reports/current-scenario.json`.

Restore those paths before merge unless a separate approved task intentionally commits regenerated output. No generated output is part of this PR package.

## Dependency And Lockfile Note

Root `package.json`, root `package-lock.json`, and `apps/mobile/package.json` must remain aligned. The foundation intentionally pins Expo 55 canary packages for the runtime shell. Do not hand-edit the lockfile, run `npm audit fix`, upgrade Expo, downgrade Expo, or change dependencies in this PR package.

Reviewers should explicitly accept or reject the Expo canary dependency profile, npm peer override warnings, and npm audit warning profile before production build work.

## Supabase Draft Warning

Supabase SQL in this PR is draft/review material only. Do not apply it, move it into `infra/supabase/migrations/**`, connect it to a real project, or treat it as production-ready.

The mobile Supabase seam remains no-credential and fail-closed. Missing Supabase env must not silently fall back to fixture data when explicit Supabase mode is requested.

## Dependent PR Note

`codex/supabase-migration-review` remains a dependent review PR and should target `codex/expo-shell-foundation` until the foundation merges. Its reviewed candidates are not migrations and must stay under review-only paths.

After the foundation merges to `main`, retarget or rebase the Supabase review PR onto `main`. If the PR UI requires exact ancestry before then, refresh the dependent branch with the foundation lockfile repair while keeping its visible diff review-only.

## Remaining NEED_HUMAN

- Confirm Expo/EAS owner, app slug, project id, `ios.bundleIdentifier`, and `android.package`.
- Confirm Supabase org/project, URL, anon or publishable key policy, service-role secret owner, auth settings, migration application policy, service writer owner, and local RLS harness owner.
- Confirm RevenueCat project/app mapping, entitlement IDs, offering IDs, product IDs, webhook secret owner, and Google Play credential sync owner.
- Confirm push credential ownership and Expo Push versus future direct FCM/APNs timing.
- Confirm Google Play Console app, testing track, app signing, service account, and package ownership.
- Confirm default local `product_key` for development without hardcoding production prices, quotas, subscription benefits, feature flags, experiments, operating thresholds, or risk thresholds.
- Confirm legacy `mobile/`, `uniCloud/`, and `admin/` retention or archive policy.
- Accept or reject Expo canary pins and npm audit warning profile before production build work.

## Reviewer Checklist

- Confirm this PR head is `codex/expo-shell-foundation`.
- Confirm the final MERGE evidence docs and `validate_pr_stack_integration_gate.py` are present.
- Confirm validation commands were rerun after the evidence docs were integrated.
- Confirm `git status --short` has no generated output churn from `mobile/fixtures/runtime/**` or `output/test-input-pack/**`.
- Confirm no real `.env` credentials, Supabase URL, anon key, service-role secret, RevenueCat key, push credential, production endpoint, price, quota, free limit, or subscription benefit was committed.
- Confirm no files exist under applied Supabase migration paths such as `infra/supabase/migrations/**`, `infra/supabase/applied/**`, or `supabase/migrations/**`.
- Confirm all app runtime paths preserve `product_key` and fixture source remains the default.
- Confirm explicit Supabase mode fails closed when env is missing.
- Confirm `codex/supabase-migration-review` remains docs/review/candidate-only.
- Confirm `docs/NEED_HUMAN.md` still records blockers for real Supabase, RevenueCat, push, EAS, Play Console, and local RLS harness work.

## Rollback Notes

If reviewers reject only the final gate package, revert the release docs and `scripts/agent_tools/validate_pr_stack_integration_gate.py` added from the gate rerun and keep the foundation runtime unchanged.

If reviewers reject the foundation itself, revert the foundation PR as a dedicated unit so legacy reference paths stay untouched. Do not apply Supabase drafts, copy reviewed candidates into migrations, run credentialed Supabase commands, or commit generated-output churn as rollback work.
