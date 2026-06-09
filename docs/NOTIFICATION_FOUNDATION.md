# Notification Foundation

- `notification_inbox` is the user-visible source of truth in F1.
- `notification_deliveries` is allowed as a local inspection log but not the primary mobile read path.
- Quiet hours suppress immediate transport only; they do not remove inbox records.
- Dedupe reuses durable inbox identity when source identity is materially the same.
- Digest is a packaging mode over inbox-worthy traffic.
- Stage H0 keeps these rules frozen while adding `push-capability` and `notification-delivery-preview` as foundation seams only.
