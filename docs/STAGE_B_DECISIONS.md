# Stage B Decisions

## Core Freeze

- Stage B freezes data contracts only.
- No UniApp page generation, uni-admin integration, UniCloud implementation, real payment, real push, or external content ingestion is included.

## User Model Decision

- `user_profiles` is global because base identity, consent acceptance, and uni-id aligned authentication should not fork across products.
- `user_product_profiles` is per-product because audience mode, language preference, sync cursor, push preference, and growth identity can differ by product.

## Product Scope Decision

Global tables:

- `user_profiles`

Product-scoped tables:

- all remaining Stage B business tables

Rationale:

- Product isolation keeps pricing, campaigns, experiments, content inventory, and anti-abuse signals from bleeding across products in the App Factory model.

## Reuse Decision For Future Product Copies

Directly reusable with branding or policy swaps:

- `products`
- `publications`
- `pricing_plans`
- `quota_policies`
- `feature_flags`
- `promo_campaigns`
- `promo_codes`
- `experiments`

Reusable only after business review:

- `articles`
- `article_variants`
- `referrals`
- `reward_ledger`
- `event_metrics_daily`

Reason:

- Content, growth incentives, and analytics baselines depend on audience and editorial strategy, not just skinning.

## Share Asset Decision

- Share copy and poster templates are not modeled as separate core tables in Stage B.
- Future ownership should live under campaign-scoped configuration, likely as structured metadata on `promo_campaigns` or a later dedicated `share_assets` table.
- They are deferred because they do not affect current contract freeze for billing, entitlement, or anti-abuse correctness.

## Schema2Code Decision

Strong schema2code candidates:

- `products`
- `publications`
- `pricing_plans`
- `quota_policies`
- `promo_campaigns`
- `promo_codes`
- `feature_flags`
- `experiments`

Needs hand-written workflow around generated CRUD:

- `article_variants` because fallback safety and publish workflow are stateful
- `payment_orders` because settlement and provider callbacks are side-effect heavy
- `subscription_records` because recurring lifecycle reconciliation is not plain CRUD
- `promo_redemptions`, `referrals`, `reward_ledger`, `event_logs_raw`, `audit_logs` because they are append-only or audit-heavy

## Replaced Legacy Contract

- `docs/DATA_CONTRACTS.md` becomes an index to the Stage B freeze documents and should no longer be treated as the authoritative table design.
