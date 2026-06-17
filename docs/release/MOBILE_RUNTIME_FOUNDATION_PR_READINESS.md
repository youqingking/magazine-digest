# Mobile Runtime Foundation PR Readiness

## Scope Summary

This PR unit freezes the no-credential mobile runtime foundation as a reviewable Expo-first starting point. It covers the fixture-backed Expo shell, npm workspace dependency workflow, shared runtime data ports, fail-closed Supabase seam, and draft-only Supabase schema/RLS contracts.

The foundation is ready for human PR review only when fixture mode works, explicit Supabase mode fails closed without env, validation commands pass or are accurately classified, generated outputs are restored after validation, and Supabase drafts remain unapplied.

## Changed Subsystems

| Subsystem | Current PR role | Review focus |
| --- | --- | --- |
| `apps/mobile` | Expo Router fixture shell with home, article, and debug routes. | No live credentials, no production config, fixture source remains default. |
| `packages/core-runtime` | Runtime fixture reader, runtime data ports, fixture adapter, and placeholder service seams. | `product_key` propagation, fail-closed unavailable states, no SDK connection. |
| `docs/mobile` | Mobile runtime shell, dependency workflow, Supabase env contract, and no-credential smoke matrix. | Command accuracy, generated-output restore rules, explicit non-goals. |
| `docs/architecture` | Runtime boundary, Supabase runtime data boundary, schema contract, RLS contract, and draft handoff. | Draft-only status, product scoping, service-role-only write boundary. |
| `infra/supabase/drafts` | Draft SQL for schema and RLS review only. | Must not be applied, renamed into migrations, or connected to a real project in this PR. |
| `scripts/agent_tools` | Local validators for PR readiness and existing foundation contracts. | No network, no credentials, no generated-output writes except requested npm checks. |

## Validation Matrix

Run from the worktree root on Windows PowerShell:

| Gate | Command | Expected result | Mutation profile |
| --- | --- | --- | --- |
| PR readiness meta-gate | `python scripts/agent_tools/validate_mobile_runtime_foundation_pr.py .` | `MOBILE_RUNTIME_FOUNDATION_PR_VALIDATION_PASSED` | Read-only. |
| Mobile runtime shell | `python scripts/agent_tools/validate_mobile_runtime_shell.py .` | `MOBILE_RUNTIME_SHELL_VALIDATION_PASSED` | Read-only. |
| Mobile dependency workflow | `python scripts/agent_tools/validate_mobile_dependency_workflow.py .` | `MOBILE_DEPENDENCY_WORKFLOW_VALIDATION_PASSED` | Read-only. |
| Runtime data ports | `python scripts/agent_tools/validate_runtime_data_port.py .` | `RUNTIME_DATA_PORT_VALIDATION_PASSED` | Read-only. |
| Supabase runtime contract | `python scripts/agent_tools/validate_supabase_runtime_contract.py .` | `SUPABASE_RUNTIME_CONTRACT_VALIDATION_PASSED` | Read-only. |
| Mobile typecheck | `npm.cmd --prefix apps/mobile run typecheck` | TypeScript exits 0. | Read-only. |
| Fixture reader smoke | `npm.cmd --prefix apps/mobile run smoke:fixture` | Fixture reader exits 0 with ready view model evidence. | Read-only. |
| Expo start smoke | `npm.cmd --prefix apps/mobile run start:smoke` | Expo starts, reports localhost URL or Metro status, then shuts down. | May create local cache only; no committed output expected. |
| Synthetic fixture validation | `npm.cmd run validate:test-inputs` | Exits 0. | Report-mutating; restore `output/test-input-pack/reports/validation-report.json` unless intentionally committed. |
| Harness preflight validation | `npm.cmd run validate:preflight` | Exits 0 or accurately reports local tool/env blockers. | Read-only console output. |
| Whitespace check | `git diff --check` | Exits 0. | Read-only. |
| Status check | `git status --short` | Only intended docs/tooling changes remain, with generated outputs restored. | Read-only. |

## Merge Risks

- The branch introduces a new npm workspace shell and depends on root `package-lock.json` staying aligned with `apps/mobile/package.json`.
- Expo 55 canary dependency pins are intentionally frozen for the shell; a future Expo upgrade should be a separate goal.
- The mobile shell imports generated fixture bundles from legacy-adjacent `mobile/fixtures/runtime/**`; validation must not commit generated fixture churn.
- Supabase SQL exists under `infra/supabase/drafts/**` for review only. Treating it as an applied migration would bypass human project/auth/RLS decisions.
- `apps/mobile/app.json` remains local shell config only. EAS owner, project id, bundle identifiers, package identifiers, and production service endpoints are intentionally absent.
- The current Supabase seam has `connects: false`. Reviewers should not expect live data until a later implementation thread adds a read-only adapter after human approval.

## Rollback Notes

Rollback is docs/tooling-first:

1. Remove this PR unit's docs and validator if the review gate is rejected.
2. Keep fixture-generated outputs restored with the recipes in `docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md`.
3. Do not apply or partially apply `infra/supabase/drafts/*.sql` as rollback work.
4. If the Expo shell itself must be backed out, remove the `apps/mobile` and `packages/core-runtime` foundation changes in a dedicated revert so legacy reference paths stay untouched.
5. If validation mutated generated reports, restore them with `git restore -- output/test-input-pack/reports/validation-report.json` before reverting docs or tooling.

## Reviewer Checklist

- Confirm the validation matrix was run and reported with command exit status.
- Confirm `git status --short` has no generated output churn from `mobile/fixtures/runtime/**` or `output/test-input-pack/**`.
- Confirm no real `.env` credentials, Supabase URL, anon key, service-role secret, RevenueCat key, push credential, or production config was committed.
- Confirm no files exist under applied Supabase migration paths such as `infra/supabase/migrations/**`.
- Confirm all app runtime paths preserve `product_key` and the fixture source remains the default.
- Confirm `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` is documented as fail-closed when env is missing and does not fall back to fixtures.
- Confirm Supabase schema and RLS drafts remain in `infra/supabase/drafts/**` and are not claimed as production-ready.
- Confirm `docs/NEED_HUMAN.md` still records Supabase project, secret, auth, migration, RevenueCat, push, and EAS ownership blockers.

## Explicit Non-Goals

- No real Supabase project connection, credentials, SDK dependency, applied migration, auth provider, or production config.
- No RevenueCat project mapping, SDK setup, entitlement grants, prices, quotas, free limits, or subscription benefits.
- No push credential setup, Expo Push token registration, FCM/APNs setup, or notification provider delivery.
- No external content pipeline work: no PDF parsing, web scraping, prompt generation, markdown production, package production, or scheduling.
- No fixture source data edits and no generated runtime output committed as final PR changes.
- No legacy `mobile/`, `uniCloud/`, or `admin/` behavior changes except read-only migration reference.
