# Mobile Runtime Shell

## Purpose

`apps/mobile` is the Expo-first mobile shell for reading standardized magazine runtime fixtures. It is a no-credential foundation that renders fixture-backed discovery, article reading, and scenario debug surfaces.

## Scope

The shell uses:

- Expo Router under `apps/mobile/app`.
- Shared fixture mapping in `packages/core-runtime/src/runtime-fixture-reader.ts`.
- Shared runtime data ports in `packages/core-runtime/src/runtime-data-port.ts`.
- Runtime source selection in `apps/mobile/src/runtime/runtime-data-source.ts`.
- Static local fixture inputs from `mobile/fixtures/runtime/current/runtime.bundle.json`.
- A documented scenario override for `s01_normal_full_matrix`.

The shell shows `product_key`, selected scenario id, publication labels, article titles, summaries, and resolved article bodies when `markdown_body` is present in the fixture.

## Screens

| Route | Role | Data source |
| --- | --- | --- |
| `/` | Home discovery list | `discoveryCatalog.items`, falling back to `contentSyncDelta.response.items` |
| `/article/[articleId]` | Article reading view | `contentDetail.responses` keyed by article id, audience, and reading mode |
| `/debug` | Scenario and seam status | Fixture metadata plus local seam descriptors |

Each route handles loading, empty, and missing fixture states. The app does not fake live backend data; if fixture data is missing, it says the fixture is missing or empty.

## Runtime Data Boundary

The runtime shell accepts already-exported runtime fixture bundles. It may map fixture records into view models, select a detail response, and render body text. It must not implement source acquisition, PDF parsing, web scraping, prompt creation, markdown creation, external package production, or scheduling.

`product_key` remains first-class in the view model and on every service seam descriptor.

The runtime source defaults to `fixture`. `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` selects the no-credential Supabase seam. When Supabase mode lacks env, the app renders an explicit unavailable state and does not fall back to fixture data.

## Service Seams

### Supabase seam

`packages/core-runtime/src/seams/supabase-seam.ts` describes the future product-scoped data seam. It does not connect to a project, read secrets, create schema, or write records.

The seam implements the runtime data ports as a fail-closed stub until Supabase project ownership, public env injection, schema, and RLS decisions are handled in a future goal.

### RevenueCat seam

`packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts` describes the future entitlement seam. It does not configure a customer, define prices, define quotas, or grant access.

### Product notification seam

`packages/core-runtime/src/seams/notification-seam.ts` describes future device registration, inbox, preferences, and delivery-preview state. It does not request permissions, register a token, or send notifications.

## Local App Config

`apps/mobile/app.json` is a local shell config only. It intentionally omits EAS owner, project id, bundle identifiers, package identifiers, production service endpoints, and credential-bearing configuration.

## Validation

Run:

```powershell
python scripts/agent_tools/validate_mobile_runtime_shell.py .
```

This validator checks route presence, runtime fixture reader presence, seam placeholders, mobile docs, fixture `product_key`/scenario metadata, and forbidden live integration snippets.
