# Remote Runtime Foundation

- local-first remains the automated regression baseline
- remote foundation introduces a stable seam, not a mandatory remote dependency
- supported runtime modes:
  - `local`: fixture-backed primary path
  - `remote`: config-backed remote seam with local fallback marker
  - `hybrid`: remote seam first with explicit local fallback semantics
- backend selector lives in `backend/runtime/runtime-mode-selector.mjs`
- backend adapters live in `backend/adapters/local-runtime-adapter.mjs` and `backend/adapters/remote-runtime-adapter.mjs`
- mobile switching remains dev-safe in settings only

## Remote config placeholders

- `REMOTE_RUNTIME_BASE_URL`
- `REMOTE_RUNTIME_PROJECT_ID`
- `REMOTE_RUNTIME_APP_ID`
- `REMOTE_PUSH_APP_ID`
- `REMOTE_AUTH_PROVIDER`
- `REMOTE_RUNTIME_ALLOW_FALLBACK`
