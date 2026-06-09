# H1 Scope

## Goal

- H1 is the first real payment and subscription activation implementation stage.
- H1 converts the existing commercial, growth, remote, auth, and push foundations into a minimal production-capable payment path.
- H1 must keep Stage B canonical `fen`, `price_multiplier_basis_points`, `vip_days`, and `Asia/Shanghai` semantics unchanged.

## In Scope

- real provider-facing payment configuration wiring behind frozen Stage B billing contracts
- real `billing.createOrder` implementation with server-side pricing snapshot, idempotency, and audit trace
- real payment confirmation ingestion through provider callback or webhook handling
- `payment_orders` -> `subscription_records` -> `entitlements` activation path with traceable fact-to-projection linkage
- minimal subscription status projection needed for paywall, profile benefit summary, and access control
- production-path boundary cleanup so smoke/test infra is not presented as product capability

## Out Of Scope In H1 Gate Prep

- no real provider integration is implemented in this stage
- no real order creation, confirmation, webhook settlement, or entitlement grant is implemented in this stage
- no rewrite of Stage G commercial foundation or Stage H0 auth/device/push foundation
- no change to synthetic pack canonical source rules

## H1 Implementation Boundaries

- H1 should implement only the minimum path required to sell one frozen plan family and activate one subscription truth path.
- H1 should not expand into broad billing operations, complex reconciliation consoles, or multi-provider orchestration.
- H1 should consume existing product, plan, campaign, promo, entitlement, and event contracts instead of inventing parallel semantics.
