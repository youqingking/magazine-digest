# Shared Platform Base Freeze

## Goal

Freeze a reusable platform base that can serve the current magazine-summary app and a future YouTube-summary app without building a second stack, without writing new business pages, and without moving content production into this repo.

## Frozen Decisions

- Shared base stays on `UniApp + uni-admin + UniCloud`.
- Shared base is `product_key` first. Every shared contract, event, cache key, and admin query remains product-scoped.
- Shared base is content-type-agnostic at the package API layer. New shared APIs must not introduce `article`, `magazine`, `publication`, or `issue` names.
- Existing magazine storage and runtime names may remain temporarily behind adapter layers for migration safety.
- Content production remains out of repo. The app consumes standardized processed content only.
- This step adds docs/contracts only. No business pages, parser logic, transcript logic, PDF/web/video ingestion, or second tech stack.

## Shared Base Scope

Shared base owns the reusable shell and platform capabilities below:

- product bootstrap, runtime-source selection, release metadata, and remote/local fallback
- content selection by `audience_segment`, `reading_mode`, availability window, and publish status
- local cache, delta sync, tombstones, and offline fallback
- entitlement, quota, pricing preview, paywall decision, and offer aggregation
- experiments, feature flags, rule precedence, and dynamic config consumption
- discovery feed, follow graph, inbox, notification preferences, publish-batch summary, save-for-later, and resume state
- device registration, push capability, delivery preview, and durable inbox-first notification model
- event ingest, observability, audit, and release/runtime proof
- shared mobile UI primitives, shared admin rails, and shared harness/fixture flows

## Shared Nouns

These are the only nouns that new shared packages should expose:

- `product`
- `content_source`
- `content_item`
- `content_variant`
- `release_batch`
- `user_content_state`
- `follow_subject`
- `access_snapshot`
- `offer`
- `promotion`
- `referral`
- `notification`
- `experiment`
- `event`
- `audit_record`

## Current Magazine Mapping To Shared Nouns

For low migration cost, the existing magazine app maps into the shared base like this:

| Current noun | Shared noun |
| --- | --- |
| `publications` / `publication_id` | `content_source` / `source_id` |
| `articles` / `article_id` | `content_item` / `content_item_id` |
| `article_variants` | `content_variant` |
| `publish_batches` | `release_batch` |
| `user_content_state` | `user_content_state` |

Rule:

- Keep current physical schemas and fixtures stable in the magazine app for now.
- Add shared aliases in contracts/runtime packages before any physical rename.

## Capabilities That Must Move To Shared First

These are the highest-leverage extractions because both apps need them with little or no domain rewrite:

1. shared contracts and enums for product, content variant selection, access, pricing, experiments, notifications, and events
2. runtime gateway, adapter selection, cache keys, delta sync, tombstones, and offline fallback
3. entitlement snapshot, pricing preview, quota status, promo preview, and paywall decision logic
4. discovery, inbox, follows, save-for-later, resume projection, and publish-batch summary
5. push/device foundations, notification preferences, delivery preview, and inbox durability rules
6. observability, audit, runtime proof, and release/runtime-source metadata
7. shared UI primitives and shell-level cards used by both content products
8. shared admin generation rails and shared manual consoles for platform entities
9. shared harness, fixtures, schema validation, and runtime scenario validation

## Monorepo Package Layout Proposal

```text
apps/
  magazine-mobile/
  youtube-mobile/
  operator-admin/
packages/
  attention-core-contracts/
    src/content/
    src/access/
    src/commercial/
    src/discovery/
    src/notification/
    src/growth/
    src/runtime/
    src/telemetry/
  attention-core-runtime/
    src/adapters/
      magazine/
      youtube/
    src/cache/
    src/content/
    src/access/
    src/commercial/
    src/discovery/
    src/notification/
    src/runtime-source/
    src/telemetry/
  attention-core-mobile-ui/
    src/components/ui/
    src/components/content/
    src/components/discovery/
    src/components/commercial/
    src/components/account/
    src/theme/
  attention-core-admin/
    src/generated/
    src/manual/
    src/workflows/
    src/contract-map/
  attention-core-harness/
    scripts/contracts/
    scripts/runtime/
    scripts/schema/
    fixtures/core/
    reports/
```

## Package Responsibilities

- `attention-core-contracts`: shared nouns, DTOs, enums, rule precedence, and adapter-facing interfaces
- `attention-core-runtime`: reusable runtime services, gateways, selectors, caches, projections, and platform read models
- `attention-core-mobile-ui`: shell-safe components and tokens, but no magazine or YouTube page implementations
- `attention-core-admin`: shared generated CRUD rails plus shared workflow consoles for platform entities
- `attention-core-harness`: schema checks, fixture exports, scenario validation, and runtime smoke orchestration

## What Shared Base Explicitly Does Not Own

- magazine issue registry, issue ingest rules, article metadata overrides, and publication taxonomy normalization policy
- YouTube channel/video transcript ingestion, transcript cleanup, caption parsing, or watch-page scraping
- magazine or YouTube business pages
- source-specific editorial policy

## Low-Cost Migration Rules

- Extract by facade first, move files second, rename tables last.
- Keep UniCloud collections stable until both apps need a shared persistence shape.
- Prefer adapter maps over one-shot renames.
- Keep existing backend surface names stable externally unless a shared alias can be added without breaking current callers.
- Avoid schema churn that forces backfill before the second product exists.

## Step 02 Prompt

Use this prompt for the next thread:

> Step 02: scaffold the shared monorepo base without building business pages. Create the proposed `attention-core-*` package folders, package manifests, index exports, and adapter seams. Move only shared contracts/runtime/admin/harness entrypoints behind package facades, keep the current magazine app behavior unchanged, do not rename UniCloud collections yet, and add validation commands that prove the new package boundaries compile.
