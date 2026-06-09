# Stage E1 Smoke Checklist

## Compile steps

1. Open `D:\ws\Playground\mobile` in HBuilderX.
2. Confirm `pages.json`, `manifest.json`, `App.vue`, and `main.js` are recognized as a uni-app project.
3. Preferred target: run Android `app-plus` local debug.
4. Fallback target: run H5 preview if Android local debug is unavailable.
5. Save compile outcome, target, timestamp, and top error lines into `output/stage-e1/compile-report.json`.

## Feed

- `feed-enter-list`: page opens and shows at least one article card.
- `feed-loading-state`: loading copy appears before data resolves.
- `feed-empty-state`: if forced by fixture/runtime condition, empty copy is visible and not blank.
- `feed-error-state`: if remote stub is enabled without cache, explicit error copy is visible.
- `feed-cached-state`: with cache seeded then runtime switched to `remote`, cached banner is visible.
- `feed-open-detail`: tapping an article mode button enters Detail.

## Detail

- `detail-teen-safety`: teen mode resolves only `teen` or `general`, never `adult`.
- `detail-mode-switch`: `quick_30s` and `deep_3m` switches both resolve and update content.
- `detail-unavailable-reason`: when no safe content exists, explicit `unavailable_reason` is shown.
- `detail-no-silent-adult`: teen requests never silently fall through to adult content.
- `detail-read-progress`: tapping progress controls enqueues `read_progress`.

## Paywall

- `paywall-entry`: page can be opened when entitlement/quota is insufficient.
- `paywall-price-format`: `fen` prices render correctly as UI currency strings.
- `paywall-display-only`: selecting a plan does not create a real order.

## Settings

- `settings-runtime-mode`: can switch `local` and `remote`.
- `settings-audience-mode`: can switch audience mode.
- `settings-reading-mode`: can switch reading mode.
- `settings-cache-reset`: local cache reset works.
- `settings-debug-visibility`: runtime mode, cache status, audience mode, reading mode, and last event status are visible.

## Placeholder routes

- `profile-enter`
- `invite-enter`
- `campaign-enter`

Expected result for all three: page renders contract-backed placeholder content and does not crash or show blank.

## Fallback and events

- `remote-feed-cache-fallback`: remote stub failure falls back to cached feed.
- `remote-detail-cache-path`: remote stub failure uses cached detail path when cache exists.
- `remote-no-cache-error`: with remote stub and no cache, explicit error or unavailable state is shown.
- `event-queue-core-events`: confirm `article_impression`, `article_open`, `variant_switch`, `read_progress`, and `paywall_impression` enter the local queue/debug sink.

## Result template

- `status`: `passed`, `failed`, or `blocked`
- `target`: `android-app-plus-local` or `h5-preview`
- `timestamp`: local time in ISO 8601
- `notes`: short evidence, screenshot path, or console excerpt
