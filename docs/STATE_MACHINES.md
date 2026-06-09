# Stage B State Machines

## `article_variants.publish_status`

States:

- `draft`
- `review_pending`
- `approved`
- `scheduled`
- `published`
- `paused`
- `archived`

Allowed transitions:

- `draft -> review_pending`
- `review_pending -> approved`
- `review_pending -> draft`
- `approved -> scheduled`
- `approved -> published`
- `scheduled -> published`
- `published -> paused`
- `paused -> published`
- `published -> archived`
- `paused -> archived`

Rules:

- Only `published` or effective `scheduled` variants are selectable for reading.
- `archived` variants can remain in audit history and sync tombstones, but are not readable.

## `payment_orders.status`

States:

- `created`
- `pending_payment`
- `paid`
- `failed`
- `cancelled`
- `refunded`
- `closed`

Allowed transitions:

- `created -> pending_payment`
- `created -> cancelled`
- `pending_payment -> paid`
- `pending_payment -> failed`
- `pending_payment -> cancelled`
- `paid -> refunded`
- `failed -> closed`
- `cancelled -> closed`

Rules:

- `paid` is a billing fact milestone.
- Entitlement grant occurs after or together with transition into `paid`, never before.

## `subscription_records.status`

States:

- `trial`
- `active`
- `grace`
- `paused`
- `cancelled`
- `expired`

Allowed transitions:

- `trial -> active`
- `trial -> cancelled`
- `active -> grace`
- `active -> paused`
- `active -> cancelled`
- `active -> expired`
- `grace -> active`
- `grace -> cancelled`
- `grace -> expired`
- `paused -> active`
- `paused -> cancelled`
- `cancelled -> expired`

Rules:

- `subscription_records` is the lifecycle fact for recurring access.
- `entitlements` may remain active during `grace` according to grant policy.

## `promo_campaigns.status`

States:

- `draft`
- `active`
- `paused`
- `inactive`
- `archived`

Allowed transitions:

- `draft -> active`
- `draft -> archived`
- `active -> paused`
- `active -> inactive`
- `paused -> active`
- `paused -> inactive`
- `inactive -> active`
- `inactive -> archived`

Rules:

- Campaign window evaluation uses `Asia/Shanghai`.
- `archived` campaigns remain in history and reconciliation traces but must not accept new redemptions or new order settlement.

## `promo_redemptions.status`

States:

- `initiated`
- `validated`
- `applied`
- `rejected`
- `reversed`

Allowed transitions:

- `initiated -> validated`
- `initiated -> rejected`
- `validated -> applied`
- `validated -> rejected`
- `applied -> reversed`

Rules:

- Ledger rows remain append-only even if later reversed.
- `applied` may fan out into entitlement or reward projection updates.

## `referrals.status`

States:

- `bound`
- `registration_reward_granted`
- `qualified`
- `completed`
- `rejected`

Allowed transitions:

- `bound -> registration_reward_granted`
- `bound -> qualified`
- `bound -> rejected`
- `registration_reward_granted -> qualified`
- `qualified -> completed`
- `qualified -> rejected`

Rules:

- Bind success does not imply full reward completion.
- Main inviter reward is unlocked only after the defined valid action milestone.

## `reward_ledger.status`

States:

- `pending`
- `granted`
- `reversed`
- `expired`

Allowed transitions:

- `pending -> granted`
- `pending -> expired`
- `granted -> reversed`

Rules:

- Rewards are immutable ledger facts; reversal is represented by a new ledger entry or status change with traceability.

## `publish_batches.status`

States:

- `draft`
- `scheduled`
- `publishing`
- `published`
- `cancelled`
- `archived`

Allowed transitions:

- `draft -> scheduled`
- `draft -> cancelled`
- `scheduled -> publishing`
- `scheduled -> cancelled`
- `publishing -> published`
- `published -> archived`
- `cancelled -> archived`

Rules:

- A batch is discoverable only after `published`.
- Batch state never overrides per-item audience, entitlement, or availability rules.

## `user_follows.status`

States:

- `active`
- `muted`
- `removed`

Allowed transitions:

- `active -> muted`
- `active -> removed`
- `muted -> active`
- `muted -> removed`
- `removed -> active`

Rules:

- `removed` keeps traceability for idempotent re-follow and dedupe history.
- `muted` preserves the follow edge for discovery but suppresses immediate notifications.

## `notification_campaigns.status`

States:

- `draft`
- `active`
- `paused`
- `inactive`
- `archived`

Allowed transitions:

- `draft -> active`
- `draft -> archived`
- `active -> paused`
- `active -> inactive`
- `paused -> active`
- `paused -> inactive`
- `inactive -> active`
- `inactive -> archived`

Rules:

- Campaign activation only enables targeting and templating; it does not bypass user preferences.

## `notification_deliveries.status`

States:

- `queued`
- `suppressed`
- `sent`
- `delivered`
- `opened`
- `failed`
- `expired`

Allowed transitions:

- `queued -> suppressed`
- `queued -> sent`
- `queued -> failed`
- `sent -> delivered`
- `sent -> failed`
- `delivered -> opened`
- `delivered -> expired`
- `suppressed -> expired`
- `failed -> expired`

Rules:

- `suppressed` is a first-class outcome for quiet hours, dedupe, or preference blocks.
- `opened` reflects user interaction with a delivered notification or linked inbox item.

## `notification_inbox.status`

States:

- `unread`
- `read`
- `archived`
- `expired`

Allowed transitions:

- `unread -> read`
- `unread -> archived`
- `unread -> expired`
- `read -> archived`
- `read -> expired`

Rules:

- Inbox entries are durable user-visible records even if push was never sent.
- `expired` items stay in audit/history but are not actionable.

## `user_profiles.session_state`

States:

- `anonymous`
- `active`
- `refreshing`
- `signed_out`
- `disabled`
- `remote_stubbed`

Allowed transitions:

- `anonymous -> active`
- `anonymous -> remote_stubbed`
- `active -> refreshing`
- `refreshing -> active`
- `active -> signed_out`
- `remote_stubbed -> signed_out`
- `signed_out -> active`
- `active -> disabled`

Rules:

- H0 allows local and remote placeholder states but does not imply a full sign-in flow exists.

## `device_installations.push_permission_state`

States:

- `unknown`
- `prompt`
- `granted`
- `denied`

Allowed transitions:

- `unknown -> prompt`
- `prompt -> granted`
- `prompt -> denied`
- `denied -> granted`

Rules:

- This state mirrors device capability only and does not replace user notification prefs.

## `notification_deliveries.delivery_decision`

States:

- `eligible_for_delivery`
- `suppressed_by_quiet_hours`
- `deduped`
- `digest_queued`

Allowed transitions:

- `eligible_for_delivery -> deduped`
- `eligible_for_delivery -> suppressed_by_quiet_hours`
- `eligible_for_delivery -> digest_queued`

Rules:

- `delivery_decision` is preview/transport metadata and does not replace `notification_deliveries.status`.

## `user_content_state.reading_state`

States:

- `unseen`
- `in_progress`
- `completed`

Allowed transitions:

- `unseen -> in_progress`
- `unseen -> completed`
- `in_progress -> completed`
- `completed -> in_progress`

Rules:

- Resume surfaces only use `in_progress`.
- A new revision may move a previously completed row back to `in_progress` if product logic later decides resume is meaningful.

## `user_content_state.bookmark_status`

States:

- `none`
- `saved`
- `removed`

Allowed transitions:

- `none -> saved`
- `saved -> removed`
- `removed -> saved`

Rules:

- Bookmark toggles must preserve reading progress fields.
