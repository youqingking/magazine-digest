# Stage E1 Decisions

## Scope freeze

- Stage E1 only fixes mobile compile-readiness, runtime smoke blockers, and reporting gaps.
- Stage B canonical money, timezone, discount, reward, entitlement, and safety contracts remain unchanged.
- No real payment, login, referral bind, promo redeem, reward grant, push, or remote runtime connection is introduced.

## Compile-readiness decisions

- `mobile/` no longer imports `shared/` files outside the uni-app project root. Small frozen contract constants are mirrored into `mobile/contracts/runtime-contract.js` so HBuilderX can compile the mobile project as a standalone shell without changing semantic source-of-truth.
- `mobile/main.js` is aligned to the uni-app Vue 3 bootstrap shape with `createSSRApp`.
- `mobile/App.vue` is reduced to lifecycle hooks plus global `page` styling so the app shell matches uni-app expectations instead of rendering a slot wrapper.

## Smoke and debug decisions

- Stage E1 keeps the Stage E0 local-runtime-first path and only adds lightweight read-only debug visibility in Settings:
  - runtime mode
  - audience mode
  - reading mode
  - cache key count
  - last queued event status
- No heavy debug panel, no new remote transport, and no contract mutation was added.

## Real compile decision

- This environment does not expose `HBuilderX.exe`, so Stage E1 can only automate compile-readiness checks and report generation.
- Real compile must be completed manually in HBuilderX following [docs/MANUAL_HBUILDERX_STEPS.md](/D:/ws/Playground/docs/MANUAL_HBUILDERX_STEPS.md) and [docs/STAGE_E1_SMOKE_CHECKLIST.md](/D:/ws/Playground/docs/STAGE_E1_SMOKE_CHECKLIST.md).

## Known limits kept explicit

- The current frozen fixture set does not include a no-safe-content case for the existing article inventory, so the `unavailable_reason` branch is documented and checklist-backed but still requires manual or future fixture-assisted verification.
