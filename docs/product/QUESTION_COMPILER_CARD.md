# Question Compiler Card

## Purpose

Compile the next questions that must be answered before runtime implementation threads move from contract freeze into code.

## Runtime Shell

- What is the first Expo shell milestone under `apps/mobile`: navigation skeleton, package viewer, offline cache, or account shell?
- Which runtime package fixture is the first acceptance target for the Expo shell?
- Which shared types belong in `packages/core-*` before screen implementation begins?
- What is the minimum product-scoped runtime config object the shell must load at startup?
- Which legacy views in `mobile/` are reference-only for naming and UX semantics?

## Content Pipeline Out Of Repo

- What exact package manifest schema will the external pipeline emit?
- Which fields are required before the app accepts a package?
- How are package revisions, tombstones, unpublished states, and partial availability represented?
- How are article variants, summaries, assets, and section ordering referenced without requiring in-repo content production?
- Where will package integrity evidence, provenance, and validation reports live outside the app repo?

## Supabase Auth Data

- Which Supabase organization and project own dev, staging, and production?
- What is the secret injection strategy for local, EAS build, and runtime environments?
- Which tables become the first product-scoped runtime state tables?
- What is the auth model for anonymous, signed-in, subscription, and family/team states?
- How will `product_key` be enforced across user state, events, config, and content availability?

## RevenueCat

- Which RevenueCat project, app, and store products map to each `product_key`?
- What is the entitlement naming convention?
- Which entitlement states are app-readable, and which remain server-side only?
- How are trials, promos, renewals, revocations, and grace periods represented without hardcoding client benefits?
- What webhook or sync path updates Supabase-facing entitlement snapshots?

## Notifications Growth

- Who owns Expo Push credentials and future APNs/FCM direct credentials?
- Which notification categories are allowed for the first runtime shell?
- How are preferences, quiet hours, dedupe, and campaign attribution scoped by `product_key`?
- Which notification events are growth experiments versus transactional runtime events?
- Which delivery-preview behavior is allowed before real credentials exist?

## Expo EAS Device Readiness

- What are the final Expo `owner`, `slug`, `ios.bundleIdentifier`, and `android.package`?
- Is the existing EAS `projectId` correct for the target Expo organization?
- Which device readiness profile is required first: local dev build, Android internal, iOS simulator, or store submit?
- What is the package-manager policy given both `package-lock.json` and `pnpm-workspace.yaml` exist?
- Which no-credential validation commands become mandatory before implementation threads merge?

## NEED_HUMAN Blockers

- Confirm Expo/EAS organization, app identity, and project ownership.
- Confirm Supabase organization, project, environment, and secret management.
- Confirm RevenueCat project, app, product, and entitlement mapping.
- Confirm push credential ownership and Expo Push versus direct APNs/FCM timing.
- Confirm legacy `mobile/`, `uniCloud/`, and `admin/` retention horizon.
- Confirm default product context and any placeholder `PRODUCT_KEY_DEFAULT` usage.
- Confirm whether HBuilderX remains needed for legacy reference verification.
