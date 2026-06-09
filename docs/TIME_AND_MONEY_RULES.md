# Stage B Time And Money Rules

## Canonical Freeze

- All monetary settlement fields use integer `fen`. Stage B canonical examples are `pricing_plans.price_fen`, `pricing_plans.price_floor_fen`, `payment_orders.original_amount_fen`, and `payment_orders.final_amount_fen`.
- Float money is forbidden in schema, seed, and contract examples.
- Pricing discounts use exactly one canonical multiplier field: `price_multiplier_basis_points`.
- `price_multiplier_basis_points=3000` means the final payable amount is 30 percent of the base plan price, which is the canonical representation of `3折`.
- Reward settlement uses integer `vip_days`; natural-language units such as `2个月` or `2 months` are documentation aliases only and must not be stored as the settlement unit.

## Timezone Freeze

- Daily quota reset, campaign window checks, subscription lifecycle evaluation, and publish-window evaluation all use `Asia/Shanghai`.
- Timestamps must be stored as ISO 8601 strings with explicit offsets. Stage B fixtures use `+08:00` to match `Asia/Shanghai`.
- Cross-day calculations must be based on Shanghai calendar boundaries, not device local time.

## Table-Level Rules

- `pricing_plans` is the source of truth for base `price_fen` and minimum payable `price_floor_fen`.
- `promo_campaigns` uses `price_multiplier_basis_points` for price offers and `reward_vip_days` for reward-style campaigns when a direct grant amount is frozen in Stage B.
- `promo_codes` inherits campaign semantics and must not introduce a second discount-unit system.
- `payment_orders` persists `original_amount_fen` and `final_amount_fen` as the immutable billing fact snapshot.
- `reward_ledger` persists `vip_days` as the canonical reward settlement unit.

## Interpretation Notes

- Display-layer copy may still say `3折` or `7折优惠`, but settlement must resolve to `price_multiplier_basis_points`.
- Display-layer copy may still say `2个月会员`, but settlement must resolve to integer `vip_days` before writing facts or ledgers.
