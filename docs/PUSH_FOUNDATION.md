# Push Foundation

- `notification_inbox` remains canonical user truth
- push is transport-only and best effort
- H0 adds `push-capability` and `notification-delivery-preview`
- delivery preview must express:
  - suppressed by quiet hours
  - deduped
  - eligible for delivery
  - digest queued
- no vendor fanout engine or mass send dashboard is introduced in H0
- H0.5 adds dev-safe visibility for `getPushClientId`, CID presence, and `register-device` / `setPushCid` hook readiness
