# Stage B RBAC Freeze

Stage B does not create a separate admin identity store. Future uni-admin integration can reuse platform identity while mapping roles to actions.

## Roles

| Role | Primary responsibility | Typical table access |
| --- | --- | --- |
| `admin` | Product lifecycle, pricing, feature control | all product-scoped tables, audit review |
| `operator` | Campaign operations, promo code batches, referral support | `promo_campaigns`, `promo_codes`, `promo_redemptions`, `referrals`, `reward_ledger` |
| `analyst` | Event metrics, experiment analysis, audit trace lookup | `event_logs_raw` read, `event_metrics_daily`, `experiment_assignments`, `audit_logs` |
| `content_reviewer` | Publication and variant workflow review | `publications`, `articles`, `article_variants` |

## Sensitive Actions Requiring Audit

- change product active status
- publish, pause, or archive article variants
- change pricing plan status or amount
- create or deactivate promo campaigns
- manually grant or revoke entitlements
- manually reverse rewards
- replay billing confirmation

## Audit Requirements

- Every sensitive action must append `audit_logs`.
- Audit rows must include actor, target, before summary, after summary, and trace id.
