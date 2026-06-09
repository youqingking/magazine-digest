# Stage E0 Decisions

## Canonical source remains unchanged

- Stage B contracts and Stage D backend local runtime remain the canonical source of truth.
- `fixtures/db/seed/*`, backend surfaces, and frozen docs continue to own contract semantics.
- `mobile/fixtures/runtime/*` is generated output only and is not a new source-of-truth layer.

## Why mobile fixtures exist

- Stage E0 is `local-runtime-first` and must not couple mobile pages to Node-only backend modules.
- `scripts/bootstrap/export-mobile-runtime-fixtures.mjs` calls the Stage D local runtime and exports mobile-safe snapshots.
- The exported bundle is a transition layer that preserves surface shapes while allowing shell/smoke validation without HBuilderX or cloud runtime.

## Event landing in Stage E0

- Event wiring goes through the mobile adapter path for `event-ingest`.
- Accepted events are stored in a local in-memory queue plus dedup map for debug/smoke visibility.
- Real external analytics is intentionally out of scope.
- Connected now:
  - `article_impression`
  - `article_open`
  - `variant_switch`
  - `read_progress`
  - `paywall_impression`
- Placeholder but contract-shaped:
  - `plan_select`
  - `share_click`

## Boundary callouts

- No real payment, push, login, referral bind, promo redeem, reward grant, or cloud integration is added.
- Backend/admin changes stay limited to export/smoke support; Stage D foundation is not rewritten.
