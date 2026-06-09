# Stage E0 Mobile Read Path

## Page to surface mapping

- Feed:
  - `bootstrap-config`
  - `content-sync-delta`
  - `experiment-assign`
- Detail:
  - `content-detail`
  - `entitlement-snapshot`
  - `event-ingest`
- Paywall:
  - `entitlement-snapshot`
  - `pricing-preview`
  - `event-ingest`
- Settings:
  - local store and cache only
- Profile / Invite / Campaign:
  - contract-backed placeholder data from session, pricing, and event adapter

## Cache key design

- Bootstrap: `stage_e0_mobile:{product_key}:bootstrap-config`
- Feed: `stage_e0_mobile:{product_key}:feed`
- Detail: `stage_e0_mobile:{product_key}:detail:{article_id}:{audience_mode}:{reading_mode}`
- Pricing: `stage_e0_mobile:{product_key}:pricing-preview`
- Entitlement: `stage_e0_mobile:{product_key}:entitlement:{subject_id}`
- Settings/session: `stage_e0_mobile:settings` and `stage_e0_mobile:session`

## Offline fallback

- Runtime calls are attempted first in the selected adapter mode.
- If the selected adapter fails and cache exists, feed/detail/pricing/entitlement fall back to cache and mark state as `cached`.
- If no cache exists, the page must surface explicit `error` or `unavailable_reason`.
- Cached detail is still audience/mode scoped, so teen requests never reuse adult cache entries.

## Paywall trigger rules

- Detail and paywall use `entitlement-snapshot`.
- When `access_state !== active` or `quota_remaining <= 0`, paywall entry is shown.
- Stage E0 does not create real orders; paywall is display-only and uses canonical `fen` formatting.
