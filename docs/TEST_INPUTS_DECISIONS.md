# Stage X Decisions

## Source Of Truth

- Canonical source lives under `fixtures/test-inputs/scenarios/`.
- `output/test-input-pack/` and `mobile/fixtures/runtime/scenarios/` are generated outputs only.
- `mobile/fixtures/runtime/current/` is a selector projection target only.

## Rebuild Rules

- Rebuild reports with `build-synthetic-test-pack`.
- Re-validate canonical source with `validate-synthetic-test-pack`.
- Re-export runtime bundles with `export-runtime-scenarios`.
- Re-select a working mobile scenario with `select-runtime-scenario`.

## Editing Rules

- Do not hand-edit `output/test-input-pack/**/*`.
- Do not hand-edit `mobile/fixtures/runtime/scenarios/*.bundle.json`.
- Do not hand-edit `mobile/fixtures/runtime/current/*`.
- If canonical source changes, rerun build, validate, export, and selector.

## Integration Notes

- Stage E0 default runtime fixtures remain unchanged.
- Selector creates a side-by-side current scenario runtime pack without replacing `mobile/fixtures/runtime/*.json`.
- No Stage B schema, pricing rules, time rules, or canonical seed files are rewritten for Stage X.
