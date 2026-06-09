# Stage UI1.5 Decisions

## Stage Role

- Stage UI1.5 is `UI Merge-on-Mainline`, not a fresh UI rewrite.
- Mainline remains the base.
- Stage UI1 IA, reading structure, and editorial visual baseline are absorbed into current mainline.
- Stage G commercial and growth foundations, plus Stage H0/H1a runtime, auth, device, push, and payment-readiness seams, remain additive and visible.

## Frozen Boundaries

- Stage B canonical contracts stay unchanged.
- No schema change.
- No backend contract change.
- No payment semantic change.
- No real payment provider, webhook, or entitlement activation is introduced.
- Old inbox, follows, and campaign capabilities are retained as internal capability routes or compatibility aliases only.

## Merge Priority

1. canonical contracts
2. H0 / H1a foundation truth path and validation entry points
3. UI1 page responsibility and single-reader structure
4. Stage G commercial and growth read-model capability
5. visual detail

## Final IA On Mainline

- 首页: official top-level page
- 文章详情页: official top-level page and only reading page
- 搜索页: official top-level page
- 订阅页: official top-level page
- 邀请/兑换页: official top-level page
- 我的页: official top-level page
- 设置页: official top-level page

## Internal Capability Routing

- `/pages/inbox/index` is retained as an internal capability page for inbox truth and delivery preview visibility.
- `/pages/follows/index` remains a compatibility alias and redirects to `/pages/search/index?focus=follows`.
- `/pages/campaign/index` remains a compatibility alias and redirects to `/pages/paywall/index?focus=campaign`.
- None of the above routes are restored as tabbar or first-level IA entries.

## Foundation Visibility Decisions

- `settings` must keep runtime mode, auth state, device state, push capability/CID state, and dev-safe refresh/reset actions.
- `profile` must keep auth/session/device summary visible without requiring a route detour into debug-only pages.
- `inbox` internal capability page must keep `notification_inbox` truth and delivery preview visibility, including suppression or digest-queue semantics when fixtures/runtime expose them.
- `feed` keeps a minimal runtime-mode surface so UI merge does not hide current mainline runtime state.

## Reading And Return-State Decisions

- `detail` remains the single reading page.
- Article entry defaults to `quick_30s`.
- Top toggle switches to `deep_3m` in-page.
- Both reading modes remain full vertical reading flows.
- Feed return state keeps `scrollTop`, `activeTab`, `publicationKey`, and `updateType` through discovery store plus UI cache.

## Commercial And Growth Decisions

- `paywall` keeps offer summary, quota status, promo preview, and campaign context display.
- `invite` keeps invite summary, reward summary, and redeem preview placeholder.
- `profile` keeps benefit, quota, saved, and inbox summary.
- These capabilities are restyled under UI1 visual language, but remain read-only foundation surfaces.

## Validation Gate For UI1.5

- UI1.5 is complete only if validators, build, Stage E2 smoke, Stage UI1 smoke, and Stage UI1.5 smoke are green together.
- If a UI1 visual treatment conflicts with H0/H1a visibility or validation seams, the visual treatment yields.
