# Supabase Env Contract

## Purpose

Define the no-credential environment contract for selecting the future Supabase runtime data seam from the Expo mobile shell.

No real credentials belong in this repository. This contract only names public Expo environment variables and the fail-closed behavior for local development.

## Runtime Data Source

Fixture mode remains the default:

```text
EXPO_PUBLIC_RUNTIME_DATA_SOURCE=fixture
```

Supabase seam mode is explicit:

```text
EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase
```

When the value is absent, empty, or anything other than `supabase`, the shell uses the local fixture adapter.

## Fixture Variables

```text
EXPO_PUBLIC_RUNTIME_SCENARIO_ID=current
```

`EXPO_PUBLIC_RUNTIME_SCENARIO_ID=s01_normal_full_matrix` remains the documented local scenario override. Unsupported fixture scenario ids fall back to `current`.

## Supabase Variables

The seam recognizes:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PRODUCT_KEY=
```

These values are intentionally empty in `apps/mobile/.env.example`. Local developers may supply private local values outside the repository when a future goal implements real Supabase access.

## Fail-Closed Behavior

If `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` is selected and any Supabase variable is missing, the shell fails closed with an `unavailable` runtime state. It does not substitute fixture data, synthesize backend records, or report Supabase success.

The unavailable state includes:

- `product_key` resolved from `EXPO_PUBLIC_PRODUCT_KEY` when present.
- Missing env variable names.
- A user-facing no-credential message.
- Source label `Supabase runtime data seam`.

## Current Non-Goals

This goal does not add a Supabase SDK, connect a project, create database schema, define RLS, configure auth, create credentials, or write production config.
