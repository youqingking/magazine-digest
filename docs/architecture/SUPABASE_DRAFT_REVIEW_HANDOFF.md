# Supabase Draft Review Handoff

## Purpose

Hand off the current Supabase runtime schema and RLS drafts to a later read-only migration review thread. This document does not authorize applying migrations, connecting a project, adding credentials, or implementing the mobile Supabase adapter.

## Draft Only

The following artifacts are draft-only review inputs:

| Artifact | Role | Draft status |
| --- | --- | --- |
| `docs/architecture/SUPABASE_SCHEMA_CONTRACT.md` | Product-scoped runtime data schema contract. | Human review required before migration naming or application. |
| `docs/architecture/SUPABASE_RLS_CONTRACT.md` | Fail-closed RLS policy intent. | Human review required before policy execution. |
| `docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md` | App-to-Supabase runtime seam boundary. | Contract only; no project connection. |
| `docs/mobile/SUPABASE_ENV_CONTRACT.md` | Public Expo env names and fail-closed behavior. | No real env values in repo. |
| `docs/mobile/SUPABASE_ADAPTER_IMPLEMENTATION_PLAN.md` | Future read adapter phases. | Not an implementation plan for this PR. |
| `infra/supabase/drafts/runtime-schema-draft.sql` | Draft table/index SQL. | Must stay under `drafts`. |
| `infra/supabase/drafts/runtime-rls-draft.sql` | Draft RLS SQL. | Must stay under `drafts`. |

## Must Not Be Applied Yet

Do not do any of the following in this PR unit:

- Move draft SQL into `infra/supabase/migrations/**` or any applied migration path.
- Run draft SQL against a Supabase project.
- Add a Supabase project URL, anon key, service-role secret, project id, or CLI config.
- Add `@supabase/supabase-js` or start querying live tables from the mobile shell.
- Configure auth providers, storage, edge functions, service writers, or production deployment.
- Add RevenueCat, push, analytics, feature flag, experiment, risk, quota, price, or entitlement authority.
- Treat the draft RLS as complete without tests for anon, owner, non-owner, wrong product, missing product, and service writer cases.

## Open Human Decisions

These remain `NEED_HUMAN` before any real Supabase implementation:

| Decision | Why it blocks |
| --- | --- |
| Supabase org/project owner | Required before project config, URLs, and migration target can be named. |
| Secret and env injection owner | Required before anon keys, service-role keys, or local env files can be handled safely. |
| Auth provider and user identity policy | Required before `auth.uid()` ownership can be validated. |
| Migration naming and application policy | Required before drafts can become versioned migrations. |
| Service-owned write path | Required for content projections, RevenueCat entitlement snapshots, notification inbox creation, and sync repair. |
| RLS test harness | Required to prove fail-closed behavior across anon, owner, non-owner, wrong product, missing product, and service-role cases. |
| Product key source of truth | Required so runtime queries do not infer a silent default product. |
| RevenueCat sync ownership | Required before `runtime.entitlement_snapshot` can become authoritative. |
| Notification credential and delivery ownership | Required before inbox creation and push provider state can be wired. |

## Schema Review Checklist

- Every product-scoped table includes `product_key`.
- Every user-private table includes `product_key` and `user_id`.
- Business keys match `docs/architecture/SUPABASE_SCHEMA_CONTRACT.md`.
- `runtime.products`, `runtime.publications`, `runtime.articles`, `runtime.article_variants`, and `runtime.content_change_log` are client-read projection tables, not client-write tables.
- `runtime.entitlement_snapshot` is RevenueCat-derived and never a client-granted entitlement source.
- `runtime.notification_inbox` does not store Expo Push, FCM, APNs, or provider credentials.
- JSON metadata fields do not become a place to hardcode prices, quotas, benefits, feature flags, experiments, operating thresholds, or risk thresholds.
- Indexes support product-scoped content, owner-private state, and sync queries without implying unreviewed production scale assumptions.

## RLS Review Checklist

- RLS is enabled on every runtime table before permissive policies are added.
- Published public reads exclude unpublished, future-scheduled, deleted, archived, private, or secret-bearing data.
- Owner-private reads require `user_id = auth.uid()`.
- Owner-private writes, where allowed, require both `user_id = auth.uid()` and explicit product scope.
- Client writes remain forbidden for products, publications, articles, article variants, content change log, entitlement snapshots, and service-created notification inbox rows.
- Policies include or preserve explicit `product_key` filtering and do not rely on a mobile-client default.
- Tests cover anon, authenticated owner, authenticated non-owner, missing product_key, wrong product_key, unauthenticated private access, and service-owned writer paths.
- Unknown statuses and missing auth fail closed.

## Future Migration Review Thread Scope

A later read-only thread should:

1. Audit the draft SQL against the schema and RLS contracts without applying it.
2. Compare draft table names, primary keys, foreign keys, indexes, status enums, and policy predicates against legacy reference semantics where useful.
3. Identify concrete migration blockers and required human decisions.
4. Produce migration review notes and revised draft recommendations only.
5. Leave `infra/supabase/drafts/**` unapplied unless a separate human-approved migration implementation goal is opened.

That future thread should not add credentials, connect Supabase, create applied migrations, or implement the mobile adapter.
