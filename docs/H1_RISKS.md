# H1 Risks

## Payment Config And Certificate Risk

- merchant identifiers, app identifiers, callback domains, private keys, platform certificates, and webhook secrets are still manual dependencies
- placeholder env or local-only secrets can make a build look ready while the real provider path is still non-functional
- sandbox and production credential mix-ups can produce false-positive smoke results

## Webhook, Idempotency, And Projection Risk

- provider replay can duplicate confirmation processing unless `provider_event_id` and order idempotency are enforced server-side
- entitlement grant must stay a projection from billing facts; direct writes risk drift between `payment_orders`, `subscription_records`, and `entitlements`
- partial failure between order confirmation, subscription write, and entitlement projection can create user-visible access inconsistencies

## Smoke Infra Misclassification Risk

- H5 `auth-test` flow, `h0_5-web-auth-smoke`, `device-sync-co.verifyCurrentDeviceRecords`, and H0.5 automation are smoke_only infrastructure
- if those channels are misread as production auth, the team can incorrectly claim H1 readiness before the real checkout and activation path exists
- `not_production_path` markers must remain explicit in docs, scripts, and page copy
