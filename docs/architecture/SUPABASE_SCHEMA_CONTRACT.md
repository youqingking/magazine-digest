# Supabase Schema Contract

## Purpose

Freeze the draft Supabase runtime data schema contract for the Expo app runtime.

This contract is draft-only. It does not create a Supabase project, apply migrations, add credentials, or declare the schema production-ready. Fixture mode remains the default runtime source until Supabase ownership, environments, auth, schema review, and RLS review are resolved in `docs/NEED_HUMAN.md`.

No real credentials belong in this contract. Missing credentials, missing `product_key`, missing auth ownership, or missing RLS approval must fail closed in the mobile seam. This fail-closed posture is part of the schema contract.

## Scope

The schema covers app runtime reads and user runtime state only:

- Published product-scoped content projections produced by the external pipeline.
- Product-scoped user content state and follows.
- Product-scoped notification inbox state.
- Runtime entitlement snapshots synchronized from RevenueCat by a future service-owned process.
- Sync cursors and metadata needed by runtime repositories.

The schema does not cover external content ingestion, PDF parsing, web scraping, prompt generation, markdown generation, package production, pipeline scheduling, real auth provider setup, RevenueCat connection, push credential setup, or production secrets.

## Product Scope Rule

`product_key` is first-class in every product-scoped table and every runtime query shape. Runtime clients must provide or resolve `product_key` explicitly; production paths must not silently infer a default product.

Draft table classes:

| Table | Product scoped | User scoped | Client write intent |
| --- | --- | --- | --- |
| `runtime.products` | yes, by primary `product_key` | no | forbidden |
| `runtime.publications` | yes | no | forbidden |
| `runtime.articles` | yes | no | forbidden |
| `runtime.article_variants` | yes | no | forbidden |
| `runtime.content_change_log` | yes | no | forbidden |
| `runtime.user_content_state` | yes | yes, by `user_id` | limited future upsert by owner |
| `runtime.user_follows` | yes | yes, by `user_id` | limited future upsert/delete by owner |
| `runtime.notification_inbox` | yes | yes, by `user_id` | read/update own read state only in future |
| `runtime.entitlement_snapshot` | yes | yes, by `user_id` | forbidden |
| `runtime.runtime_sync_cursors` | yes | yes, by `user_id` | limited future upsert by owner |

## Tables

### products

`runtime.products` is the product registry projection consumed by runtime clients.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Stable product scope and primary key. |
| `display_name` | yes | Product label for runtime surfaces. |
| `status` | yes | Draft values: `active`, `paused`, `archived`. |
| `metadata` | yes | JSON metadata; no prices, quotas, or entitlement grants as client authority. |
| `created_at` | yes | Service-owned timestamp. |
| `updated_at` | yes | Service-owned timestamp. |

### publications

`runtime.publications` stores product-scoped publication projections.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | References `runtime.products(product_key)`. |
| `publication_key` | yes | Stable publication key within product. |
| `display_name` | yes | Runtime display label. |
| `description` | no | Runtime copy from standardized metadata. |
| `status` | yes | Draft values: `active`, `hidden`, `archived`. |
| `metadata` | yes | Normalized package metadata only. |
| `created_at` | yes | Service-owned timestamp. |
| `updated_at` | yes | Service-owned timestamp. |

Business key: `(product_key, publication_key)`.

### articles

`runtime.articles` stores stable content item projections.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `article_id` | yes | Stable article id within product. |
| `article_key` | yes | Human-stable content key when available. |
| `publication_key` | yes | Publication scope. |
| `issue_key` | no | Issue or release key when applicable. |
| `title` | yes | Display title. |
| `summary` | no | Runtime summary. |
| `tags` | yes | JSON array of normalized tags. |
| `status` | yes | Draft values: `published`, `scheduled`, `unpublished`, `tombstoned`, `archived`. |
| `availability` | yes | JSON availability state from standardized package metadata. |
| `created_at` | yes | Service-owned timestamp. |
| `updated_at` | yes | Service-owned timestamp. |

Business key: `(product_key, article_id)`.

### article_variants

`runtime.article_variants` stores renderable article body variants selected by language, audience, reading mode, revision, and availability.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `article_variant_id` | yes | Stable variant id within product. |
| `article_id` | yes | References the article projection. |
| `publication_key` | yes | Publication scope for query/index efficiency. |
| `language` | yes | Required runtime selection dimension. |
| `audience_segment` | yes | Required runtime selection dimension. |
| `reading_mode` | yes | Required runtime selection dimension. |
| `title` | yes | Variant title. |
| `deck` | no | Variant deck/standfirst. |
| `body_markdown` | yes | Renderable standardized package output, not raw ingestion source. |
| `premium_tier` | yes | Access hint only; not an entitlement grant. |
| `publish_status` | yes | Runtime publish status. |
| `publish_at` | yes | Runtime publish clock. |
| `revision` | yes | Numeric variant revision. |
| `source_kind` | yes | Package provenance family. |
| `content_hash` | yes | Runtime integrity/cache key. |
| `fallback_policy` | yes | Runtime fallback rule. |
| `available_from` | no | Optional availability window start. |
| `available_until` | no | Optional availability window end. |
| `is_deleted` | yes | Tombstone/delete projection flag. |
| `metadata` | yes | Normalized runtime metadata. |
| `created_at` | yes | Service-owned timestamp. |
| `updated_at` | yes | Service-owned timestamp. |

Business key: `(product_key, article_variant_id)`.

### content_change_log

`runtime.content_change_log` is a runtime sync projection, not an ingestion log.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `change_id` | yes | Monotonic or time-sortable change id within product. |
| `entity_type` | yes | Draft values: `publication`, `article`, `article_variant`, `tombstone`. |
| `entity_key` | yes | Product-scoped entity key. |
| `change_type` | yes | Draft values: `upsert`, `unpublish`, `tombstone`, `delete_projection`. |
| `revision` | no | Entity revision when applicable. |
| `changed_at` | yes | Change clock used by sync. |
| `payload` | yes | Minimal runtime projection payload or tombstone identity. |

Runtime clients may read published/product-scoped changes but must not write this table.

### user_content_state

`runtime.user_content_state` stores private user state for reading progress and saves.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `user_id` | yes | Supabase auth user id owner. |
| `article_id` | yes | Product-scoped article id. |
| `article_variant_id` | no | Last variant id when applicable. |
| `state` | yes | Draft JSON state: progress, saved, hidden, unavailable reason, revision awareness. |
| `last_read_at` | no | Runtime reading clock. |
| `created_at` | yes | Service/default timestamp. |
| `updated_at` | yes | Service/default timestamp. |

Business key: `(product_key, user_id, article_id)`.

### user_follows

`runtime.user_follows` stores private user follow targets.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `user_id` | yes | Supabase auth user id owner. |
| `follow_type` | yes | Draft values: `publication`, `topic`, `author`, `series`. |
| `follow_key` | yes | Product-scoped follow target key. |
| `metadata` | yes | Runtime metadata for local UX. |
| `created_at` | yes | Service/default timestamp. |
| `updated_at` | yes | Service/default timestamp. |

Business key: `(product_key, user_id, follow_type, follow_key)`.

### notification_inbox

`runtime.notification_inbox` stores private user inbox records for runtime display. It is not push credential storage.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `notification_id` | yes | Stable inbox id within product. |
| `user_id` | yes | Supabase auth user id owner. |
| `topic_key` | no | Runtime topic/campaign key when applicable. |
| `title` | yes | Runtime display title. |
| `body` | yes | Runtime display body. |
| `data` | yes | Product-scoped navigation metadata. |
| `status` | yes | Draft values: `unread`, `read`, `archived`. |
| `delivered_at` | no | Delivery clock when known. |
| `read_at` | no | User read clock. |
| `created_at` | yes | Service/default timestamp. |
| `updated_at` | yes | Service/default timestamp. |

### entitlement_snapshot

`runtime.entitlement_snapshot` is a placeholder projection for RevenueCat-derived facts. It is not a pricing table, store product table, or client-granted entitlement authority.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `user_id` | yes | Supabase auth user id owner. |
| `snapshot_status` | yes | Draft values: `unknown`, `active`, `inactive`, `grace`, `revoked`. |
| `entitlements` | yes | JSON snapshot synchronized by a future trusted service. |
| `source` | yes | Expected value family: RevenueCat sync projection. |
| `synced_at` | no | External sync clock. |
| `expires_at` | no | Snapshot expiry when applicable. |
| `created_at` | yes | Service/default timestamp. |
| `updated_at` | yes | Service/default timestamp. |

Client writes are forbidden. The mobile adapter may read this as a placeholder only after schema, RLS, and RevenueCat sync ownership are approved.

## Service-Role-Only Writes

Content projection writes, content change log writes, entitlement snapshot refreshes, and notification inbox creation are service-role-only future operations. They must never be performed from the mobile client, and they must remain blocked until Supabase project ownership and secret handling are resolved.

### runtime_sync_cursors

`runtime.runtime_sync_cursors` stores per-user sync cursors and runtime metadata when needed by the adapter.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `product_key` | yes | Product scope. |
| `user_id` | yes | Supabase auth user id owner. |
| `cursor_name` | yes | Draft values: `content_change_log`, `notification_inbox`, `user_content_state`. |
| `cursor_value` | yes | Last acknowledged cursor. |
| `metadata` | yes | Runtime metadata for sync. |
| `updated_at` | yes | Service/default timestamp. |

## Adapter Mapping

Future `RuntimeContentRepository` reads:

- `products`
- `publications`
- `articles`
- `article_variants`
- `content_change_log`
- `user_content_state`
- `user_follows`

Future `RuntimeScenarioRepository` normally remains fixture-only. If a Supabase-backed scenario catalog is needed for internal QA, it must be a non-production runtime metadata projection scoped by `product_key`, not external content production.

Future `RuntimeEntitlementRepository` reads `entitlement_snapshot` as a placeholder projection only.

Future `RuntimeNotificationRepository` reads `notification_inbox` and sync cursor metadata only. Push credential registration remains a separate seam.

## Non-Production Status

This contract is intentionally incomplete for production. Required future approvals include:

- Supabase org/project ownership.
- Environment and secret injection policy.
- Auth provider configuration.
- RLS review against `docs/architecture/SUPABASE_RLS_CONTRACT.md`.
- Migration naming and application policy.
- Service-owned write path design for package projection, RevenueCat sync, and notification writes.
