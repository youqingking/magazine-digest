# Harness Landing Plan

## Goal

Land an agent harness safely into this existing migration project without changing app behavior, package scripts, dependencies, generated outputs, or legacy runtime state.

## What To Add First

1. Keep the first landing layer documentation-only under `docs/harness/`.
2. Treat `docs/harness/EXISTING_PROJECT_AUDIT.md` as the baseline fact map.
3. Treat this file as the first landing plan for future harness work.
4. Add future harness checks as read-only wrappers before changing root scripts.
5. Prefer commands that already exist and are safe in a no-credential environment:
   - `npm.cmd run validate:preflight`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\harness\preflight.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\harness\verify.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\harness\smoke.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\harness\report.ps1`

## What Not To Add Yet

- Do not add dependencies.
- Do not modify `package.json`.
- Do not add or rename root scripts.
- Do not scaffold `apps/mobile` yet.
- Do not run `create-expo-app` yet.
- Do not add real Supabase, RevenueCat, Expo Push, FCM/APNs, store, or analytics credentials.
- Do not add real CI until the safe local command set is frozen.
- Do not run stateful import/release/test orchestrations as default harness validation.
- Do not rewrite `AGENTS.md` during the first landing pass.
- Do not clean or delete legacy directories as part of harness landing.

## Files That Must Not Be Overwritten

- `package.json`
- `package-lock.json`
- `pnpm-workspace.yaml`
- `AGENTS.md`
- `.env.example`
- `app.json`
- `eas.json`
- `mobile/**`
- `admin/**`
- `backend/**`
- `database/**`
- `uniCloud/**`
- `shared/**`
- `packages/**`
- `domains/**`
- `runtime/**`
- `output/**`
- `ops/**`
- `scripts/**`
- existing `docs/*.md` except future explicitly scoped harness docs

## Proposed Directory Layout

```text
docs/
  harness/
    EXISTING_PROJECT_AUDIT.md
    HARNESS_LANDING_PLAN.md
    COMMAND_SAFETY_MATRIX.md          # future, docs-only
    EXISTING_SCRIPT_INVENTORY.md      # future, docs-only
    EXPO_FIRST_READINESS_CHECKLIST.md # future, docs-only

scripts/
  harness/
    preflight.ps1                     # existing; do not change in first landing
    verify.ps1                        # existing; do not change in first landing
    smoke.ps1                         # existing; do not change in first landing
    report.ps1                        # existing; do not change in first landing
```

Future harness code can be considered only after the docs-only audit is reviewed and approved.

## First 5 Codex Goals

1. `Read-only audit existing project and freeze harness landing facts`
   - Create only `docs/harness/EXISTING_PROJECT_AUDIT.md` and `docs/harness/HARNESS_LANDING_PLAN.md`.
   - Do not modify app code, package scripts, dependencies, or generated outputs.

2. `Classify existing commands by mutation risk`
   - Create a docs-only command safety matrix.
   - Mark commands as read-only, writes reports only, mutates generated state, mutates runtime state, requires credentials, or requires desktop tools.

3. `Define Expo-first readiness checks without scaffolding`
   - Document which files prove `apps/mobile` is ready.
   - Keep this as documentation until a separate implementation thread is opened.

4. `Define protected paths for future agents`
   - Document no-overwrite paths and generated/runtime paths.
   - Do not enforce with code until command safety is reviewed.

5. `Prepare a no-credential validation profile`
   - Identify the minimal commands that can run without Supabase, RevenueCat, push, HBuilderX, or store credentials.
   - Keep Windows-safe command forms such as `npm.cmd` in the docs.

## Validation Commands Available Now

Commands that appear safe for the current no-credential audit profile:

- `npm.cmd run validate:preflight`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate\preflight.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\harness\preflight.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\harness\verify.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\harness\smoke.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\harness\report.ps1`
- `git status --short --branch`

Commands that exist but should be reviewed before becoming harness defaults:

- `npm.cmd run verify`
- `npm.cmd run smoke`
- `npm.cmd run build:mobile`
- `npm.cmd run build:admin`
- `npm.cmd run build:backend`
- `npm.cmd run build:test-inputs`
- `npm.cmd run export:runtime-scenarios`
- `npm.cmd run select:runtime-scenario`
- `npm.cmd run sync:unicloud-database`
- `node scripts/tests/run-test1.mjs`
- `npx playwright test tests/smoke/*.spec.js`

## Missing Commands Or Missing Project Knowledge

- No root `test` script was found.
- No root `lint` script was found.
- No root `typecheck` script was found.
- No CI workflow was found under `.github` or `.circleci`.
- `apps/mobile` does not yet contain an Expo Router app scaffold.
- No `apps/mobile/package.json` was found.
- No root `tsconfig.json` was found.
- No root ESLint, Biome, Jest, Vitest, or Playwright config file was found.
- Package manager policy needs confirmation because both `package-lock.json` and `pnpm-workspace.yaml` exist.
- Human confirmation is still needed for Expo/EAS ownership, Supabase project/env strategy, RevenueCat mapping, push credential ownership, and legacy retention policy.
- HBuilderX is not guaranteed locally and should not be required for Expo-first harness checks.

## Landing Rules

- Harness must be additive and observable before it is enforcing.
- Harness must report existing project state before proposing changes.
- Harness must not turn stateful release/import scripts into default validation.
- Harness must not assume blank-repo conventions.
- Harness must preserve `product_key` as a first-class contract dimension.
- Harness must preserve the repository boundary: external content production stays outside this app repo.
- Harness must preserve legacy `mobile/`, `uniCloud/`, and `admin/` as migration references until a separate cleanup goal exists.

## Next Safe Step

The next safe step is a docs-only `COMMAND_SAFETY_MATRIX.md` that classifies every root script and major direct Node/PowerShell test command by side effects, required credentials, required tools, and default-harness eligibility.
