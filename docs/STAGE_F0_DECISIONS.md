# Stage F0 Decisions

## Scope Freeze

- Stage F0 is a discoverability and notification spec patch only.
- No real push transport, no mobile/admin/backend feature implementation, and no rewrite of existing Stage B/C/D/E0/E1 paths.
- Stage B canonical contracts remain intact; F0 adds parallel metadata and user-state contracts.

## Minimal Revisions To Existing Contracts

- `article_variants` gains additive optional discovery metadata fields instead of moving publication truth elsewhere.
- Content selection precedence gains `available_from` / `available_until` gating after publish effectiveness.
- `event_logs_raw` extends the event enum only; the ingest contract stays append-only and idempotent.

## Deferred Decision

- `saved_filters` is deferred beyond F0.

Reason:

- The search facet vocabulary and follow taxonomy are not stable enough to freeze a persistent filter object shape.

## Stage Impact

- E1 remains unchanged.
- F1 can build read models, local adapters, and thin service wiring on top of the new tables and surfaces without reopening Stage B billing or safety design.
- The former commercial closed-loop stage moves back one slot so discovery retention groundwork lands first.

## Updated Stage Order

1. Stage A: governance docs, harness, and sample fixtures.
2. Stage B: schema and codegen design freeze.
3. Stage C: uni-admin, uniCloud, and schema2code integration.
4. Stage D: client shell, cache, push stubs, and analytics foundation.
5. Stage E0: mobile read path shell and local runtime path.
6. Stage E1: compile-readiness, smoke stabilization, and reporting.
7. Stage F0: discoverability and notification spec patch.
8. Stage F1: discovery and notification foundation across contracts, read models, local adapter seams, and harness planning.
9. Stage G: former commercial closed-loop stage for referral, coupon, anti-abuse, and experiment integration.
