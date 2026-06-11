# Supabase RLS Contract

## Purpose

Freeze the draft RLS intent for future Supabase runtime data. This is not production-ready policy, not an applied migration, and not a substitute for human Supabase ownership.

RLS must fail closed by default: tables are inaccessible unless a policy explicitly permits the requested operation for the authenticated role, product scope, and user owner.

## Global RLS Rules

- Enable RLS on every runtime table.
- Public anonymous reads are allowed only for published content projections that are safe to expose.
- Authenticated reads of public content use the same published/product-scoped rules.
- Private user state is readable only by the row owner where `user_id = auth.uid()`.
- Private user state writes are limited to future documented owner upserts/deletes and must remain product-scoped by `product_key`.
- Service-owned writes for content, entitlement snapshots, notification inbox creation, and sync projections must use a trusted server context outside the mobile client.
- Client writes are forbidden for content projection tables, entitlement snapshots, product registry, and service-owned notification creation.
- Policies must check both `product_key` and user ownership when a table is both product-scoped and user-scoped.

## Product Key Scoping

Every RLS policy must preserve `product_key` as an explicit predicate or validated row field. Future adapter queries must include `product_key` in filters for product-scoped tables.

Product scoping intent:

- `runtime.products`: read only active product rows.
- `runtime.publications`: read only active publication rows for the requested `product_key`.
- `runtime.articles`: read only published article rows for the requested `product_key`.
- `runtime.article_variants`: read only published, non-deleted, time-available variants for the requested `product_key`.
- User tables: read/write only rows where both `product_key` matches the runtime context and `user_id = auth.uid()`.

## Public Content Read Rules

Published content read policies may allow anonymous and authenticated clients to select:

- Active products.
- Active publications.
- Published articles.
- Published article variants where `is_deleted = false`, `publish_at <= now()`, and availability windows include `now()` when present.
- Content change log rows whose payload is safe as a runtime sync projection.

Public content policies must not expose:

- Draft, scheduled-future, unpublished, archived, or tombstoned article bodies unless the tombstone payload is explicitly safe for sync.
- Service metadata that contains secrets, private pipeline details, or operator-only diagnostics.
- User-specific state.
- Entitlement snapshots.
- Notification inbox rows.

## Authenticated User Private State Rules

Authenticated users may read only their own rows:

- `runtime.user_content_state`
- `runtime.user_follows`
- `runtime.notification_inbox`
- `runtime.entitlement_snapshot`
- `runtime.runtime_sync_cursors`

The ownership predicate is always:

```sql
user_id = auth.uid()
```

Product scope must also be present:

```sql
product_key = product_key
```

The draft SQL uses table-qualified predicates where needed; final migrations should avoid ambiguous column references.

## Client Write Intent

Allowed future client writes, subject to implementation review:

| Table | Operation | Required ownership |
| --- | --- | --- |
| `runtime.user_content_state` | insert/update | `user_id = auth.uid()` and explicit `product_key` |
| `runtime.user_follows` | insert/delete/update metadata | `user_id = auth.uid()` and explicit `product_key` |
| `runtime.notification_inbox` | update own read/archive state only | `user_id = auth.uid()` and explicit `product_key` |
| `runtime.runtime_sync_cursors` | insert/update own cursor only | `user_id = auth.uid()` and explicit `product_key` |

Forbidden client writes:

- `runtime.products`
- `runtime.publications`
- `runtime.articles`
- `runtime.article_variants`
- `runtime.content_change_log`
- `runtime.entitlement_snapshot`
- Creating notification inbox rows for arbitrary users.
- Any table or field that stores prices, quotas, entitlement grants, feature flags, experiments, risk thresholds, push credentials, provider secrets, or external pipeline state.

## Service-Role-Only Boundaries

The following writes are service-role-only in intent and must never run from the mobile client:

- Upserting product, publication, article, and article variant projections.
- Writing content change log rows.
- Writing or refreshing RevenueCat-derived entitlement snapshots.
- Creating notification inbox rows from campaign or delivery systems.
- Repairing sync cursors or backfilling runtime metadata.

Service-owned writers must be implemented after Supabase project ownership, secret handling, and deployment boundaries are documented. This repo must not commit service secrets.

## Fail-Closed Behavior

Until a policy is explicitly defined and verified, access is denied.

Required fail-closed behavior:

- Missing Supabase environment keeps the mobile seam unavailable.
- Missing `product_key` in adapter context must not silently query production data.
- Missing `auth.uid()` denies user-private rows.
- Missing service ownership denies service-owned writes.
- Unknown statuses are not readable by public content policies.
- Future migrations must enable RLS before adding any permissive policy.

## Draft Policy Review Checklist

Before converting drafts into migrations, a future Supabase thread must verify:

- Every product-scoped table includes `product_key`.
- Every user-private table includes `user_id`.
- Every private read/update/delete policy checks `user_id = auth.uid()`.
- Public content reads exclude unpublished, future-scheduled, deleted, private, or secret-bearing data.
- Service-owned writes are not exposed to anon or authenticated mobile clients.
- No policy relies on a client-hardcoded entitlement, price, quota, feature flag, experiment, operational threshold, or risk threshold.
- Tests cover anon, authenticated owner, authenticated non-owner, missing product_key, wrong product_key, and service writer cases.
