# Stage E0 Local Mobile Adapter

## Current local adapter

- `mobile/api/local-runtime-api.js` is the mobile-facing adapter.
- It reads generated fixture snapshots from `mobile/fixtures/runtime/index.js`.
- The snapshots are exported from Stage D local runtime surfaces by `scripts/bootstrap/export-mobile-runtime-fixtures.mjs`.
- Mobile pages call `mobile/services/runtime-gateway.service.js`, not backend Node modules directly.

## Remote switch path

- `mobile/services/runtime-gateway.service.js` routes by `session.store.runtimeMode`.
- `local` uses the exported fixture bridge.
- `remote` uses `mobile/api/remote-runtime-api.js`, which is intentionally a Stage E0 stub and returns `REMOTE_RUNTIME_STUB_NOT_CONNECTED`.
- Future remote integration can replace only `remote-runtime-api.js` while keeping page/service/store contracts stable.

## Surface status

- Available now:
  - `bootstrap-config`
  - `content-sync-delta`
  - `content-detail`
  - `entitlement-snapshot`
  - `pricing-preview`
  - `experiment-assign`
  - `event-ingest` via mobile local queue adapter
- Stub only:
  - remote runtime transport
  - real billing/order creation
  - real promo redeem / referral bind / reward grant
