# H1 Smoke Infra Boundary

## smoke_only

- `mobile/pages/auth-test/index.vue` is a dev-safe harness entry for auth and device verification only
- `runWebPasswordAutomation` in `mobile/services/auth.service.js` is smoke_only
- `mobile/uniCloud-aliyun/cloudfunctions/h0_5-web-auth-smoke` is smoke_only
- `device-sync-co.verifyCurrentDeviceRecords` is smoke_only
- `scripts/bootstrap/smoke-h0_5-*` and `output/stage-h0_5*` are smoke/test infrastructure artifacts

## not_production_path

- `auth-test` page route and its auto-login path are not_production_path
- H5 username/password automation is not_production_path
- direct DB verification of `opendb-device` and `uni-id-device` is not_production_path
- current H0.5 login/device automation proves smoke coverage only; it does not prove H1 payment completion

## future production path

- real payment provider SDK or server integration
- server-side `billing.createOrder`
- provider callback or `billing.handleWebhook`
- idempotent update into `payment_orders`
- derived `subscription_records`
- fact-backed `entitlements` projection consumed by access control and profile/paywall reads

## Explicit prohibition

- do not classify smoke_only auth automation as H1 completed capability
- do not count `auth-test` success, `h0_5-web-auth-smoke`, or DB verification as real checkout, subscription activation, or entitlement grant
