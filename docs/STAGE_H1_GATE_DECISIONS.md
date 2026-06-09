# Stage H1 Gate Decisions

## Frozen decisions

- Stage H1 Gate Prep is additive only and does not implement real payment.
- Stage B canonical billing, reward, and timezone semantics remain frozen.
- Stage G preview shells remain preview-only until H1 real payment and activation are delivered.
- smoke_only auth and harness channels stay available as test infrastructure, but are not production path.
- H1 production path is defined as provider-backed order creation, confirmation ingestion, and entitlement projection only.

## Gate outcome

- planning gate target: YES when documents, readiness inventory, and harness boundary cleanup are complete
- implementation gate target: NO until merchant config, certificates, provider credentials, webhook prerequisites, and production-path ownership are present

## Named smoke_only channels

- `/pages/auth-test/index`
- `mobile/services/auth.service.js -> runWebPasswordAutomation`
- `mobile/uniCloud-aliyun/cloudfunctions/h0_5-web-auth-smoke`
- `mobile/uniCloud-aliyun/cloudfunctions/device-sync-co -> verifyCurrentDeviceRecords`
- `scripts/bootstrap/smoke-h0_5-*`
- `output/stage-h0_5*`

## Named future production path seams

- `billing.createOrder`
- `billing.confirmOrder`
- `billing.handleWebhook`
- `payment_orders`
- `subscription_records`
- `entitlements`
