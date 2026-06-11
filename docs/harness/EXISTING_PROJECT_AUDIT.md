# Existing Project Audit

## Scope

This audit treats the repository as an existing migration workspace, not a blank repo. It is based on read-only inspection of repository files and current scripts. No app code, package scripts, dependencies, build configuration, or runtime behavior was changed.

## Detected Tech Stack

- Target mobile stack is documented as `Expo + React Native + TypeScript + Expo Router + EAS`.
- Current committed mobile target directory `apps/mobile/` is only a placeholder README; no Expo Router app files, `apps/mobile/package.json`, or TypeScript config were found there.
- Root dependencies already include `expo` and `expo-dev-client` canary packages, and root `app.json` / `eas.json` exist.
- Legacy mobile implementation exists under `mobile/` and is DCloud / uni-app / uniCloud oriented, with `App.vue`, `main.js`, `pages.json`, `manifest.json`, `uni_modules/`, and `uniCloud-aliyun/`.
- Backend/domain runtime is Node.js ESM, using `backend/*.mjs`, `scripts/*.mjs`, `shared/*.js`, and packages under `packages/`.
- Admin shell is a static/generated JavaScript surface under `admin/`, with generated resource JSON and manual modules.
- Data/model layer currently uses JSON schema files in `database/` and mirrored `uniCloud/database/`.
- Runtime/release operations are file-backed, with `runtime/`, `output/`, `ops/`, and many stage scripts.

## Package Manager

- `pnpm-workspace.yaml` declares workspace packages under `apps/*` and `packages/*`.
- `package-lock.json` is present, so npm has also been used historically.
- Root scripts are npm-compatible and PowerShell-heavy.
- In this Windows PowerShell environment, invoking `npm` directly can hit the `npm.ps1` execution-policy block; `npm.cmd` is the safer command form for audit validation.

## App Entrypoints

- Root static/H5 sample:
  - `index.html`
  - `app.js`
  - `snake-logic.js`
  - `styles.css`
  - `serve.ps1`
- Expo target config:
  - `app.json`
  - `eas.json`
  - `apps/mobile/README.md`
- Legacy uni-app reference:
  - `mobile/App.vue`
  - `mobile/main.js`
  - `mobile/pages.json`
  - `mobile/manifest.json`
  - `mobile/pages/*`
  - `mobile/stores/*`
  - `mobile/services/*`
  - `mobile/api/*`
  - `mobile/contracts/*`
- Backend/local runtime:
  - `backend/index.mjs`
  - `backend/runtime/create-runtime.mjs`
  - `backend/contracts/surfaces.mjs`
  - `backend/surfaces/*.mjs`
- Admin shell:
  - `admin/index.html`
  - `admin/src/main.js`
  - `admin/src/routes.js`
  - `admin/pages-generated/*.generated.json`

## Existing Docs

The repository already has extensive governance and migration docs. Key documents read or inspected include:

- `README.md`
- `AGENTS.md`
- `docs/STACK_DECISION.md`
- `docs/TARGET_REPO_MAP.md`
- `docs/MIGRATION_AUDIT.md`
- `docs/COMMANDS.md`
- `docs/HARNESS.md`
- `docs/VALIDATION_MATRIX.md`
- `docs/NEED_HUMAN.md`
- `docs/API_CONTRACTS.md`
- `docs/DATA_CONTRACTS.md`
- `docs/ARCHITECTURE.md`
- `docs/OUT_OF_SCOPE.md`
- `docs/TIME_AND_MONEY_RULES.md`
- Many stage decision, acceptance, test plan, ops, release, UI, and shared-model documents under `docs/`.

## Existing Tests

- Node test files exist under `scripts/tests/`, including parser, content contract, lifecycle, publication delete, follow update, intake replace, and app regression tests.
- Playwright smoke specs exist under `tests/smoke/`:
  - `h0_5-device-diagnostics.spec.js`
  - `h5-white-screen.spec.js`
  - `ui35-h5-shell.spec.js`
- `@playwright/test` is listed as a root dev dependency.
- No root `test` script was found in `package.json`.
- `scripts/tests/run-test1.mjs` is stateful and writes/restores runtime files; it is not a safe first harness landing command.

## Existing CI, Build, Lint, And Typecheck Commands

### CI

- No `.github/workflows` or `.circleci/config.yml` was found during inspection.

### Root Scripts Found

- `npm run preflight`
- `npm run validate:preflight`
- `npm run validate:preflight:sh`
- `npm run install`
- `npm run build:mobile`
- `npm run export:mobile-fixtures`
- `npm run build:admin`
- `npm run build:backend`
- `npm run validate:stage-h0`
- `npm run validate:h0_5-device-readiness`
- `npm run build:test-inputs`
- `npm run generate-admin`
- `npm run validate:f1-foundation`
- `npm run validate:stage-g`
- `npm run validate:test-inputs`
- `npm run export:runtime-scenarios`
- `npm run select:runtime-scenario`
- `npm run smoke:test-inputs`
- `npm run sync:unicloud-database`
- `npm run verify`
- `npm run smoke`
- `npm run smoke:*`
- `npm run verify:h0_5-db`
- `npm run report:h0_5`

### Lint / Typecheck

- No explicit root `lint` script was found.
- No explicit root `typecheck` script was found.
- No root `tsconfig.json`, ESLint, Biome, Jest, Vitest, or Playwright config file was found at the repository root.

## Existing Analytics And Telemetry

- Local event ingest and observability exist as repository/runtime seams.
- Evidence found:
  - `backend/surfaces/event-ingest.mjs`
  - `backend/contracts/surfaces.mjs` includes `event-ingest`
  - `database/event_logs_raw.schema.json`
  - `database/event_metrics_daily.schema.json`
  - `scripts/ops/lib/observability-lib.mjs`
  - `runtime/observability/*`
  - docs under `docs/STAGE_OBS1_*`
- No external analytics provider integration such as Sentry, PostHog, Amplitude, Mixpanel, or a warehouse sink was found as an active dependency or config.

## Existing Auth, Payment, Store, And Release Setup

### Auth

- Current auth is a seam/stub, not a final provider migration.
- Evidence found:
  - `backend/surfaces/auth-session.mjs`
  - `backend/surfaces/auth-refresh.mjs`
  - `backend/surfaces/auth-signout.mjs`
  - `mobile/services/auth.service.js`
  - `mobile/stores/auth.store.js`
  - `mobile/uni_modules/uni-id-pages/*`
  - `.env.example` contains `REMOTE_AUTH_PROVIDER=uni-id`

### Payment / Subscription

- Current billing/payment appears to be contract and preview seam oriented.
- Evidence found:
  - `database/payment_orders.schema.json`
  - `database/subscription_records.schema.json`
  - `database/entitlements.schema.json`
  - `backend/contracts/surfaces.mjs` lists `billing.createOrder`, `billing.confirmOrder`, and `billing.handleWebhook` as future stage
  - `shared/contracts/payment-order-status.js`
  - `shared/contracts/subscription-status.js`
  - docs for `H1`, `H1A`, payment readiness, and time/money rules
- No real RevenueCat SDK dependency or API key was found.

### Store / Release

- EAS config exists in `eas.json`.
- Root `app.json` has Expo owner, slug, Android package, and EAS project id.
- Release/runtime distribution is currently file-backed:
  - `runtime/releases/*`
  - `runtime/channels/*`
  - `scripts/ops/*release*`
  - `scripts/ops/*channel*`
  - `docs/STAGE_REL*`
- No App Store Connect, Google Play, or EAS Submit credentials were found in repository files inspected.

### Push / Notifications

- Current notification and push implementation is a seam/preview layer.
- Evidence found:
  - `database/notification_*.schema.json`
  - `database/device_installations.schema.json`
  - `backend/surfaces/register-device.mjs`
  - `backend/surfaces/push-capability.mjs`
  - `backend/surfaces/notification-delivery-preview.mjs`
  - `mobile/services/push.service.js`
  - `mobile/stores/notifications.store.js`
  - `.env.example` contains push placeholders
- No real `expo-notifications` package dependency or FCM/APNs credential setup was found in current package files.

## Existing Product And Domain Objects

Primary product/domain objects found in schema, contracts, docs, backend surfaces, and generated admin resources:

- `products`
- `publications`
- `publish_batches`
- `articles`
- `article_variants`
- `user_profiles`
- `user_product_profiles`
- `user_content_state`
- `user_follows`
- `user_notification_prefs`
- `device_installations`
- `entitlements`
- `subscription_records`
- `payment_orders`
- `pricing_plans`
- `quota_policies`
- `quota_consumption_logs`
- `promo_campaigns`
- `promo_codes`
- `promo_redemptions`
- `referrals`
- `reward_ledger`
- `feature_flags`
- `experiments`
- `experiment_assignments`
- `event_logs_raw`
- `event_metrics_daily`
- `audit_logs`
- `notification_campaigns`
- `notification_deliveries`
- `notification_inbox`

Domain package references also exist for:

- magazine summaries
- podcast transcript normalization
- YouTube summary adapters
- source-family and attention-adapter style route/domain manifests

## Existing Risk Areas

- The repository is a migration workspace with mixed source-of-truth paths: `apps/mobile` target placeholder, legacy `mobile/`, root static H5 files, `backend/`, `packages/`, `runtime/`, and `admin/`.
- Root `package.json` has many existing scripts; adding harness scripts directly there would be risky without a separate landing plan.
- Both `package-lock.json` and `pnpm-workspace.yaml` exist, so package-manager intent is mixed.
- `npm` can fail in PowerShell because of execution policy; `npm.cmd` should be used in Windows harness docs.
- Existing test/orchestration scripts may mutate `output/`, `runtime/`, `mobile/fixtures/runtime/current/*`, or generated admin files.
- `scripts/tests/run-test1.mjs` uses state locks and imports content from a user-local zip path; it should not be the first safe validation command.
- `apps/mobile` is not scaffolded yet despite Expo dependencies/config at root.
- `docs/HARNESS.md` and some existing docs may display mojibake when read without explicit UTF-8.
- `docs/NEED_HUMAN.md` lists missing external decisions and local environment/tool blockers.
- HBuilderX, Alicloud/uniCloud env vars, push app keys, and product defaults are not guaranteed locally.
- Real Supabase, RevenueCat, Expo Push, FCM/APNs, store credentials, and external analytics sinks are not present and should not be inferred.
- Large generated/runtime directories exist; harness must avoid broad rewrites, formatters, and recursive generation.
