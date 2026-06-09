# Stage F1 Decisions

## Scope freeze

- F1 is a local-runtime-first discovery and notification foundation stage.
- No real push provider, no remote runtime, no payment/login/referral/promo closed loop.
- Stage B money, timezone, discount, and reward semantics remain untouched.

## Runtime strategy

- Selected synthetic runtime scenario in `mobile/fixtures/runtime/current/runtime.bundle.json` is the shared local truth input for F1 discovery/notif flows.
- Backend surfaces read the selected runtime bundle through the fixture repository.
- Mobile local adapter reads the same bundle and keeps mutable session-level follow/inbox/prefs/content-state overlays in memory and local cache.

## Deferred items

- `saved_filters` persistence remains deferred.
- Remote delivery logs and real push transport remain future-stage concerns.
- Ranking / ML recommendation remain out of scope.
