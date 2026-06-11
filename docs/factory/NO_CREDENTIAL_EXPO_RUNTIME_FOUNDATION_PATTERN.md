# No-Credential Expo Runtime Foundation Pattern

## Purpose

This pattern extracts the reusable Phase A foundation for an Expo-first runtime app. It freezes a no-credential app shell that can render standardized runtime fixtures, prove product-scoped data boundaries, and leave real Supabase, RevenueCat, push, store, and production configuration work for later human-approved goals.

Use this pattern when a new same-basis app needs an executable mobile runtime starting point without adding service integrations or app-specific features.

## Reusable Pattern

Phase A is reusable as a governance-first foundation:

1. Freeze the runtime object and repo boundary before writing app behavior.
2. Accept only standardized content packages and generated runtime fixtures.
3. Classify commands by side effect before validation runs.
4. Scaffold an Expo Router shell that reads fixtures by default.
5. Lock dependency workflow with npm workspace commands and lockfile validation.
6. Route app data through runtime repository ports.
7. Implement a fixture adapter as the default repository.
8. Add a Supabase seam that fails closed and does not connect.
9. Gate PR review with no-credential validators and generated-output restore rules.

## Runtime Object Freeze

The runtime object is the app-facing reality that the shell may consume. It must be documented before implementation and must preserve:

- `product_key` as a first-class product scope.
- Standardized package identity, publication identity, article identity, variant identity, release clocks, revisions, availability, and provenance.
- Runtime-safe premium, pricing, quota, experiment, campaign, referral, reward, entitlement, notification, and profile snapshots as metadata only.
- A hard boundary that keeps PDF parsing, web scraping, prompt generation, markdown generation, external package production, and pipeline scheduling outside the app repo.

Do not let a new app silently infer a production product, entitlement, price, quota, feature flag, experiment, operational threshold, or risk threshold.

## Content Package Contract

Reuse `docs/content/CONTENT_PACKAGE_CONTRACT.md` and `docs/runtime/RUNTIME_FIXTURE_CONTRACT.md` as the contract pair:

- Source fixtures live under `fixtures/test-inputs/**`.
- Runtime bundles are generated under `output/test-input-pack/**`.
- Mobile fixtures are generated under `mobile/fixtures/runtime/**`.
- The app shell reads generated runtime bundles but does not build, select, or mutate them.

Future apps can rename package identity fields and fixture names, but they must keep `product_key`, stable content keys, variant selection fields, availability state, tombstone semantics, and forbidden pipeline responsibilities.

## Command Safety Matrix

Before running validation, classify commands as:

- Read-only.
- Writes reports only.
- Generated-output-mutating.
- Runtime-state-mutating.
- Credential-required.
- Requires desktop tools.
- Unsafe without human approval.

Use the Phase A runbook rules:

- Prefer Windows-safe `npm.cmd` command forms.
- Run `git status --short` before and after generated-output commands.
- Restore validation-only generated output with explicit `git restore -- <path>` recipes.
- Stop and report `NEED_HUMAN` if commands ask for cloud, admin, push, store, production, or secret material.

## Expo Shell

The shell pattern is:

- `apps/mobile` as the Expo-first app.
- Expo Router routes for home, article, and debug surfaces.
- Static fixture imports through a runtime fixture source.
- Loading, missing, empty, ready, and unavailable states rendered explicitly.
- No fallback from explicit Supabase mode to fixture data.

The shell may render titles, summaries, publication labels, body markdown already present in runtime bundles, scenario metadata, and seam status. It must not connect to live services or synthesize backend records.

## Dependency Workflow

Reuse the npm workspace workflow:

- Root `package.json` owns workspaces for `apps/*` and `packages/*`.
- `apps/mobile/package.json` owns shell scripts and mobile dependencies.
- Root `package-lock.json` must stay aligned with root and mobile package manifests.
- Use `npm.cmd ci` for clean validation.
- Use documented npm install commands for intentional dependency changes.

Do not hand-edit lockfiles, run audit fixes, add service SDKs, or upgrade Expo inside a factory harvest goal.

## Runtime Data Port

Shared runtime ports isolate app routes from the data source:

- `RuntimeContentRepository`
- `RuntimeScenarioRepository`
- `RuntimeEntitlementRepository`
- `RuntimeNotificationRepository`

Each port returns product-scoped data or an unavailable state. Future services can implement the same interfaces after human-owned project, auth, schema, RLS, entitlement, and push decisions are recorded.

## Fixture Adapter

The fixture adapter is the default implementation. It reads generated bundles and maps them into app view models.

Required behavior:

- Preserve `product_key`.
- Support the selected runtime scenario and a documented local scenario override.
- Return explicit `missing`, `empty`, `ready`, or `unavailable` states.
- Avoid writes, generation, selection, service connections, and source content production.

## Supabase Seam

The Supabase seam is a contract, not an integration:

- Explicit mode is selected by `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase`.
- Public env names are documented but no real values are committed.
- Missing env returns `unavailable` with `reason=missing_env`.
- Current seam reports `connects: false`.
- No Supabase SDK, project URL, anon key, service-role key, CLI link, applied migration, auth provider, storage, edge function, or production config is added.

Draft schema and RLS contracts remain review-only until a separate migration goal is approved.

## PR Gate

The reusable PR gate must prove:

- `npm.cmd ci` can materialize dependencies from the committed lockfile.
- Factory and foundation validators pass.
- Mobile typecheck, fixture smoke, and Expo start smoke pass without credentials.
- Generated outputs touched by validation are restored.
- `git diff --check` passes.
- `git status --short` contains only intended docs/tooling changes.
- No feature work, dependencies, credentials, applied migrations, production config, RevenueCat setup, push setup, fixture source data edits, or generated runtime outputs are committed.

## Non-Goals

This pattern does not generalize business UX, service providers, production identifiers, store setup, RevenueCat products, push credentials, content pipeline code, fixture source data, or app-specific product decisions.
