# Mobile Runtime Foundation Merge Decision

## Recommendation

Recommendation: MERGE `codex/expo-shell-foundation@55478976061c5b6ecd83346f29733f7fbedcaa3c`.

The previous HOLD condition was the `npm.cmd ci` package-lock mismatch. The repaired foundation commit was retested in a fresh gate worktree, and `npm.cmd ci` now exits 0. The dependency-backed TypeScript and Expo start smoke checks also pass.

This recommendation covers only the no-credential mobile runtime foundation. It does not authorize real Supabase connection work, applied migrations, RevenueCat setup, push setup, production config, external content pipeline work, or generated fixture/source churn.

No applied Supabase migration is authorized by this MERGE recommendation.

## Decision Rationale

The foundation PR is still an appropriate merge unit because the Expo shell, fixture runtime reader, shared runtime data ports, fail-closed Supabase seam, draft-only Supabase contracts, and no-credential validation docs rely on each other to define the runtime boundary.

The lockfile repair removes the concrete merge blocker found by the prior gate. Current validation shows:

- `npm.cmd ci` passed and materialized dependencies from the committed lockfile.
- Foundation, mobile shell, dependency workflow, runtime data port, and Supabase runtime contract validators passed.
- TypeScript, fixture smoke, and Expo start smoke passed.
- Generated outputs touched by validation were restored.
- No real credentials, applied migrations, production config, or service SDK connection were introduced by this gate.

## Validation Evidence

| Gate | Result |
| --- | --- |
| `npm.cmd ci` | Passed; previous missing `expo-linking` lockfile error did not reproduce. |
| `python scripts/agent_tools/validate_mobile_runtime_foundation_pr.py .` | Passed. |
| `python scripts/agent_tools/validate_mobile_runtime_shell.py .` | Passed. |
| `python scripts/agent_tools/validate_mobile_dependency_workflow.py .` | Passed. |
| `python scripts/agent_tools/validate_runtime_data_port.py .` | Passed. |
| `python scripts/agent_tools/validate_supabase_runtime_contract.py .` | Passed. |
| `npm.cmd run validate:test-inputs` | Passed; generated validation report restored. |
| `npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix` | Passed; generated selected runtime fixture and report restored. |
| `npm.cmd --prefix apps/mobile run typecheck` | Passed. |
| `npm.cmd --prefix apps/mobile run smoke:fixture` | Passed; Supabase seam fails closed with `reason=missing_env`. |
| `npm.cmd --prefix apps/mobile run start:smoke` | Passed; Expo reported `http://localhost:19001`. |
| `npm.cmd run validate:preflight` | Passed. |

Final gate-local checks are recorded in `docs/release/STACKED_PR_INTEGRATION_GATE.md` after docs/tooling edits.

## Required Human Checks

- Accept or reject the Expo 55 canary dependency pins before production build work.
- Review npm peer override warnings and 31 moderate audit vulnerabilities reported by `npm.cmd ci`.
- Confirm Expo/EAS owner, slug, `projectId`, `ios.bundleIdentifier`, and `android.package` ownership before EAS build or submit work.
- Confirm `git status --short` shows no generated-output churn before merge.
- Confirm no real Supabase URL, anon key, service-role secret, project id, CLI project config, RevenueCat key, push credential, product price, quota, free limit, subscription benefit, or production endpoint is committed.
- Confirm `docs/NEED_HUMAN.md` still blocks Supabase org/project, secret ownership, auth mapping, migration application, service-role writer ownership, RevenueCat sync, push ownership, and local RLS harness ownership.

## Package-lock / Expo Canary Risk

The repaired `package-lock.json` is now installable with `npm.cmd ci`.

Remaining risks:

- Expo canary versions are still pinned and should not be upgraded or downgraded inside this merge decision.
- npm peer warnings are expected for the current Expo canary graph but should be accepted by reviewers.
- npm audit reported moderate vulnerabilities; this gate did not run `npm audit fix` because that would be dependency-change work outside scope.
- Future dependency changes must use npm workflow commands and keep root `package-lock.json`, root `package.json`, and `apps/mobile/package.json` aligned.

## Generated-output Hygiene

Generated outputs touched during validation were restored:

- `output/test-input-pack/reports/validation-report.json`
- `mobile/fixtures/runtime/current/**`
- `output/test-input-pack/reports/current-scenario.json`

No generated output should be committed as part of the foundation merge or this gate.

## No-credential Proof Status

Current proof status is sufficient for MERGE:

- Fixture mode remains the default runtime source.
- Explicit Supabase mode fails closed with missing env and does not fall back to fixtures.
- The Supabase seam reports no live connection behavior.
- No Supabase SDK dependency is added by the foundation.
- Supabase SQL remains draft-only or reviewed-candidate-only, not applied migration SQL.
- Validators check for credential patterns and applied migration paths without contacting Supabase.

## Hold Conditions

Return the foundation to HOLD if any of these appear before merge:

- `npm.cmd ci` fails again on a clean checkout.
- Dependency-backed mobile checks fail for reasons other than local tool availability.
- `git status --short` includes generated-output churn or changes outside the intended foundation scope.
- A real credential, production endpoint, Supabase project config, RevenueCat key, push credential, or applied migration appears.
- Reviewers reject the Expo canary pins or npm audit warning profile.

## Split Conditions

SPLIT is not recommended based on this rerun.

Split only if reviewers want the docs/tooling governance layer separated from the runtime shell. Do not split by moving Supabase reviewed candidates into the foundation; candidates remain dependent review material.
