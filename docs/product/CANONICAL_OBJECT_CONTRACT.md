# Canonical Object Contract

## Purpose

Freeze the runtime object contract for Magazine Digest before implementation threads change app source, Expo config, dependencies, schema, auth, payment, push, or production configuration.

## Input Object

The app repo accepts a standardized content package plus runtime metadata from an external pipeline.

Required input object shape, at contract level:

- `product_key`: stable product scope for the package and all runtime decisions.
- `package_id`: stable package identifier.
- `publication_key`: magazine or publication identifier.
- `issue_key`: issue or release identifier when applicable.
- `revision_id`: package revision identifier.
- `released_at`: package release or revision time.
- `availability`: runtime availability state, including unpublished or tombstone states when applicable.
- `content_index`: ordered references to articles, sections, variants, assets, and summaries.
- `metadata`: normalized runtime metadata needed by the app shell.
- `integrity`: checksums or equivalent package integrity evidence when available.

The exact serialized schema may be refined later, but those dimensions must remain explicit.

## Output Object

The app runtime emits and persists runtime state derived from accepted packages.

Required output object families:

- Reading surface state: home, issue, section, article, digest, save-for-later, and resume state.
- User content state: read progress, follows, saves, hidden/unavailable content state, and revision awareness.
- Data access state: Supabase-backed user, product, content, and event records when implementation begins.
- Entitlement state: RevenueCat-derived access snapshots, never client-hardcoded grants.
- Notification state: device registration, preference, inbox, campaign, and delivery-preview surfaces.
- Event state: product-scoped runtime events and metrics with `product_key`.

## Truth Sources

Canonical truth sources are layered:

- Repo governance truth: `README.md`, `AGENTS.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md`, `docs/harness/HARNESS_LANDING_PLAN.md`, and this contract set.
- Package truth: standardized content package and runtime metadata from the external pipeline.
- Runtime data truth: future Supabase records for users, product-scoped content state, events, and configuration.
- Entitlement truth: future RevenueCat customer and entitlement state synchronized into runtime views.
- Notification truth: Expo Push registration and delivery state, with reserved direct FCM/APNs seam.
- Migration reference truth: legacy `mobile/`, `uniCloud/`, and `admin/` only as reference evidence, not future shell authority.

## Canonical State Boundaries

In-repo canonical state:

- Runtime contract docs.
- Runtime boundary docs.
- Agent registry docs.
- Validation scripts that inspect docs/headings only.
- Future implementation under `apps/mobile`, `packages/core-*`, and `infra/supabase`.

Out-of-repo canonical state:

- Source acquisition.
- PDF parsing.
- Web scraping.
- Prompt generation.
- Markdown generation.
- Content pipeline scheduling.
- External package production.

External service canonical state:

- Expo/EAS app ownership and build identity.
- Supabase project, auth, database, and secret management.
- RevenueCat product, app, customer, and entitlement mapping.
- Push credentials and APNs/FCM owner decisions.

## Product Key Rule

Every critical data, config, event, entitlement, feature flag, experiment, notification, quota, and operational decision must support `product_key`.

Rules:

- Do not add runtime records that cannot be scoped by `product_key`.
- Do not encode prices, free quotas, subscription benefits, feature flags, experiments, operational thresholds, or risk thresholds as client constants.
- Do not infer a default product silently in production paths.
- A local placeholder default may exist only as an explicit no-credential harness placeholder and must remain blocked from production use until human-owned.

## Allowed In-Repo Transforms

Allowed transforms are runtime-safe and do not produce source content:

- Validate package shape and required metadata.
- Normalize package references for runtime consumption.
- Map accepted package metadata into UI view models.
- Cache package availability and revision state.
- Sync user reading state and runtime events.
- Build product-scoped runtime config views from external or Supabase-backed configuration.
- Compile documentation, harness reports, and contract validation output.

## Forbidden Transforms

Forbidden transforms inside this repository:

- PDF to markdown.
- Web page to markdown.
- Prompt to markdown.
- Raw content ingestion.
- Web scraping.
- PDF parsing.
- Prompt generation.
- Markdown generation.
- Editorial workflow scheduling.
- External pipeline orchestration.
- Client-side price, entitlement, feature flag, experiment, operational threshold, or risk threshold hardcoding.

## Legacy Reference Policy

Legacy paths remain migration references unless a future goal explicitly reactivates or retires them:

- `mobile/`
- `uniCloud/`
- `admin/`

Reference use is allowed for understanding product semantics, page names, historical contracts, and migration behavior. New future implementation should land under:

- `apps/mobile`
- `packages/core-*`
- `infra/supabase`

## Runtime Object Tests

Minimum tests for future implementation threads:

- Contract presence: required docs and headings exist.
- Product scope: package, user state, config, event, entitlement, and notification objects carry or resolve `product_key`.
- Forbidden transform guard: no app runtime code implements ingestion, parsing, scraping, prompt generation, markdown generation, or pipeline scheduling.
- Legacy boundary guard: new runtime implementation does not reactivate `mobile/`, `uniCloud/`, or `admin/` as primary shell paths.
- Runtime package guard: accepted package metadata includes package id, product key, release/revision time, availability, and content index.
- Service seam guard: Supabase, RevenueCat, and notifications remain adapter seams until credentials and ownership are human-confirmed.
