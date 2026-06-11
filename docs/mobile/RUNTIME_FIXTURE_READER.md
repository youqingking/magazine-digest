# Runtime Fixture Reader

## Purpose

The runtime fixture reader maps frozen mobile runtime bundles into a small app-facing view model. It is a reader only; it does not build, export, select, or mutate generated fixtures.

`packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` wraps this reader with the runtime data ports so the app can keep using fixture data by default while future Supabase work implements the same interface.

## Inputs

Primary input:

- `mobile/fixtures/runtime/current/runtime.bundle.json`

Documented local scenario override:

- `mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json`

The Expo shell loads `current` by default. A local developer may set `EXPO_PUBLIC_RUNTIME_SCENARIO_ID=s01_normal_full_matrix` before starting Expo to use the synthetic scenario bundle. Unsupported scenario ids fall back to `current`.

Fixture mode is selected by default through `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=fixture`. Setting `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` bypasses fixture data and returns the documented no-credential unavailable state until a future Supabase implementation exists.

## Generated Fixture Policy

The source fixture contract declares `mobile/fixtures/runtime/current/**` and `mobile/fixtures/runtime/scenarios/**` as generated outputs. The mobile shell reads those files through static imports and does not commit selection churn as part of app work.

When validation runs:

```powershell
npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix
```

the command may rewrite `mobile/fixtures/runtime/current/**` and `output/test-input-pack/reports/current-scenario.json`. Restore generated output unless a future fixture refresh goal explicitly commits it.

## View Model Mapping

`packages/core-runtime/src/runtime-fixture-reader.ts` maps:

- `metadata.product_key` to `metadata.productKey`.
- `metadata.selected_scenario_id` or `metadata.scenario_id` to `metadata.scenarioId`.
- `discoveryCatalog.items` to home article rows.
- `contentSyncDelta.response.items` to article rows only when discovery is empty.
- `contentDetail.responses` to article detail bodies.

Detail selection prefers the article row primary audience and reading mode, then falls back to a general quick response, then a teen quick response, then the first matching response.

## Fallback States

The local fallback is explicit: unsupported scenario ids resolve to `current`, and missing bundles render the `missing` state.

The reader returns:

- `missing` when no fixture bundle is available.
- `empty` when a bundle exists but exposes no article rows.
- `ready` when article rows are available.

These states are rendered directly by the Expo Router routes. The app does not synthesize backend records or live service state.

## Non-Goals

The reader does not:

- Connect to Supabase.
- Connect to RevenueCat.
- Register devices or send notifications.
- Build or select generated fixtures.
- Parse PDF, scrape web pages, create prompts, create markdown, or schedule external content work.
