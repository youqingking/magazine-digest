# H1a Integration Plan

## Scope Boundary

- This document plans H1b integration points only.
- It does not implement real payment in the main project.
- It does not change frozen Stage B billing contracts.

## H1b Planned Integration Seams

### Server And uniCloud

1. Copy the validated example baseline `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js` into the main project.
2. Upload `uni-config-center` after each config change.
3. Upload `uni-pay`.
4. Upload `uni-pay-co`.
5. Initialize required payment-related database tables in the project service space.
6. Bind provider callback traffic to the deployed main-project `uni-pay-co` endpoint only after example validation is already green.

### Backend Contract Mapping

- `billing.createOrder`
  - H1b implementation must keep Stage B request/response semantics unchanged.
  - `pricing_plan_id`, `original_amount_fen`, `final_amount_fen`, and `idempotency_key` remain canonical.
- `billing.confirmOrder`
  - must update facts and projections from provider-confirmed billing facts only.
- `billing.handleWebhook`
  - must stay idempotent on provider event identity.
- `payment_orders`, `subscription_records`, and `entitlements`
  - remain fact -> projection flow only.

### Frontend Planning Only

- reserve a payment success page path in planning, but do not implement it in H1a
- if H1b uses official `uni-pay` pages, the likely reservation is under `subPackages` with `root: "uni_modules/uni-pay/pages"`
- if a future `uni-app x` migration happens, the equivalent reservation becomes `root: "uni_modules/uni-pay-x/pages"`
- paywall/profile/settings entry points should call the future billing integration through frozen contracts, not direct provider SDK logic

## H1b Entry Criteria

- `uni-pay` example project has been run successfully with the chosen provider set
- provider selection is frozen
- merchant ids, app ids, certs, keys, and callback ownership are present outside the repo
- test/prod separation is explicit
- webhook retry owner and monitoring owner are named
- Stage B, G, H0, and H1 gate validators remain green
- H1a validator and readiness smoke are green

## Explicit Non-Plan Items

- no direct webhook wiring in H1a
- no main-project order creation in H1a
- no entitlement grant implementation in H1a
- no replacement of Stage G preview-only shells in H1a

## Suggested H1b Sequence

1. copy the validated payment config baseline
2. deploy `uni-config-center`, `uni-pay`, and `uni-pay-co`
3. initialize database tables
4. implement server-side create-order under frozen Stage B contract
5. implement callback / webhook ingestion
6. project confirmed billing facts into `subscription_records` and `entitlements`
7. connect paywall/profile read surfaces to the fact-backed subscription state

## NEED_HUMAN Before H1b

- provider and merchant final choice
- certificate and private key custody
- callback domain and service space ownership
- real merchant verification evidence from the example project
