# LAUNCH_INFO

## Status

本文件是 Play Store launch source-of-truth 的人工可读版本。当前状态是 `draft`，由 `launch-info-collector` 维护，只用于 no-credential dry-run 和人工审查准备；不是 Google Play submission 判断。

所有 legal、privacy、trademark、Data safety、content rating、target audience、listing claim、screenshot asset 和 Play Store submission 结论均为 `NEED_HUMAN` / `human review required`。

## App Identity Draft

| Field | Draft value | Evidence | Review |
| --- | --- | --- | --- |
| app_display_name | `Magazine Digest Runtime Shell` | `apps/mobile/app.json` | human review required |
| public_listing_name | `Magazine Digest` | Draft source-of-truth | human review required |
| expo_slug | `magazine-digest-runtime-shell` | `apps/mobile/app.json` | human review required |
| scheme | `magazinedigest` | `apps/mobile/app.json` | human review required |
| android.package | `NEED_HUMAN` | No production Android package in app config | human review required |
| EAS owner / projectId | `NEED_HUMAN` | No approved account/project in repo | human review required |
| Google Play app id | `NEED_HUMAN` | No Play Console app evidence | human review required |

## Field Status

| Field | status | value | evidence_refs | review |
| --- | --- | --- | --- | --- |
| `app.app_display_name` | `observed_in_repo` | `Magazine Digest Runtime Shell` | `evidence.lic.mobile_app_config` | review before public store use |
| `app.public_listing_name_draft` | `inferred` | `Magazine Digest` | `evidence.lic.listing_draft` | human review required |
| `app.expo_slug` | `observed_in_repo` | `magazine-digest-runtime-shell` | `evidence.lic.mobile_app_config` | review before EAS use |
| `app.scheme` | `observed_in_repo` | `magazinedigest` | `evidence.lic.mobile_app_config` | review before public store use |
| `app.android_package` | `needs_human` | `NEED_HUMAN` | `evidence.lic.android_package_missing` | human review required |
| `app.eas_owner` | `needs_human` | `NEED_HUMAN` | `evidence.lic.eas_missing` | human review required |
| `app.eas_project_id` | `needs_human` | `NEED_HUMAN` | `evidence.lic.eas_missing` | human review required |
| `app.google_play_app` | `needs_human` | `NEED_HUMAN` | `evidence.lic.play_console_missing` | human review required |
| `google_play_fields.privacyPolicyUrl` | `needs_human` | `NEED_HUMAN` | `evidence.lic.privacy_policy_missing` | human review required |
| `google_play_fields.contactEmail` | `needs_human` | `NEED_HUMAN` | `evidence.lic.developer_contact_missing` | human review required |
| `google_play_fields.category` | `needs_human` | `NEED_HUMAN` | `evidence.lic.store_category_missing` | human review required |
| `google_play_fields.contentRating` | `needs_human` | `NEED_HUMAN` | `evidence.lic.content_rating_missing` | human review required |
| `google_play_fields.targetAudience` | `needs_human` | `NEED_HUMAN` | `evidence.lic.target_audience_missing` | human review required |

## Implemented Runtime Surface

Current listing and screenshot drafts may only describe:

- Expo-first mobile runtime shell.
- Local fixture-backed discovery list at `/`.
- Fixture-backed article detail / reading view at `/article/[articleId]`.
- Scenario/debug screen at `/debug` for internal evidence of seam status.
- `product_key`, selected scenario id, publication labels, article titles, summaries, and fixture body text.
- Reserved Supabase, RevenueCat, and Push seams shown as placeholders, not live services.

## Reserved But Not Implemented

These must not be described as available user-facing capabilities:

- Live Supabase sync.
- RevenueCat subscription purchase, paywall, entitlement grant, prices, or quotas.
- Push notification permission, token registration, inbox, or delivery.
- User account/auth.
- Production content pipeline.
- Google Play submission or release rollout.
- Production pricing, quota, feature flags, experiments, operations thresholds, or risk thresholds.

## Source Files

| Area | Source |
| --- | --- |
| Machine-readable source-of-truth | `docs/launch/store-fields/source-of-truth.json` |
| English listing draft | `docs/launch/google-play/listing.en-US.json` |
| Chinese listing draft | `docs/launch/google-play/listing.zh-CN.json` |
| Data safety draft | `docs/launch/google-play/data-safety-draft.md` |
| Data safety evidence | `docs/launch/google-play/data-safety-evidence.md` |
| Privacy review gate | `docs/launch/privacy/human-review-required.md` |
| Screenshot storyboard | `docs/launch/screenshots/storyboard.md` |
| Release gate | `docs/launch/release/PLAY_STORE_RELEASE_GATE.md` |
| Submission readiness | `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md` |

## NEED_HUMAN

- Google Play developer account and app creation.
- Android package name and signing ownership.
- EAS owner, projectId, build profile, keystore policy.
- Privacy policy URL, Developer contact, support email.
- Data safety answers and SDK disclosure.
- Trademark/content authorization.
- Content rating and target audience.
- Screenshot capture device/spec and public asset review.
- Submission/rollout decision.
