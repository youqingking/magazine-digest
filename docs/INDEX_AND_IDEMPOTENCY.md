# Stage B Index And Idempotency Freeze

## Unique Business Keys

| Table | Business key / uniqueness scope |
| --- | --- |
| `article_variants` | `product_key + article_id + language + audience_segment + reading_mode + revision` |
| `user_product_profiles` | `product_key + user_id` |
| `device_installations` | `product_key + installation_id` |
| `experiment_assignments` | `product_key + experiment_id + subject_type + subject_id + assignment_version` |
| `promo_codes` | `product_key + code` |
| `promo_redemptions` | `product_key + redemption_key` and defensive uniqueness on `product_key + code_id + user_id` |
| `referrals` | `product_key + invitee_user_id` and `product_key + installation_id` for successful binds |
| `payment_orders` | `product_key + idempotency_key` |
| `subscription_records` | `product_key + external_subscription_ref + billing_cycle_anchor` |
| `event_logs_raw` | `product_key + dedup_key` |
| `publish_batches` | `product_key + batch_key` |
| `user_follows` | `product_key + user_id + subject_type + subject_key` |
| `user_notification_prefs` | `product_key + user_id` |
| `notification_campaigns` | `product_key + campaign_key` |
| `notification_deliveries` | `product_key + delivery_key` |
| `notification_inbox` | `product_key + user_id + inbox_key` |
| `user_content_state` | `product_key + user_id + article_id` |
| `register-device` seam | `product_key + installation_id` reuses `device_installations` |

## Write Path Strategy

| Write path | Transaction | Compare-and-set | Idempotency key | Append-only |
| --- | --- | --- | --- | --- |
| create payment order | no | no | required | no |
| confirm payment | yes | yes on order status | provider event id + order id | payment fact updates only |
| grant entitlement | yes when coupled with billing | yes on projection version | grant key | projection update |
| redeem promo | yes | yes on code availability | redemption key | yes |
| bind referral | yes | yes on invitee / installation uniqueness | bind key | no |
| grant reward | yes when coupled with referral milestone | optional on referral state | reward key | yes |
| ingest event | no | no | dedup key | yes |
| publish batch create / publish | yes | yes on batch status | batch key | no |
| follow toggle | yes | yes on follow edge row | required | no |
| update notification prefs | no | optional on `updated_at` | optional | no |
| create notification delivery | yes | yes on campaign/user/channel dedupe query | delivery key | no |
| mark inbox read | yes | yes on inbox status | required | no |
| save for later / resume update | yes | yes on row `updated_at` when needed | required for toggle writes | no |

## Per-Path Notes

### Create Payment Order

- Server owns final pricing computation.
- Duplicate client retries on the same `idempotency_key` must return the existing order.

### Confirm Payment

- Transition `payment_orders.status` with compare-and-set to prevent duplicate settlement.
- Create at most one `subscription_records` row per external subscription reference and billing anchor.

### Grant Entitlement

- `entitlements` is current-state projection; it must store `last_grant_source_type` and `last_grant_source_id`.
- Replaying the same billing or reward event must not duplicate the grant.

### Redeem Promo

- `promo_redemptions` is append-only.
- Unique `redemption_key` is built from `product_key + code + user_id + request_id`.

### Bind Referral

- Successful binds require transaction protection across referral row creation and anti-abuse uniqueness checks.
- Installation-level uniqueness is the minimum anti-abuse baseline.

### Grant Reward

- Reward ledger key format freezes as `product_key + reward_type + beneficiary_user_id + source_ref`.
- Separate reward events are required for registration reward and first-valid-action reward.

### Ingest Event

- `dedup_key` should be deterministic from `request_id`, event name, subject ids, and occurred timestamp bucket.
- Duplicate events return accepted-with-duplicate semantics.

### Publish Batch

- `batch_key` must be stable across retries from the same editorial release job.
- Batch publish is compare-and-set protected on status so repeated fan-out does not recreate downstream inbox or delivery rows.

### Follow Toggle

- `follow-toggle` reuses the current-state row keyed by user and subject instead of creating append-only duplicates.
- Idempotent remove should return the stored `removed` state if the edge was already removed.

### Notification Delivery

- `delivery_key` should be deterministic from `product_key + campaign_id + user_id + delivery_channel + source_ref`.
- Dedupe checks must run before provider send and before inbox insertion when the same durable message already exists.

### Register Device

- H0 reuses `device_installations` current-state row keyed by `product_key + installation_id`.
- Re-registering the same installation updates `last_seen_at`, capability, and remote metadata without creating duplicate rows.

### Auth Refresh

- Refresh is foundation-only in H0, but refresh retries should reuse the same caller session identity and return the latest stable session snapshot.

### Mark Inbox Read

- Bulk mark-read uses one idempotency key per caller intent, not per inbox row.
- Rows already in `read`, `archived`, or `expired` must return success without mutation conflict.

### User Content State

- Bookmark toggle and resume progress share one row keyed by `product_key + user_id + article_id`.
- Removing a bookmark must not delete resume progress; deleting the whole row is not the default write path.

## Index Recommendations

- Every product-scoped table should lead with `product_key`.
- Read-heavy content tables should index `product_key + publication_id` and `product_key + article_id`.
- Statused workflow tables should index `product_key + status + updated_at`.
- Ledger tables should index `product_key + user_id + created_at`.
- Notification inbox and resume queries should additionally index `product_key + user_id + status_or_state + updated_at`.
