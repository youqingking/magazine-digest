# Stage E1 Findings

## Resolved

- Cross-root imports from `mobile/` into `shared/` were removed so HBuilderX can treat `mobile/` as a standalone uni-app project root.
- `mobile/main.js` and `mobile/App.vue` were normalized toward uni-app bootstrap expectations.
- Settings exposes lightweight read-only smoke diagnostics for cache count and queued-event status.
- Stage E1 compile and smoke reporting writes machine-readable artifacts into `output/stage-e1/`.
- As of 2026-03-17, `HBuilderX.exe` is confirmed at `D:\HBuilderX\HBuilderX.exe`, and Stage E1.1 detection prioritizes that explicit path before `HBUILDERX_EXE`, `HBUILDERX_PATH`, and default fallbacks.
- Stage E1 manual closeout is complete: at least one real HBuilderX compile target and a real manual smoke run were confirmed on 2026-03-17, so the prior `compile_readiness / blocked` conclusion is no longer current.
- A minimal exported smoke fixture now includes `CONTENT_UNAVAILABLE_SAFE_FALLBACK_MISSING`, which makes the `detail-unavailable-reason` branch observable without changing the Stage B canonical contract.

## Remaining Limits

- Repo automation still does not drive a real HBuilderX compile target end-to-end; it validates compile-readiness and then relies on manual execution for real runtime confirmation.
- The exact manually used compile target is not independently snapshotted inside the repo artifacts; this closeout records the confirmed outcome and notes the most likely target as `android-app-plus-local`.
