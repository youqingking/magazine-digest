# Stage H0 Acceptance

## Completion standard

- remote runtime seam exists and supports `local`, `remote`, and `hybrid`
- auth, device, and push foundation surfaces exist in backend and mobile
- `notification_inbox` remains truth and `notification_deliveries` remains transport/fact preview
- settings, profile, inbox, and feed expose H0 runtime/auth/push state without replacing Stage E2/F1/G UX
- admin exposes minimal generated/manual mapping for remote runtime and push foundation
- H0 events are present in contracts and routed through the existing local queue/debug sink seam
- Stage B, F1, and G validators remain green

## Explicit non-goals

- no real payment provider
- no real create order / confirm order / webhook / entitlement grant
- no markdown importer or external content ingestion
- no real push vendor fanout console
- no full account center or release prep
