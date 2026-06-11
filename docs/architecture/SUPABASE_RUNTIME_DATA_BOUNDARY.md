# Supabase Runtime Data Boundary

## Purpose

Define the seam between the Expo mobile shell and future Supabase runtime data without connecting a real backend.

No real credentials, schema, RLS policies, project ids, or production config are introduced by this boundary.

## Runtime Ports

`packages/core-runtime/src/runtime-data-port.ts` defines the app-facing repository ports:

- `RuntimeContentRepository`
- `RuntimeScenarioRepository`
- `RuntimeEntitlementRepository`
- `RuntimeNotificationRepository`

Each repository carries a source kind and returns product-scoped data. Runtime outputs preserve `product_key` through `productKey` view fields and `product_key` contract fields where placeholder snapshots are exposed.

## Fixture Adapter

`packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` implements the ports for local fixture bundles.

It wraps the current fixture reader and remains the default runtime source. The adapter reads generated mobile runtime bundles only; it does not build or select fixtures.

## Supabase Seam

`packages/core-runtime/src/seams/supabase-seam.ts` implements the same ports as a documented fail-closed stub.

Current behavior:

- `connects: false`
- Missing public env returns `unavailable`.
- Complete placeholder env still returns `unavailable` because query implementation is reserved for a later goal.
- Fixture data is not used when Supabase mode is explicitly selected.

Future implementation may replace the stub internals with Supabase-backed reads after human-owned project, auth, schema, and RLS decisions are recorded.

## Source Selection

`apps/mobile/src/runtime/runtime-data-source.ts` selects the repository:

- Default or `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=fixture`: use fixture adapter.
- `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase`: use Supabase seam.

The route layer consumes the same `RuntimeShellState` either way, so UI code does not need to know whether content came from fixtures or a future backend.

## Out Of Scope

This boundary does not:

- Create Supabase tables, migrations, functions, or RLS.
- Configure auth providers.
- Store service-role secrets or project credentials.
- Connect RevenueCat or push providers.
- Move generated fixture source data.
- Implement external package production.
