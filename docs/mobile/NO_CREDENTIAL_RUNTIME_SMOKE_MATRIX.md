# No-Credential Runtime Smoke Matrix

## Purpose

Define the local smoke coverage required before reviewing the mobile runtime foundation PR. These checks prove fixture mode works, explicit Supabase mode fails closed without env, TypeScript compiles, Expo can start locally, and generated outputs are restored after validation.

## Fixture Mode

| Check | Command | Expected evidence | Notes |
| --- | --- | --- | --- |
| Default fixture source | `npm.cmd --prefix apps/mobile run smoke:fixture` | Ready fixture view model with `product_key`, scenario id, and article rows. | Reads generated runtime bundles only. |
| Scenario override | `EXPO_PUBLIC_RUNTIME_SCENARIO_ID=s01_normal_full_matrix npm.cmd --prefix apps/mobile run smoke:fixture` | Ready fixture view model for `s01_normal_full_matrix`. | Use PowerShell env assignment form when running manually on Windows. |
| Route compile coverage | `npm.cmd --prefix apps/mobile run typecheck` | TypeScript exits 0 across Expo Router files and shared runtime imports. | Read-only. |

Fixture mode must remain the default when `EXPO_PUBLIC_RUNTIME_DATA_SOURCE` is absent, empty, `fixture`, or an unknown value.

## Supabase Missing-Env Mode

| Check | How to exercise | Expected evidence |
| --- | --- | --- |
| Explicit Supabase source | Set `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase`. | Runtime source selection uses the Supabase seam. |
| Missing env failure | Leave `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_PRODUCT_KEY` empty. | Shell receives `unavailable`, `reason: missing_env`, and missing env names. |
| No fixture fallback | Keep fixture bundles present while Supabase mode is selected. | Supabase mode still reports unavailable instead of showing fixture articles. |
| No live connection | Inspect `packages/core-runtime/src/seams/supabase-seam.ts`. | `connects: false`; no Supabase client factory call, project URL, anon key, or service-role secret. |

This PR does not require a Supabase SDK, project, auth session, migration, or credential-bearing `.env` file.

## Typecheck

Run:

```powershell
npm.cmd --prefix apps/mobile run typecheck
```

Expected result: TypeScript exits 0. If this fails because dependencies are missing, classify as `environment_blocked` and run the documented npm workspace install command from `docs/mobile/MOBILE_DEPENDENCY_WORKFLOW.md` only when the goal permits dependency materialization.

## Smoke Fixture

Run:

```powershell
npm.cmd --prefix apps/mobile run smoke:fixture
```

Expected result: the script reads `mobile/fixtures/runtime/current/runtime.bundle.json` and `mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json`, then reports fixture readiness without connecting to Supabase, RevenueCat, push, EAS, or production services.

## Start Smoke

Run:

```powershell
npm.cmd --prefix apps/mobile run start:smoke
```

Expected result: the script starts Expo locally with `EXPO_PUBLIC_RUNTIME_SCENARIO_ID=s01_normal_full_matrix`, waits for Expo to report a local URL or Metro `/status`, and shuts down. It must not require Supabase, RevenueCat, push credentials, EAS ownership, store credentials, HBuilderX, Android, or production config.

If the command fails because the local Expo CLI, Node dependency tree, port availability, or Windows shell environment is missing, classify it as `tool_missing` or `environment_blocked` with the exact command output.

## Generated-Output Restore Rules

The requested PR gate includes:

```powershell
npm.cmd run validate:test-inputs
```

That command may rewrite `output/test-input-pack/reports/validation-report.json`. Restore it unless the goal explicitly commits a generated report refresh:

```powershell
git restore -- output/test-input-pack/reports/validation-report.json
```

Other generated-output commands are not part of this smoke matrix, but if they are run during investigation, follow `docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md`:

| Generated path | Restore rule |
| --- | --- |
| `mobile/fixtures/runtime/current/**` | Restore after validation-only scenario selection. |
| `mobile/fixtures/runtime/scenarios/**` | Restore after validation-only scenario export. |
| `output/test-input-pack/**` | Restore after validation-only build/export/smoke churn. |
| `fixtures/test-inputs/**` | Must not mutate in this PR gate. Stop and report `NEED_HUMAN` if touched unexpectedly. |

Always run `git status --short` before generated-output-mutating commands, after commands, after restore, and before final reporting.
