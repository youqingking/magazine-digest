# Stage B Route Freeze

## Purpose

Stage B only freezes route namespaces and payload boundaries for later UniApp, uni-admin, UniCloud, uni-id, and uni-pay integration. No formal page implementation or cloud function implementation is included in this stage.

## Client Route Namespaces

| Namespace | Purpose | Notes |
| --- | --- | --- |
| `/pages/home` | Home feed, publication entry, paywall prompts | Must consume `article_variants` only after contract-based selection |
| `/pages/article` | Article reading surface | Reads logical `articles` plus resolved `article_variants` |
| `/pages/profile` | Product-scoped preferences and entitlement summary | Uses `user_product_profiles` and `entitlements` projection |
| `/pages/subscription` | Pricing plan display and order creation entry | Reads `pricing_plans`, `promo_campaigns`, `feature_flags`, `experiments` |
| `/pages/referral` | Referral binding and invite progress | Reads `referrals`, `reward_ledger`, `promo_codes` |
| `/pages/system` | Consent, kill-switch unavailable state, sync diagnostics | Reads `products`, `feature_flags`, sync metadata |

## uni-admin Route Namespaces

| Namespace | Purpose | Stage B note |
| --- | --- | --- |
| `/admin/products` | Product metadata and lifecycle | Can be code-generated from `products` schema later |
| `/admin/publications` | Publication registry | Can be code-generated |
| `/admin/articles` | Article root object management | Can be code-generated with custom variant linkage UI later |
| `/admin/article-variants` | Variant publishing workflow | Requires hand-written workflow layer around schema-generated CRUD |
| `/admin/pricing` | Pricing plans and campaign management | Mixed: CRUD can be code-generated, pricing preview must be hand-written |
| `/admin/promotions` | Promo campaigns, promo codes, redemptions | Mixed: CRUD plus custom anti-abuse review screens |
| `/admin/experiments` | Experiment and assignment audit | Mixed: CRUD plus assignment replay tooling |
| `/admin/audit` | Audit logs and event metrics | Read-only analytics pages should be hand-written |

## UniCloud API Families

| Family | Example contract key | Backing tables |
| --- | --- | --- |
| `content.*` | `content.resolveVariant`, `content.syncDelta` | `articles`, `article_variants`, `publications` |
| `profile.*` | `profile.get`, `profile.upsertPreferences` | `user_profiles`, `user_product_profiles`, `device_installations` |
| `access.*` | `access.evaluate`, `access.consumeQuota` | `entitlements`, `quota_policies`, `quota_consumption_logs`, `feature_flags` |
| `billing.*` | `billing.createOrder`, `billing.confirmOrder`, `billing.handleWebhook` | `pricing_plans`, `payment_orders`, `subscription_records`, `entitlements` |
| `promo.*` | `promo.preview`, `promo.redeem` | `promo_campaigns`, `promo_codes`, `promo_redemptions` |
| `growth.*` | `growth.bindReferral`, `growth.grantReward` | `referrals`, `reward_ledger`, `promo_campaigns` |
| `experiment.*` | `experiment.assign`, `experiment.lookup` | `experiments`, `experiment_assignments` |
| `event.*` | `event.ingest` | `event_logs_raw`, `audit_logs` |

## Route Guard Contracts

| Guard | Decision source | Failure behavior |
| --- | --- | --- |
| Product availability | `products.active_status`, `feature_flags` kill switch | Return unavailable reason, no silent fallback |
| Auth requirement | `feature_flags` or API policy | Trigger uni-id login flow |
| Audience safety | `user_product_profiles.audience_segment` and variant selection rules | Never cross into unsafe `adult` fallback for teen requests |
| Entitlement access | `entitlements` current-state projection | Show paywall or quota message |
| Quota fallback | `quota_policies`, `quota_consumption_logs` | Return explainable quota denial reason |

## Non-Goals

- No formal page file generation in Stage B
- No uni-admin scaffolding in Stage B
- No UniCloud function implementation in Stage B
