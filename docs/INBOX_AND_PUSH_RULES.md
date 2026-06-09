# Stage F0 Inbox And Push Rules

## Channel Model

- Inbox is the durable channel.
- Push is best-effort and never the only user-visible record for an important update.
- Digest is a packaging mode over inbox-worthy items, not a separate content truth source.

## Delivery Order

1. Validate product, campaign, content availability, and access safety.
2. Create or reuse the durable inbox item when the message is eligible.
3. Evaluate push eligibility from OS permission mirror, `user_product_profiles.push_opt_in`, and `user_notification_prefs`.
4. Apply quiet hours and dedupe.
5. Send push only if still eligible.
6. Aggregate digest only for items configured as non-immediate or user-preferred digest traffic.

## Quiet Hours

- Quiet hours are interpreted in the preference row timezone, defaulting operationally to `Asia/Shanghai` unless a later locale policy says otherwise.
- Quiet hours suppress immediate push and may defer digest assembly.
- Quiet hours do not delete or skip durable inbox entries unless the entire campaign is suppressed.
- `notify_level=mandatory` or `breaking_push_override=true` may bypass quiet-hours push suppression.

## Dedupe

- Dedupe happens on stable source identity, user, channel, and campaign window.
- A duplicate push attempt should typically reuse the existing inbox item and mark the new delivery row as `suppressed`.
- Dedupe must not collapse distinct revisions when `publish_batch_id` or `update_type` differs materially.

## Read And Open Semantics

- `notification_received` fires when a delivery or inbox record becomes visible to the user.
- `notification_open` fires when the user opens from push or system tray entry.
- `inbox_open` fires when the inbox surface is opened.
- `digest_open` fires when a digest summary item is opened.

## Failure Rules

- Provider send failure does not revoke the inbox item.
- Expired content should transition inbox items to non-actionable state instead of silently disappearing from audit trails.
