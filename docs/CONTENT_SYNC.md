# Stage B Content Sync Contract

## Scope

The app consumes already-generated content only. Stage B freezes how the client caches and incrementally syncs `articles` and `article_variants` without introducing any external content ingestion pipeline.

## Delta Sync Model

Client request:

- `product_key`
- `installation_id`
- `last_sync_cursor`
- `limit`

Server response:

- `server_cursor`
- `has_more`
- `items`
- `tombstones`

## Cursor Rules

- `last_sync_cursor` is opaque to the client.
- `server_cursor` represents the highest processed mutation visible to the response.
- Ordering is monotonic by `updated_at`, then `_id`.
- If the client sends no cursor, the server returns an initial snapshot window plus a fresh `server_cursor`.

## Item Rules

- `items` include changed `articles` metadata and changed `article_variants`.
- Each variant item must include `publish_status`, `publish_at`, `revision`, `content_hash`, and `is_deleted`.
- `is_deleted=false` means upsert the local cache entry.

## Tombstone Rules

- `tombstones` include `{ entity_type, entity_id, deleted_at, reason_code }`.
- Variant removal due to archival, unpublish, delete, withdrawal, or product unavailability can be represented as tombstones.
- Clients must remove local cache entries when receiving a newer tombstone for that entity.
- `reason_code=unpublish` means the variant is no longer readable and must be removed from local readable inventory, but the client may keep audit-safe metadata until a fresher upsert or tombstone arrives.
- `reason_code=delete` means both cached content and lightweight metadata must be hard-removed for that entity.
- `reason_code=tombstone` or other server-defined withdrawal codes must be treated as non-readable and must win over any older cached publish state.

## Local Cache Rules

- Cache key for article content is `product_key + article_variant_id`.
- Cache key for article root metadata is `product_key + article_id`.
- Clients must keep the last acknowledged `server_cursor` per `product_key`.
- `user_product_profiles.sync_cursor` is the server-side mirror of the latest acknowledged cursor for recovery scenarios.
- If an incoming variant item sets `is_deleted=true`, the client must treat it the same as a delete tombstone and purge the cached readable entry.

## Safe Resolution Rule

- Sync only updates local inventory.
- Actual read-time content selection still follows `docs/RULE_PRECEDENCE.md`.
- A synced `adult` variant must never be selected for a teen request.

## Offline Behavior

- The client may serve cached variants only if the cached item is not tombstoned and still matches audience safety rules.
- If the client cannot determine a safe fallback offline, it must show an unavailable reason instead of guessing.
