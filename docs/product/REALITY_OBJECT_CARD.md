# Reality Object Card

## Surface Label

Magazine Digest runtime object contract.

## Real Species

Expo-first mobile runtime for efficient magazine reading and digest-style content consumption.

Evidence:

- `README.md`
- `AGENTS.md`
- `docs/harness/EXISTING_PROJECT_AUDIT.md`
- `apps/mobile/README.md`

## Seductive Class

The tempting but wrong object is a full content-production platform inside the app repository.

This contract must not turn the repo into a PDF parser, web scraper, prompt generator, markdown generator, content workflow scheduler, or editorial pipeline.

## Mechanism Class

Runtime package consumer.

The repo should accept standardized content packages and runtime metadata from an external pipeline, then prepare mobile runtime surfaces, user state, subscriptions, notifications, and data access around those packages.

## Failure Class

Boundary collapse.

The primary failure mode is mixing external content production concerns with app runtime concerns, especially by:

- Creating ingestion/parsing/generation code in the app repo.
- Treating legacy `mobile/`, `uniCloud/`, or `admin/` as the future runtime shell.
- Hardcoding product prices, entitlement rules, feature flags, experiments, operational thresholds, or risk thresholds.
- Designing data, config, or events without `product_key`.

## Repo Boundary

This repository owns runtime contracts, runtime shell direction, migration references, validation harnesses, and future implementation under:

- `apps/mobile`
- `packages/core-*`
- `infra/supabase`

This repository does not own external content production.

## External Pipeline Boundary

The external pipeline owns:

- Source acquisition.
- PDF parsing.
- Web scraping.
- Prompt generation.
- Markdown generation.
- Content package production.
- Content pipeline scheduling.

The app repo consumes only standardized content packages and runtime metadata emitted by that pipeline.

## Runtime App Boundary

The runtime app owns:

- Expo-first mobile shell behavior.
- Reading and digest consumption experience.
- Runtime package loading and presentation.
- User reading state.
- Auth and data access seams through Supabase.
- Subscription and entitlement seams through RevenueCat.
- Notification registration, inbox, and delivery seams through Expo Push, with reserved FCM/APNs seam.

## Trust Dependency

The runtime trusts standardized package metadata enough to render and sync it, but must verify package shape, required identifiers, product scoping, revision metadata, and availability state before accepting it into app runtime state.

The runtime must not trust external packages to define client-side prices, entitlement grants, experiment enrollment, risk thresholds, or security-sensitive configuration.

## Verification Depth

Minimum verification for this object:

- Required contract docs exist.
- Required headings are present.
- `product_key` is named as a first-class contract dimension.
- Forbidden transforms are explicitly listed.
- Legacy paths are declared migration references.
- Validation commands remain no-credential and do not mutate app source behavior.

## Main Clock

The main clock is content package release/revision time plus runtime availability state.

User state, entitlement state, notification state, and analytics events must be evaluated against that runtime clock and scoped by `product_key`.

## Not This Object

This is not:

- A blank Expo scaffold.
- A legacy uni-app continuation plan.
- A content ingestion system.
- A parser or scraping pipeline.
- A prompt or markdown generation workflow.
- A Supabase schema migration.
- A RevenueCat implementation.
- A push credential setup.
- A production configuration change.

## Reality Objects

```yaml
- id: magazine-digest-runtime
  kind: observed_state
  summary: Magazine Digest is documented as an Expo-first mobile runtime for magazine reading and digest-style consumption.
  evidence:
    - README.md
    - AGENTS.md
  confidence: high
  product_key_scope: required
  next_action: keep runtime contracts product_key-aware

- id: external-content-pipeline-boundary
  kind: boundary
  summary: Content production stays outside this app repository; the repo consumes standardized packages and metadata.
  evidence:
    - README.md
    - AGENTS.md
    - docs/harness/HARNESS_LANDING_PLAN.md
  confidence: high
  product_key_scope: required
  next_action: reject in-repo ingestion, parsing, scraping, prompt, markdown, or scheduling work

- id: legacy-reference-policy
  kind: decision
  summary: Legacy DCloud, uni-app, uniCloud, and admin paths are migration references unless explicitly reactivated.
  evidence:
    - README.md
    - AGENTS.md
    - docs/harness/EXISTING_PROJECT_AUDIT.md
  confidence: high
  product_key_scope: present
  next_action: land future implementation under apps/mobile, packages/core-*, and infra/supabase

- id: external-service-blockers
  kind: blocker
  summary: Real Expo/EAS, Supabase, RevenueCat, push, and legacy desktop-tool decisions remain human-owned.
  evidence:
    - docs/NEED_HUMAN.md
    - docs/harness/EXISTING_PROJECT_AUDIT.md
  confidence: high
  product_key_scope: required
  next_action: keep blockers in NEED_HUMAN before implementation threads
```
