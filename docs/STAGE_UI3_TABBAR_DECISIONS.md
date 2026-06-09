# Stage UI3 TabBar Decisions

## Scope

- Stage UI3 changes the global navigation shell only.
- Stage UI2 page responsibilities remain intact.
- No schema, backend contract, payment semantic, or reader-flow change is allowed.

## Final TabBar

- `pages/feed/index` -> `首页`
- `pages/search/index` -> `来源`
- `pages/profile/index` -> `我的`

## Removed From TabBar But Kept As Official Pages

- `pages/paywall/index`
- `pages/invite/index`
- `pages/settings/index`
- `pages/detail/index`

## Route Policy

- tab destinations continue to use `switchTab`
- non-tab official pages use `navigateTo`
- alias pages may use `switchTab`, `redirectTo`, or internal rendering depending on whether their destination is still a tab

## Alias Decisions

- `inbox` continues to hand off to `feed`
- `follows` continues to hand off to `search`
- `campaign` now hands off to `paywall` via non-tab redirect, not `switchTab`

## Entry Decisions

- `feed` exposes a low-weight paywall entry
- `profile` exposes paywall, invite, and settings entry points
- `paywall` exposes invite entry
- `detail` continues to expose paywall through entitlement or quota CTA only

## Non-Goals

- no re-opened IA discussion
- no visual redesign round beyond small CTA or shell adjustments
- no change to detail route or reading behavior
