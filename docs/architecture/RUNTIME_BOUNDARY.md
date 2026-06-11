# Runtime Boundary

## Purpose

Define the boundary between the external content pipeline, standardized package contract, Expo app runtime, Supabase, RevenueCat, notifications, and legacy migration references.

## External Pipeline

The external pipeline is outside this repository.

It owns:

- Source acquisition.
- PDF parsing.
- Web scraping.
- Prompt generation.
- Markdown generation.
- Content normalization.
- Package production.
- Pipeline scheduling.

The app repo must not implement those functions.

## Standardized Content Package

The standardized content package is the only content-production output the runtime accepts.

It must expose enough runtime metadata for:

- `product_key`
- Package identity.
- Publication and issue identity.
- Release and revision clocks.
- Availability state.
- Content ordering and references.
- Variant references.
- Asset references.
- Integrity or provenance evidence when available.

The package is input to the runtime, not source material for in-repo content production.

## App Runtime

The app runtime is Expo-first and should land under `apps/mobile`.

It owns:

- Reading and digest consumption UX.
- Package validation and runtime loading.
- View-model mapping.
- Offline/cache behavior when implemented.
- User reading state and follows.
- Runtime events and metrics.
- Adapter seams for Supabase, RevenueCat, and notifications.

It does not own content ingestion, parsing, scraping, prompt generation, markdown generation, or scheduling.

## Supabase

Supabase is the future backend target for:

- Auth.
- User profiles.
- Product-scoped user content state.
- Product-scoped runtime config.
- Product-scoped events.
- Entitlement snapshots synchronized from RevenueCat.
- Notification preferences and inbox state when implemented.

Supabase schema and implementation are out of scope for this contract freeze. Missing project ownership, environments, and secrets remain `NEED_HUMAN`.

## RevenueCat

RevenueCat is the future subscription authority.

It owns:

- Customer subscription status.
- Store product mapping.
- Entitlement state.
- Renewal, revocation, grace, and trial facts.

The app runtime may consume entitlement snapshots, but must not hardcode prices, plan benefits, free quotas, or entitlement grants.

## Notifications

Notifications target `expo-notifications` and Expo Push first, with an explicit future seam for direct FCM/APNs.

The runtime owns:

- Device registration seam.
- User notification preferences.
- Inbox and delivery-preview surfaces.
- Product-scoped notification events.

Credential ownership and direct APNs/FCM timing remain human decisions.

## Legacy Reference

Legacy paths are reference-only unless a future explicit goal changes their status:

- `mobile/`
- `uniCloud/`
- `admin/`

They may inform product semantics, historical page behavior, contracts, and migration risks. They are not the future primary shell, backend, or admin implementation authority.

## Boundary Table

| Area | In This Repo | Outside This Repo | Notes |
| --- | --- | --- | --- |
| External content production | No | Yes | No ingestion, parsing, scraping, prompt, markdown, or scheduling code. |
| Standardized package contract | Yes | Yes | External pipeline produces it; repo validates and consumes it. |
| Expo mobile runtime | Yes | No | Future implementation under `apps/mobile`. |
| Shared runtime contracts | Yes | No | Future implementation under `packages/core-*`. |
| Supabase backend | Yes, future infra | Yes, managed service | Future implementation under `infra/supabase`; credentials blocked. |
| RevenueCat | Adapter seam only | Yes | No price or entitlement hardcoding. |
| Notifications | Adapter seam only | Yes | Expo Push first; FCM/APNs seam reserved. |
| Legacy DCloud paths | Reference only | No | Do not reactivate as primary shell without explicit goal. |
