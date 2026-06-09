# Shared Schema Candidates

## Purpose

Identify which current data models are already suitable for the shared platform base, which need generic alias contracts first, and which must remain domain-specific.

## Shared As-Is

These collections are already product-platform oriented and should move into the shared base with minimal or no renaming:

- `products`
- `user_profiles`
- `user_product_profiles`
- `device_installations`
- `entitlements`
- `pricing_plans`
- `quota_policies`
- `payment_orders`
- `subscription_records`
- `promo_campaigns`
- `promo_codes`
- `promo_redemptions`
- `referrals`
- `reward_ledger`
- `feature_flags`
- `experiments`
- `experiment_assignments`
- `notification_campaigns`
- `notification_deliveries`
- `notification_inbox`
- `user_notification_prefs`
- `event_logs_raw`
- `event_metrics_daily`
- `audit_logs`
- `publish_batches`
- `user_follows`
- `user_content_state`

## Shared With Generic Alias First

These are shared-platform candidates, but current magazine-biased naming should be hidden behind adapter contracts before any physical rename:

| Current collection | Shared contract alias | Why alias first |
| --- | --- | --- |
| `publications` | `content_sources` | YouTube can map channel or creator source here, but current physical name is print-biased |
| `articles` | `content_items` | Shared base needs a generic content noun |
| `article_variants` | `content_variants` | Variant logic is shared, but `article` naming is not |

## Candidate Generic Field Aliases

| Current field | Shared alias |
| --- | --- |
| `publication_id` | `source_id` |
| `publication_key` | `source_key` |
| `article_id` | `content_item_id` |
| `article_key` | `content_key` |
| `source_article_uid` | `source_content_uid` |
| `article_variant_id` | `content_variant_id` |

Rule:

- introduce these aliases in package contracts and adapters first
- do not backfill or rename persisted fields in this step

## Magazine-Only Schemas And Data Sources

These stay outside the shared core:

- issue registry data and issue-level ops files
- publication taxonomy maps
- article metadata override files
- release-candidate pack quality files tied to publication or issue

## YouTube-Only Candidate Schemas

Future YouTube domain tables should remain outside the shared core, then map into shared contracts:

- `channels` or creator-source registry
- `videos`
- `playlists`
- transcript asset metadata
- chapter/timestamp metadata
- thumbnail or poster-set metadata
- video moderation or rights metadata

## Recommended Shared Schema Introduction Policy

1. keep current UniCloud collections unchanged for the magazine app
2. add shared package-level DTOs and adapters
3. extract shared runtime/admin logic against DTOs, not raw collection names
4. introduce new generic collections only if both magazine and YouTube truly need common persistence, not just common runtime behavior

## Minimum Shared Persistence Set

If a future step needs explicit generic persistence, this is the smallest reasonable set:

- `content_sources`
- `content_items`
- `content_variants`
- `release_batches`
- `user_content_state`
- `user_follows`

Until then, current magazine collections remain the migration-safe source.
