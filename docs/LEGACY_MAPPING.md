# Legacy Mapping

## Principle

Legacy `app_config` style concepts are decomposed into dedicated contract tables. Stage B does not recreate a single `app_config` truth table.

## Mapping Table

| Legacy concept | New contract owner |
| --- | --- |
| `app_config.free_quota_per_day` | `quota_policies.daily_limit` |
| `app_config.current_discount_rate` | `promo_campaigns.price_multiplier_basis_points` and pricing settlement rules |
| `app_config.is_internal_beta` | `feature_flags.flag_key=internal_beta_access` plus optional `promo_campaigns` targeting |
| `app_config.plan_price` | `pricing_plans.price_fen` |
| `app_config.plan_visibility` | `pricing_plans.is_default_display` and `feature_flags` |
| `app_config.share_bonus` | `promo_campaigns.reward_policy_ref` and `reward_ledger` |
| `app_config.content_fallback` | `article_variants.fallback_policy` |
| `app_config.product_enabled` | `products.active_status` and kill-switch `feature_flags` |

## Migration Notes

- `free_quota_per_day` becomes versioned policy data in `quota_policies`, scoped by `product_key`.
- `current_discount_rate` is no longer a global mutable scalar; campaign and promo layers each own their own `price_multiplier_basis_points`.
- `is_internal_beta` separates availability from pricing. Access gating belongs to `feature_flags`, while the 3-discount offer belongs to `promo_campaigns`.
