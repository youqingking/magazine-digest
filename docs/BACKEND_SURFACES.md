# Stage D Backend Surfaces

## Implemented now

- `bootstrap-config`
- `content-sync-delta`
- `content-detail`
- `entitlement-snapshot`
- `pricing-preview`
- `experiment-assign`
- `event-ingest`

## Stub only

- `promo.redeem`
- `growth.bindReferral`
- `growth.grantReward`

## Future stage

- `billing.createOrder`
- `billing.confirmOrder`
- `billing.handleWebhook`

## Contract mapping notes

- `content-detail` follows the Stage B `content.resolveVariant` response shape.
- `content-sync-delta` follows `docs/CONTENT_SYNC.md`.
- `entitlement-snapshot` uses the frozen `access.evaluate` response fields for local read-only decisions.
- `pricing-preview` applies `pricing_plans.price_fen`, campaign `price_multiplier_basis_points`, and `price_floor_fen` only.
- `event-ingest` keeps duplicate detection on `dedup_key`.
