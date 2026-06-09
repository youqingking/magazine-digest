# UI Mainline Merge Map

## Final 7 Pages

| Page | UI ownership | Foundation retained from mainline | Notes |
| --- | --- | --- | --- |
| 首页 `/pages/feed/index` | UI1 IA, editorial home structure, return-state behavior | runtime mode visibility, inbox summary, followed updates, saved/continue reading | still the home tab |
| 详情 `/pages/detail/index` | UI1 single reader, quick/deep toggle, reading hierarchy | detail cache scope, audience isolation, entitlement/quota preview | only reader page |
| 搜索 `/pages/search/index` | UI1 search responsibility | follow catalog and follow actions | absorbs follows capability |
| 订阅 `/pages/paywall/index` | UI1 subscription-page responsibility | offer summary, quota status, promo preview, campaign context | keeps Stage G preview-only semantics |
| 邀请 `/pages/invite/index` | UI1 invite/redeem responsibility | referral summary, reward summary, redeem preview placeholder | keeps growth preview-only semantics |
| 我的 `/pages/profile/index` | UI1 profile responsibility | auth/session/device summary, benefits, quota, reward, saved, inbox summary | no longer expands into extra first-level ops pages |
| 设置 `/pages/settings/index` | UI1 settings responsibility | runtime/auth/device/push visibility and dev-safe actions | keeps H0/H1a readiness surface |

## Capability Ownership

| Capability block | Owner after merge | Kept from |
| --- | --- | --- |
| page responsibility and IA | UI1 | `docs/STAGE_UI1_DECISIONS.md` |
| single reader and home return chain | UI1 | `docs/READING_PAGE_SPEC.md`, `docs/NAVIGATION_AND_RETURN_STATE.md` |
| runtime mode, auth, device, push, CID visibility | H0 / H1a foundation | `docs/REMOTE_RUNTIME_FOUNDATION.md`, `docs/IDENTITY_AND_DEVICE_FOUNDATION.md`, `docs/PUSH_FOUNDATION.md` |
| offer, quota, promo preview, campaign preview | Stage G commercial foundation | `docs/COMMERCIAL_FOUNDATION.md` |
| invite, reward, redeem preview | Stage G growth foundation | `docs/GROWTH_FOUNDATION.md` |

## Old Route Handling

| Route | Merge behavior | Why |
| --- | --- | --- |
| `/pages/inbox/index` | internal capability page | preserves `notification_inbox` truth and delivery preview visibility without restoring inbox as top-level IA |
| `/pages/follows/index` | redirect to `/pages/search/index?focus=follows` | keeps follow capability under search responsibility |
| `/pages/campaign/index` | redirect to `/pages/paywall/index?focus=campaign` | keeps campaign context under paywall responsibility |

## Page-Level Conflict Resolution

| Conflict type | Decision |
| --- | --- |
| UI1 layout vs auth/device/push/payment-readiness visibility | preserve foundation visibility, trim layout detail if needed |
| UI1 page split vs existing Stage G/H0 capability pages | keep 7-page UI1 IA, move old capability exposure into summaries, internal pages, or alias redirects |
| UI1 visual copy vs Stage G/H1 preview semantics | preserve preview-only semantics; no real-payment implication allowed |
| route cleanup vs validator/stub needs | keep lightweight compatibility routes instead of deleting capability surfaces |

## Explicit Carry-Forward Blocks

- `feed`: runtime mode meta, inbox badge, followed updates, continue reading, saved-for-later
- `detail`: entitlement snapshot, quota snapshot, cached/unavailable/error states
- `paywall`: offer summary, quota status, promo preview, campaign hero
- `invite`: invite summary, reward summary, redeem placeholder
- `profile`: auth state, device state, benefits summary, quota summary, reward summary, inbox summary, saved summary
- `settings`: runtime selector, auth state, device state, push state, cache/session refresh actions
