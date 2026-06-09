# Stage F0 Discoverability And Notification

## Scope

- Stage F0 is a spec patch only.
- Existing Stage B content safety, pricing, access, and idempotency contracts remain canonical.
- Discovery and notification reuse existing content/access truth and add only new metadata, user-state, and delivery-policy contracts.

## New Canonical Tables

- `publish_batches`: editorial release grouping for new or revised content.
- `user_follows`: user-to-subject edges for publications, topic tags, authors, or explicit publish batches.
- `user_notification_prefs`: per-product refinement of inbox, push, digest, and quiet-hours behavior.
- `notification_campaigns`: reusable targeting and channel policy definitions.
- `notification_deliveries`: per-user channel attempt facts with suppression and failure traceability.
- `notification_inbox`: durable user-facing inbox items.
- `user_content_state`: per-user per-article resume, bookmark, and newness projection.

## Content Metadata Additions

Canonical home: `article_variants`.

- `publish_batch_id`: groups variants into one release event.
- `update_type`: distinguishes new publish, revision, correction, highlight refresh, or sunset.
- `update_priority`: ranking and notification severity hint.
- `change_summary`: short human-readable revision summary.
- `notify_level`: abstract delivery importance, not a channel guarantee.
- `is_breaking`: explicit urgent-update hint.
- `available_from` / `available_until`: availability window separate from workflow `publish_status`.

Rules:

- All fields are additive and optional for backward compatibility with Stage B rows.
- `publish_status` and audience safety still gate readability before any discovery or notification logic.

## Surface Intent

- `home-discovery`: blended feed of fresh batches, followed subjects, and resume cards.
- `search-content`: read-only content search with request-scoped filters.
- `follow-catalog` and `follow-toggle`: discovery preference capture without changing publication truth.
- `notification-inbox`, `notification-prefs`, and `mark-inbox-read`: durable message center and preference surfaces.
- `content-resume` and `save-for-later`: convenience state surfaces backed by `user_content_state`.
- `publish-batch-summary`: release-centric landing surface for editorial drops.

## Deferred In F0

- `saved_filters` schema is intentionally not frozen in F0.

Reason:

- Search facets, ranking dimensions, and follow catalog taxonomy are still moving.
- Freezing persistent filter storage now would likely lock an unstable query DSL and create avoidable Stage F1 migration cost.

## Non-Goals

- No real push provider integration.
- No mobile/admin/backend business implementation rewrite.
- No change to Stage B canonical billing, entitlement, or content ingestion boundaries.
