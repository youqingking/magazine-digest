# Play Store Technical Blockers

## Status

This M2 blocker list is evidence-bound and dry-run only. It does not execute any C5 production action.

| Blocker | status | claim_class | evidence_refs | owner action |
| --- | --- | --- | --- | --- |
| Android build artifact missing | `blocked` | `C4` | `evidence.rba.android_build_missing` | Decide EAS/local release build path |
| EAS owner/projectId/build profile missing | `needs_human` | `C5` | `evidence.rba.eas_missing` | Provide owner-confirmed EAS identity outside repo |
| signing policy missing | `needs_human` | `C5` | `evidence.rba.signing_missing` | Decide keystore/service-account policy; do not add credentials here |
| Play Console app evidence missing | `blocked` | `C5` | `evidence.rba.play_console_missing` | Owner must create/confirm app externally |
| Privacy policy URL and Developer contact missing | `needs_human` | `C4` | `evidence.rba.store_required_fields_missing` | Owner/Pro review required |
| Data safety/listing/screenshots/content rating/target audience unresolved | `needs_human` | `C4` | `evidence.rba.store_review_missing` | Owner/Pro review required |

## Forbidden Actions

- do not run `eas submit`
- do not call Google Play API
- do not upload credentials
- do not execute Play Console submission or rollout
- do not write `production_ready` as a positive claim

## Human Review Required

Android build, EAS, Play Console, signing, privacy, listing, screenshots, content rating, target audience, release track and rollout stay `human review required`.
