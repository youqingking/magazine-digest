# Stage UI3.5 Runtime Audit

## Proven Facts

- runtime provenance had already been confirmed earlier through the `Build Audit` block in settings
- current design source remains `docs/design-handoff/stitch-ui1_5/`
- code now declares a `3-tab` shell:
  - `feed`
  - `search`
  - `profile`

## What This Audit Confirms In Code

- `pages.json` now exposes exactly 3 tabBar items
- `paywall`, `invite`, `settings`, and `detail` are not tabBar items
- `campaign` alias no longer depends on `switchTab` into `paywall`
- `profile`, `feed`, and `detail` still expose formal non-tab entries where required

## What This Audit Does Not Yet Confirm In Runtime

- a fresh HBuilderX or H5 run that visibly shows only 3 tabs
- a fresh runtime interaction record proving:
  - `paywall` still opens from `feed/profile/detail/campaign`
  - `invite` still opens from `profile/paywall`
  - `settings` still opens from `profile`
  - `detail` still returns to restored `feed` state

## Runtime Verification Boundary

- current environment can detect HBuilderX and classify readiness
- current environment cannot reliably drive HBuilderX GUI compile or app-plus runtime interaction end-to-end
- therefore “unable to auto-drive HBuilderX” must be recorded as an automation limitation, not as a compile failure

## Required Manual Proof For Final YES

1. run `mobile` from HBuilderX or H5 preview
2. confirm bottom shell shows only 3 tabs
3. confirm tab labels/routes are:
   - `feed`
   - `search` or `来源` -> route `pages/search/index`
   - `profile`
4. confirm non-tab entry chains still work
5. record result into `output/stage-ui3/manual-smoke-report.json`
