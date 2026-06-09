# Stage B API Contracts

## Contract Principles

- `products`, `pricing_plans`, `promo_campaigns`, and `promo_codes` are Stage B source of truth tables for product availability, base pricing, campaign windows, and promo eligibility.
- `subscription_records` and `payment_orders` are fact tables.
- `entitlements` is a current-state projection materialized from billing facts, promo grants, quota policies, and admin actions.
- `promo_redemptions`, `reward_ledger`, `quota_consumption_logs`, `event_logs_raw`, and `audit_logs` are append-only ledger or audit tables.
- API responses must return machine-readable denial reasons instead of silently degrading into unsafe or incorrect behavior.
- All growth, pricing, and analytics related requests must carry `product_key`.
- All price fields use integer `fen`, all discount settlement uses `price_multiplier_basis_points`, all reward settlement uses integer `vip_days`, and all daily-window evaluation uses `Asia/Shanghai`.

## Content Contracts

### `content.resolveVariant`

Request fields:

- `product_key`
- `article_id`
- `language`
- `audience_segment`
- `reading_mode`
- `request_id`

Response fields:

- `article`
- `resolved_variant`
- `selection_reason`
- `fallback_applied`
- `unavailable_reason`

Contract notes:

- Resolution reads `article_variants` only with `publish_status` in `scheduled` or `published` and effective publish time reached.
- Teen requests may resolve to `teen` or `general`, never `adult`.
- If no safe variant exists, return `CONTENT_UNAVAILABLE_SAFE_FALLBACK_MISSING`.

### `content.syncDelta`

Request fields:

- `product_key`
- `installation_id`
- `last_sync_cursor`
- `limit`

Response fields:

- `server_cursor`
- `has_more`
- `items`
- `tombstones`

Contract notes:

- `items` contains changed `article_variants` and lightweight `articles` metadata after the supplied cursor.
- `tombstones` carries deleted or withdrawn variant identifiers.
- Cursor ordering is based on monotonic `updated_at` plus `_id` tie-break.
- `article_variants` may include optional Stage F0 discovery metadata: `publish_batch_id`, `update_type`, `update_priority`, `change_summary`, `notify_level`, `is_breaking`, `available_from`, and `available_until`.

## Profile And Access Contracts

### `profile.upsertPreferences`

Writes:

- `user_product_profiles`
- optional `device_installations.last_seen_at`

Idempotency:

- key: `product_key + user_id`
- compare-and-set on `updated_at` if optimistic concurrency is required later

### `access.evaluate`

Decision order:

1. product active and kill switch
2. auth requirement
3. audience restriction
4. entitlement grant
5. quota availability
6. feature flag / experiment gating

Response fields:

- `access_state`
- `decision_source`
- `quota_remaining`
- `entitlement_snapshot`
- `denial_reason`

## Billing Contracts

### `billing.createOrder`

Request fields:

- `product_key`
- `user_id`
- `pricing_plan_id`
- `campaign_id`
- `promo_code`
- `pricing_context`
- `idempotency_key`

Writes:

- `payment_orders` fact row

Contract notes:

- `idempotency_key` is required and unique within `product_key`.
- Order amount is computed from pricing precedence rules, not from client-supplied totals.
- `pricing_plan_id` points to the source-of-truth `pricing_plans` row that owns `price_fen`.
- `payment_orders.original_amount_fen` is the plan price snapshot before campaign or promo application.
- `payment_orders.final_amount_fen` is the final payable amount after applying `price_multiplier_basis_points` and floor rules.

### `billing.confirmOrder`

Request fields:

- `product_key`
- `order_id`
- `payment_channel`
- `provider_transaction_id`
- `provider_event_id`
- `confirmation_time`

Writes:

- updates `payment_orders`
- creates or updates `subscription_records`
- upserts `entitlements`
- appends `audit_logs`

Contract notes:

- Provider callback confirmation is idempotent on `provider_event_id`.
- `subscription_records.payment_order_id` links the recurring access fact back to the paid order fact.
- `entitlements.last_grant_source_type` and `entitlements.last_grant_source_id` point back to either the confirmed `payment_orders` row, the derived `subscription_records` row, or another ledger grant source.
- `entitlements` must reference the fact source row used to produce the grant.

### `billing.handleWebhook`

Contract notes:

- Webhook payload becomes a billing fact update, not a direct entitlement truth write.
- Repeated webhook delivery must not create duplicate subscription cycles or duplicate grants.

## Promotion And Growth Contracts

### `promo.redeem`

Request fields:

- `product_key`
- `user_id`
- `promo_code`
- `installation_id`
- `request_id`

Writes:

- append-only `promo_redemptions`
- may update `entitlements`
- may append `reward_ledger`

Contract notes:

- Duplicate redemption attempts on the same code and user must return the original redemption result.
- Campaign eligibility and floor-price rules are evaluated before grant.
- `promo_redemptions` is the immutable redemption ledger for promo attempts and outcomes; it is not the source of truth for campaign definition.

### `growth.bindReferral`

Request fields:

- `product_key`
- `inviter_user_id`
- `invitee_user_id`
- `installation_id`
- `request_id`

Writes:

- `referrals`
- optional append-only `reward_ledger`

Contract notes:

- `inviter_user_id` must differ from `invitee_user_id`.
- One installation may bind only one successful invite per product.

### `growth.grantReward`

Contract notes:

- Reward grants are append-only in `reward_ledger`.
- `reward_ledger.vip_days` is the canonical settlement unit for invitation and promo access rewards.
- Business idempotency key is required per reward event.
- Registration reward and first-valid-action reward are separate entries.

## Event And Audit Contracts

### `event.ingest`

Request fields:

- `product_key`
- `event_name`
- `request_id`
- `dedup_key`
- `occurred_at`
- `payload`

Writes:

- append-only `event_logs_raw`

Contract notes:

- `dedup_key` is required for client retries.
- Aggregation into `event_metrics_daily` is out of Stage B runtime scope but the target contract is frozen.
- Stage F0 adds the following event names without changing the append-only ingest path: `notification_received`, `notification_open`, `inbox_open`, `follow_add`, `follow_remove`, `bookmark_add`, `bookmark_remove`, `continue_read_click`, `search_query`, `filter_apply`, and `digest_open`.
- Stage H0 adds the following event names without changing the append-only ingest path: `auth_session_open`, `auth_signin_placeholder`, `auth_signout`, `device_register`, `push_capability_refresh`, `push_delivery_preview`, `runtime_mode_switch`, `remote_adapter_fallback`, and `remote_adapter_error`.

## Identity, Device, And Push Foundation Contracts

### `auth-session`

Request fields:

- `product_key`
- `user_id`
- `installation_id`

Response fields:

- `session_state`
- `auth_provider`
- `user_id`
- `session_id`
- `token_state`
- `expires_at`
- `runtime_mode`
- `source`

Contract notes:

- H0 is foundation-only and keeps the contract stable without requiring a live sign-in flow.
- Local runtime may return a local stub summary; remote runtime may return a remote-ready placeholder summary.

### `auth-refresh`

Request fields:

- `product_key`
- `user_id`
- `installation_id`

Response fields:

- `refresh_state`
- `session_state`
- `refreshed_at`
- `token_state`
- `runtime_mode`
- `source`

### `auth-signout`

Request fields:

- `product_key`
- `user_id`
- `installation_id`

Response fields:

- `signout_state`
- `session_state`
- `cleared_at`
- `runtime_mode`
- `source`

### `register-device`

Request fields:

- `product_key`
- `installation_id`
- `device_id`
- `push_clientid`
- `appid`
- `last_seen_at`

Response fields:

- `registration_state`
- `installation_id`
- `device_id`
- `push_clientid`
- `appid`
- `product_key`
- `last_seen_at`
- `runtime_mode`
- `source`

Contract notes:

- H0 reuses `device_installations` with additive push and remote runtime metadata.
- The surface is idempotent on `product_key + installation_id`.

### `push-capability`

Request fields:

- `product_key`
- `installation_id`
- `push_clientid`
- `permission_state`
- `appid`

Response fields:

- `capability_state`
- `permission_state`
- `transport_state`
- `push_enabled`
- `push_clientid_present`
- `push_clientid`
- `push_appid`
- `installation_id`
- `source`

### `notification-delivery-preview`

Request fields:

- `product_key`
- `user_id`
- `notification_inbox_id`
- `quiet_hours_active`
- `dedupe_hit`
- `force_digest`
- `delivery_channel`

Response fields:

- `preview_state`
- `transport_decision`
- `suppression_reason`
- `inbox_truth_state`
- `delivery_channel`
- `notification_inbox_id`
- `product_key`
- `user_id`
- `runtime_mode`
- `source`

Contract notes:

- Inbox remains durable truth even when preview says quiet-hours suppression, dedupe, or digest queueing.
- H0 preview does not perform real provider send.

## Discoverability And Notification Contracts

### `home-discovery`

Request fields:

- `product_key`
- `user_id`
- `installation_id`
- `cursor`
- `limit`
- `audience_segment`

Response fields:

- `modules`
- `continue_reading`
- `inbox_unread_count`
- `next_digest_hint`
- `server_time`

Contract notes:

- Discovery is read-only in Stage F0 and must consume existing content/access truth instead of creating parallel eligibility logic.
- Ranking may boost `publish_batches`, followed subjects, resume candidates, and breaking revisions, but must still obey content safety and availability windows.

### `search-content`

Request fields:

- `product_key`
- `user_id`
- `query`
- `filters`
- `cursor`
- `limit`

Response fields:

- `items`
- `facets`
- `cursor`
- `has_more`

Contract notes:

- Search returns only content already eligible for the caller under content selection and access rules.
- Filter persistence is request-scoped in F0; `saved_filters` is intentionally deferred.

### `follow-catalog`

Request fields:

- `product_key`
- `user_id`
- `catalog_type`
- `cursor`
- `limit`

Response fields:

- `subjects`
- `cursor`
- `has_more`

Contract notes:

- Subjects are discoverability-only entities such as publications and topic tags; the surface does not create new content source tables.

### `follow-toggle`

Request fields:

- `product_key`
- `user_id`
- `subject_type`
- `subject_key`
- `desired_state`
- `notify_level`
- `idempotency_key`

Writes:

- `user_follows`
- optional `event_logs_raw`

Contract notes:

- Idempotency scope is `product_key + user_id + subject_type + subject_key + desired_state + idempotency_key`.
- Repeating the same desired state must return the stored current edge instead of creating duplicate follow rows.

### `notification-inbox`

Request fields:

- `product_key`
- `user_id`
- `status_filter`
- `cursor`
- `limit`

Response fields:

- `items`
- `unread_count`
- `cursor`
- `has_more`

Contract notes:

- Inbox is the durable user-visible record even when push is suppressed by quiet hours or provider failure.
- Expired inbox items must not be returned as actionable content.

### `notification-prefs`

Request fields:

- `product_key`
- `user_id`
- `push_enabled`
- `inbox_enabled`
- `digest_enabled`
- `follow_alert_level`
- `breaking_push_override`
- `quiet_hours_enabled`
- `quiet_hours_start_minute`
- `quiet_hours_end_minute`
- `timezone`

Writes:

- `user_notification_prefs`

Contract notes:

- This surface refines notification behavior per product and does not replace device-level OS permission state.
- `user_product_profiles.push_opt_in` remains the coarse app-level consent mirror; delivery requires both records to allow push.

### `mark-inbox-read`

Request fields:

- `product_key`
- `user_id`
- `inbox_ids`
- `mark_all_before`
- `idempotency_key`

Writes:

- `notification_inbox`

Contract notes:

- Marking the same inbox row read multiple times must be idempotent.
- `mark_all_before` is optional bulk convenience and must scope only to the caller's `product_key + user_id`.

### `content-resume`

Request fields:

- `product_key`
- `user_id`
- `limit`

Response fields:

- `items`
- `server_time`

Contract notes:

- Resume is projected from `user_content_state` and must not invent progress for content the user never opened.
- Items whose `available_until` has passed must be omitted.

### `save-for-later`

Request fields:

- `product_key`
- `user_id`
- `article_id`
- `desired_state`
- `idempotency_key`

Writes:

- `user_content_state`
- optional `event_logs_raw`

Contract notes:

- `desired_state=saved` upserts bookmark state; `desired_state=removed` clears it without deleting resume metadata.
- Save-for-later is user state only and must not mutate article publication truth.

### `publish-batch-summary`

Request fields:

- `product_key`
- `publish_batch_id`
- `user_id`

Response fields:

- `publish_batch`
- `items`
- `follow_match_count`
- `inbox_item`

Contract notes:

- Summary is a read-model over `publish_batches`, linked `article_variants`, follow matches, and optional inbox record.
- Batch summary cannot widen content visibility beyond existing access and audience rules.

## Table Positioning Summary

- `payment_orders` records the payable billing fact per checkout attempt.
- `subscription_records` records the recurring-access lifecycle fact derived from confirmed payment or later renewal events.
- `entitlements` is the current-state projection consumed by access control; it must always trace back to a fact or ledger source row.
- `reward_ledger` records reward grants or reversals in canonical `vip_days`.
- `promo_redemptions` records promo redemption attempts and outcomes with idempotent traceability.
- `quota_consumption_logs` records append-only quota burns; remaining quota is projected elsewhere and never back-written into the ledger row.
- `publish_batches` groups a set of newly available or revised content releases for discovery and messaging.
- `user_follows`, `user_notification_prefs`, and `user_content_state` are user-scoped current-state tables used by discovery, inbox, resume, and notification decisions.
- `notification_campaigns` defines reusable delivery policy and templates; `notification_deliveries` stores channel attempt facts; `notification_inbox` stores the durable end-user inbox state.
