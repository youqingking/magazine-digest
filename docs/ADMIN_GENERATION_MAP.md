# Stage D Admin Generation Map

## Generated resources

- `products`
- `publications`
- `articles`
- `pricing_plans`
- `quota_policies`
- `promo_campaigns`
- `promo_codes`
- `feature_flags`
- `experiments`

These stay generated because their Stage B contracts are schema-first and fit resource-registry driven CRUD rails.

## Manual modules

- `article_variants_publish_flow`
- `article_variants_fallback_safety_preview`
- `pricing_rule_inspector`
- `metrics_summary_shell`
- `referral_anti_abuse_console`

These stay manual because they carry publish workflow, fallback safety, pricing precedence inspection, metrics aggregation, or anti-abuse review beyond plain CRUD.

## Mapping to Stage B

- Generated resources map directly to `database/*.schema.json`.
- Manual modules map to:
  - `article_variants` state machine and safe fallback rules
  - pricing precedence and canonical money rules
  - event and referral audit views without enabling business writes
