# UI Runtime Audit

## Scope

- Scope limited to runtime/source consistency, `mobile/pages.json`, tabBar exposure, and alias exposure.
- No schema change.
- No backend contract change.
- No payment wiring.

## Current Git Identity

- Worktree: `D:\ws\Playground`
- Branch: `ui1-merge-on-mainline`
- HEAD: `1fdd2f82c6302c0cc1f73e72f4f1d830ad13dec1`
- Short SHA: `1fdd2f8`

## Runtime Path Audit

- Current source worktree root is `D:\ws\Playground`.
- Current mobile source root is `D:\ws\Playground\mobile`.
- `mobile/.hbuilderx/launch.json` currently points `localRepoPath` to `D:/ws/Playground/mobile/unpackage`, not to `D:/ws/Playground/mobile`.
- This means HBuilderX local debug provenance is not cleanly tied to the source worktree. It may be launching against generated output context instead of the live source project root.

## Dev-only Build Marker

- Added a dev-only build audit block to `mobile/pages/settings/index.vue`.
- Visible only when `process.env.NODE_ENV !== "production"`.
- Displays:
  - branch
  - short SHA
  - build timestamp
- Purpose: prove whether the running app instance is built from the expected source snapshot.

## pages.json Audit

### Current app routes in `mobile/pages.json`

- Official/final-intent routes present:
  - `pages/feed/index`
  - `pages/detail/index`
  - `pages/search/index`
  - `pages/paywall/index`
  - `pages/invite/index`
  - `pages/profile/index`
  - `pages/settings/index`
- Alias/internal compatibility routes still registered in app pages:
  - `pages/inbox/index`
  - `pages/follows/index`
  - `pages/campaign/index`
- Additional auth/account routes also registered via `uni_modules/uni-id-pages`.

### Current tabBar

- tabBar button count: `5`
- Current tabBar entries:
  - `pages/feed/index`
  - `pages/search/index`
  - `pages/paywall/index`
  - `pages/invite/index`
  - `pages/profile/index`

### Current first-level entry reality

- Direct tabBar entry points:
  - feed
  - search
  - paywall
  - invite
  - profile
- Non-tab official routes:
  - detail
  - settings
- Compatibility/internal routes still directly routable:
  - inbox
  - follows
  - campaign

## Alias And Redirect Audit

- `pages/follows/index`: compatibility alias, immediately redirects to `/pages/search/index?focus=follows`
- `pages/campaign/index`: compatibility alias, immediately redirects to `/pages/paywall/index?focus=campaign`
- `pages/inbox/index`: not a pure redirect alias anymore
  - It records alias state
  - It keeps an internal capability screen for inbox truth and delivery preview
  - It still exposes a direct route and does not immediately bounce out like the other two aliases

## Five-button Diagnosis

### What the evidence says

- The current source `mobile/pages.json` already defines a `5` button tabBar.
- The generated `mobile/unpackage/dist/dev/app-plus/app-config-service.js` also contains the same `5` button tabBar.
- Therefore the observed five-button UI is not explained only by stale generated artifacts.

### Most likely cause ranking

1. Current source still explicitly ships a 5-button tabBar.
2. HBuilderX project binding is unsafe because `localRepoPath` points at `mobile/unpackage`, which makes runtime/source verification harder.
3. Alias exposure is still present in route registration, but alias routes are not the direct cause of the five tab buttons because they are not listed in tabBar.

## Freeze Alignment Status

- `docs/UI_FREEZE_DECISIONS.md`, `docs/UI_FREEZE_FINAL_MAP.md`, and `docs/STAGE_UI1_5_DECISIONS.md` all say `inbox`, `follows`, and `campaign` must not return as tabBar or first-level IA entries.
- Current code respects that part for tabBar, but not for route registration simplification because all three remain directly routable app pages.
- Current code does not yet reflect any reduced tabBar count implied by the latest design exports.

## Conclusion

- The running app cannot currently be trusted as a clean reflection of `mobile/` source because HBuilderX is configured against `mobile/unpackage`.
- Separately, even if source and runtime are aligned, the current source itself still encodes a 5-button tabBar.
- So the five-button result is most likely a source-of-truth issue first, plus runtime provenance ambiguity second.
