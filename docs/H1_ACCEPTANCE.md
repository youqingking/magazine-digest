# H1 Acceptance

## Entry Criteria

- H0 and H0.5 foundations are closed with explicit smoke-only vs production-path boundaries.
- Stage B, F1, G, and H0 validators remain green.
- H1 scope, non-goals, risks, payment readiness, and smoke infra boundary docs are present and internally consistent.
- production-path billing owners, provider choice, merchant account, certificates, webhook endpoint ownership, and secret handling are identified.
- at least one end-to-end acceptance scenario is defined for:
  - order create idempotency
  - provider confirmation or webhook replay
  - subscription activation projection
  - access control sees the new entitlement state

## Completion Criteria

- real payment path can create one valid `payment_orders` fact from a production-ready pricing plan selection
- confirmation handling is idempotent on provider event identity and cannot duplicate subscription cycles
- `subscription_records` and `entitlements` are updated from billing facts, not direct UI mutation
- paywall/profile/access surfaces can read the resulting subscription state without breaking Stage G preview semantics
- audit/event traces exist for order create, confirmation, replay handling, and entitlement activation outcome
- smoke-only auth and harness channels remain available for testing, but are clearly excluded from the production-path definition

## Gate Interpretation

- `planning gate`: passes when scope, acceptance, risks, readiness, and smoke boundary are clear enough to start H1 implementation planning
- `implementation gate`: passes only when provider credentials, certificates, webhook prerequisites, and production-path ownership are actually ready
