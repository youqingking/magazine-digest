# Magazine Digest

Magazine Digest is an Expo-first migration workspace for efficient magazine reading and digest-style content consumption.

## Scope

- Mobile shell target: Expo, React Native, TypeScript, Expo Router, EAS.
- Backend target: Supabase.
- Subscriptions target: RevenueCat.
- Notifications target: `expo-notifications` / Expo Push, with an FCM/APNs seam reserved.

## Repository Boundary

This repository consumes standardized content packages and runtime metadata produced by an external pipeline. It does not implement external content ingestion, PDF parsing, web scraping, prompt generation, markdown generation, or content pipeline scheduling.

Legacy DCloud / uni-app / uniCloud surfaces remain as migration references. Future implementation should land under `apps/mobile`, `packages/core-*`, and `infra/supabase`.

## Current Runnable Surfaces

This branch is restored at `44bf23e`. It is not a complete Expo app shell yet. The runnable surfaces are:

- Root static preview: `index.html`, `app.js`, `snake-logic.js`, and `styles.css`.
- Admin static shell: `admin/index.html` with generated resources under `admin/pages-generated`.
- Legacy mobile shell: `mobile/` as a DCloud / uni-app project, intended to be opened from HBuilderX.
- Expo target config: root `app.json` and `eas.json` exist, but there is no complete migrated `apps/mobile` Expo Router shell on this branch.

## Start And Preview Commands

Run commands from the repository root unless a command says otherwise.

### 1. Preflight

```powershell
npm run preflight
```

Checks local tool availability and reports known manual blockers.

### 2. Root Static Preview

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```

Open `http://localhost:8080/`.

### 3. Admin Static Shell

Prepare or refresh generated admin resources:

```powershell
npm run generate-admin
npm run build:admin
```

Start a static server from the `admin` directory:

```powershell
cd admin
powershell -ExecutionPolicy Bypass -File ..\serve.ps1 -Port 8081
```

Open `http://localhost:8081/`.

### 4. Legacy Mobile Uni-App Shell

Validate the mobile shell structure:

```powershell
npm run build:mobile
```

Run the mobile app manually in HBuilderX:

1. Open HBuilderX.
2. Import the `mobile/` directory as a uni-app project.
3. Use HBuilderX to run to H5, Android, or another supported target.

If HBuilderX CLI is installed and discoverable, run the automated H5 smoke flow:

```powershell
npm run smoke:stage-ui35-h5
```

The smoke flow publishes the `mobile/` project to `mobile/unpackage/dist/build/web`, starts a temporary local web server, runs Playwright checks, and then stops the temporary server.

### 5. Expo Target

The target stack is Expo-first, but this restored branch does not contain a complete migrated Expo application shell. Treat root `app.json` and `eas.json` as target configuration only. Do not rely on `npx expo start` for this branch until an Expo shell is restored or rebuilt under the future `apps/mobile` path.

## Validation Commands

```powershell
npm run verify
npm run smoke
```

`verify` runs the core harness and stage contract checks. `smoke` aggregates preflight, verify, mobile build, and admin build signals.
