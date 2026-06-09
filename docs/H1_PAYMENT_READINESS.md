# H1 Payment Readiness

## Required Before Real Payment

- chosen payment provider and exact product-to-provider mapping
- merchant id, app id, channel id, and callback domain
- provider private key, platform certificate, webhook verification secret, and certificate rotation owner
- server-side order idempotency storage and replay handling policy
- webhook endpoint route, signing verification, retry policy, and monitoring owner
- subscription lifecycle mapping from provider states to `subscription_records`
- entitlement projection job or transactional update strategy tied to billing facts

## Current Repo Status

### Already Present

- Stage B billing contracts for `billing.createOrder`, `billing.confirmOrder`, and `billing.handleWebhook`
- fact/projection table positioning for `payment_orders`, `subscription_records`, and `entitlements`
- Stage G commercial preview shells and paywall/profile benefit read models
- Stage H0 remote/auth/device/push seams and H0.5 smoke infrastructure
- synthetic scenarios that cover paywall preview, campaign preview, promo preview, referral preview, and entitlement/profile read surfaces

### Still Placeholder Or Missing

- real provider selection and merchant parameters
- real certificate and webhook secret material
- real callback endpoint ownership and deployment binding
- real order creation implementation behind the frozen contract
- real confirmation/webhook processing path
- real entitlement activation projection logic
- production monitoring and replay handling for provider failures

## Placeholder Evidence

- `backend/config/remote-runtime-config.mjs` still defaults to `https://placeholder.invalid/runtime`
- `mobile/api/remote-runtime-api.js` still points at placeholder runtime base URL
- `.env.example`, `mobile/.env.example`, and `admin/.env.example` still leave payment-adjacent runtime ids and push ids blank
- current commercial foundation explicitly states `no real payment provider, no real order creation, no real webhook settlement`

## Gate Reading

- planning gate readiness: satisfied when the missing items are documented and owned
- implementation gate readiness: not satisfied while merchant config, certs, webhook prerequisites, and activation path remain placeholder or absent
