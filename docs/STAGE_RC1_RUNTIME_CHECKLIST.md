# Stage RC1 Runtime Checklist

## Manual Blocker Checklist

All items below are blocker-class manual checks. None may be auto-marked `pass`.

1. Bottom tab bar shows exactly 3 tabs.
2. The 3 tabs are `feed`, `search` or `来源`, and `profile`, with the second tab still routing to `/pages/search/index`.
3. `detail` is entered only by tapping content, not from tab bar or any direct formal shell entry.
4. `detail` opens in `quick_30s` by default.
5. Top toggle switches to `deep_3m` correctly.
6. Returning from `detail` back to `feed` restores feed state normally.
7. `settings` shows `Build Audit` in dev-only area.
8. Running package provenance matches current source expectations.
9. selected scenario / current runtime scenario information matches expected context.
10. `paywall`, `invite`, and `settings` remain reachable as non-tab formal entries.
11. Under baseline or mixed scenario, core pages do not crash during manual runtime validation.
12. Real runtime does not show the old `detail` template compile error again.

## Required Screenshot Surfaces

- tab bar shell with all 3 tabs visible
- `detail` default `quick_30s`
- `detail` switched to `deep_3m`
- `feed` after returning from `detail`
- `settings` Build Audit and runtime proof fields
- non-tab entry proof surfaces for `paywall`, `invite`, and `settings`
- compile/runtime console or HBuilderX view proving no recurring `detail` template compile error

## Required Text Capture

- operator
- runtime target: `h5` or `hbuilderx`
- executed timestamp
- observed tab labels
- observed route or entry note for `detail`
- observed branch / sha / baseline tag from Build Audit
- observed runtime scenario id
- observed current mirror scenario id
- scenario exercised for stability check: `baseline` or `mixed`
- compile/runtime note describing where no recurring error was checked

## Pass Rule

- item status must be explicitly set to `pass`
- required screenshots must exist
- required text capture must be non-empty

## Fail Rule

- any explicit `fail`
- any `pending`, `not_observed`, or empty required field
- any missing referenced screenshot file
