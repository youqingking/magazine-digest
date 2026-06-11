# Mobile Dependency Workflow

## Package Manager

The Expo mobile shell uses npm workspaces as the locked package workflow.

Use this install command from the repository root:

```powershell
npm.cmd install --workspace=@magazine-digest/mobile --include-workspace-root --legacy-peer-deps
```

This repo already has `package-lock.json`, npm-based root validation scripts, and Windows-safe `npm.cmd` command forms. `pnpm-workspace.yaml` remains as a workspace layout marker, but this shell does not introduce `pnpm-lock.yaml` while `package-lock.json` is the committed lockfile.

`--legacy-peer-deps` is required for this Expo 55 canary dependency set because npm strict peer resolution otherwise selects an optional `react-dom` peer newer than the React patch version expected by the installed Expo SDK. The app pins `react`, `react-dom`, `react-native`, `expo-router`, `react-native-safe-area-context`, and `react-native-screens` to the versions reported by Expo dependency validation.

## Where Dependencies Live

`apps/mobile/package.json` declares the Expo shell runtime and TypeScript dependencies for `@magazine-digest/mobile`. The root `package.json` declares npm workspaces for `apps/*` and `packages/*`, and the root package still owns the existing Expo canary dependency entries. `--include-workspace-root` keeps root Expo packages materialized alongside workspace packages so Metro config resolution works on Windows.

Installed packages live under root `node_modules` with workspace links for `apps/mobile` and `packages/core-runtime`. Do not commit `node_modules`.

## Mobile Scripts

Run mobile scripts through the package prefix form:

```powershell
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
```

`typecheck` runs `tsc --noEmit`.

`smoke:fixture` imports `packages/core-runtime/src/runtime-fixture-reader.ts`, reads `mobile/fixtures/runtime/current/runtime.bundle.json` and `mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json`, and proves the fixture reader returns a ready no-credential app view model with `product_key` and article rows.

`start:smoke` starts the local Expo CLI with `EXPO_PUBLIC_RUNTIME_SCENARIO_ID=s01_normal_full_matrix`, waits for Expo to report its local localhost URL, checks Metro `/status` when the endpoint is available, and shuts the process down. It does not require Supabase, RevenueCat, push credentials, EAS ownership, store credentials, or production config.

For interactive development, use:

```powershell
npm.cmd --prefix apps/mobile run start:expo
```

## Dependency Rules

- Keep Expo aligned with the root Expo version unless a separate Expo upgrade goal updates the lockfile intentionally.
- Add only dependencies needed by the Expo shell, typecheck, and no-credential smoke scripts.
- Use `npm.cmd install` to update `package-lock.json`; do not hand-edit lockfiles.
- Do not add Supabase, RevenueCat, push, analytics, or production service SDKs in this dependency workflow goal.
- Do not use install commands that rewrite generated runtime fixtures or fixture source data.

## Validation

Run:

```powershell
python scripts/agent_tools/validate_mobile_dependency_workflow.py .
```

The validator checks the workflow doc, npm workspace declaration, mobile scripts, required dependency declarations, and lockfile workspace entries.
