# Shared Surfaces

## Purpose

List the reusable surfaces that belong in the shared platform base and identify where the current repo already contains them.

## Contract Surfaces

These contracts belong in `attention-core-contracts`:

- content selection and sync
- access and entitlement evaluation
- pricing preview, quota, promo preview, and benefits summary
- experiments and feature flags
- discovery, search, follows, inbox, notification prefs, save-for-later, resume, release-batch summary
- device registration, push capability, delivery preview
- event ingest, audit, and observability event schema

## Runtime Surfaces

These backend/runtime surfaces are shared-first:

| Current surface | Shared family |
| --- | --- |
| `bootstrap-config` | product/runtime bootstrap |
| `content-detail` | content resolution |
| `content-sync-delta` | content sync |
| `content-resume` | user content state |
| `save-for-later` | user content state |
| `entitlement-snapshot` | access |
| `pricing-preview` | commercial |
| `quota-status` | commercial |
| `promo-preview` | commercial |
| `commercial-offer` | commercial |
| `profile-benefits` | commercial |
| `experiment-assign` | experimentation |
| `home-discovery` | discovery |
| `search-content` | discovery |
| `follow-catalog` | discovery |
| `follow-toggle` | discovery |
| `notification-inbox` | notification |
| `notification-prefs` | notification |
| `mark-inbox-read` | notification |
| `notification-delivery-preview` | notification |
| `publish-batch-summary` | release/discovery |
| `register-device` | device foundation |
| `push-capability` | push foundation |
| `event-ingest` | telemetry |
| `auth-session`, `auth-refresh`, `auth-signout` | identity foundation |

## Mobile Runtime Services

These services are shared-package candidates before any page extraction:

- `cache.service.js`
- `content-sync.service.js`
- `content-state.service.js`
- `runtime-gateway.service.js`
- `runtime-source.service.js`
- `remote-runtime.service.js`
- `entitlement.service.js`
- `pricing.service.js`
- `quota.service.js`
- `promo.service.js`
- `experiment.service.js`
- `discovery.service.js`
- `follow.service.js`
- `notification.service.js`
- `push.service.js`
- `observability.service.js`
- `event-ingest.service.js`

## Shared Mobile UI Surfaces

These components can move into `attention-core-mobile-ui` without dragging page logic with them:

- `mobile/components/ui/*`
- shell-safe blocks in `mobile/components/discovery/*`
- shell-safe blocks in `mobile/components/commercial/*`
- shell-safe blocks in `mobile/components/account/*`
- `mobile/theme/*`

Rule:

- no page containers
- no magazine-only route assumptions
- no issue/publication copy baked into shared props

## Shared Admin Surfaces

These resources belong in `attention-core-admin`:

- generated CRUD rails for `products`, `pricing_plans`, `quota_policies`, `promo_campaigns`, `promo_codes`, `feature_flags`, `experiments`, notification resources, and shared user-state resources
- shared manual consoles for access, pricing inspection, notification policy, reward/referral audit, and release-batch inspection
- shared contract-map and resource-registry services

## Harness Surfaces

These capabilities belong in `attention-core-harness`:

- contract validation
- schema sync checks
- runtime scenario export/select flows
- shared smoke entrypoints
- runtime-source and release proof reporting

## New Shared API Naming Rule

When extracting or adding new shared code:

- prefer `content_item` over `article`
- prefer `content_source` over `publication`
- prefer `release_batch` over `issue_release`
- prefer `follow_subject` over `publication_follow`
- prefer `content_detail` over `article_detail`

Current API names may remain in place until adapters are introduced.
