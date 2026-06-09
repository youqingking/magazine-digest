# Stage H0 Decisions

## Frozen decisions

- H0 is additive only and does not rewrite Stage B canonical money, discount, reward, or timezone semantics.
- Existing tables are reused with additive fields. No new canonical billing or content table is introduced.
- `notification_inbox` stays the durable user-visible truth. `notification_deliveries` remains delivery/transport fact preview.
- Runtime switching uses `local`, `remote`, and `hybrid`. `hybrid` means remote seam with local fallback.
- Remote runtime is config-backed stub in H0. Stable contract shape matters more than live connectivity.
- uni-id / auth integration is foundation-only: session, refresh, and signout seam. No full sign-in flow is required.
- Device registration captures `installation_id`, `device_id`, `push_clientid`, `appid`, `product_key`, and `last_seen_at`.
- Admin remains generated/manual dual-rail; H0 only adds inspectors and read-only mappings.
