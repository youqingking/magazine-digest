# Shared Enums And Keys

## Purpose

Step 02 freezes the shared vocabulary that contracts, package APIs, and future adapters must use.

References:

- `docs/STAGE_B_DECISIONS.md`
- `docs/STAGE_F0_DECISIONS.md`
- `docs/STAGE_F1_DECISIONS.md`
- `docs/STAGE_G_DECISIONS.md`
- `docs/STAGE_H0_DECISIONS.md`
- `docs/STATE_MACHINES.md`
- `docs/RULE_PRECEDENCE.md`
- `docs/STATE_UI_GUIDELINES.md`

## Naming Rules

- shared keys must not use `article`, `video`, `publication`, `channel`, or `issue` in their canonical names
- legacy field names may remain in domain storage and adapters
- when current repo vocabulary is narrower than future shared needs, Step 02 freezes the canonical term and the migration note, not a forced backfill

## Canonical Enums

| Vocabulary | Canonical values | Source alignment | Migration notes |
| --- | --- | --- | --- |
| `reading_mode` | `quick_30s`, `deep_3m` | matches current mobile contract and runtime fixtures | future values are additive only; do not rename existing modes in Step 02 |
| `audience_segment` | `general`, `teen`, `adult` | matches Stage B rule precedence and mobile contract | legacy `audience_mode` UI/state can map into canonical `audience_segment` |
| `publish_status` | `draft`, `review_pending`, `approved`, `scheduled`, `published`, `paused`, `archived` | matches `docs/STATE_MACHINES.md` | shared docs use `publish_status`; keep domain collection names unchanged |
| `update_type` | `new_publish`, `revision`, `correction`, `highlight_refresh`, `sunset` | matches `docs/CONTENT_NEWNESS_MODEL.md` and F0 | no domain rewrite required; adapters may derive the value |
| `update_priority` | ordered integer `0-100`; current repo uses high values such as `80` and `100` | aligns with F0/G rule that priority is an ordering hint, not a separate workflow state | canonical term is `update_priority`; avoid parallel synonyms such as `severity_rank` |
| `notify_level` | `default`, `immediate`, `mandatory` | `default` and `immediate` are already present in fixtures; `mandatory` is frozen by notification rules | existing field names stay; new shared code must not invent channel-specific enums here |
| `runtime_mode` | `local`, `remote`, `hybrid` | matches H0 decision freeze | `hybrid` means remote seam with local fallback; do not create extra aliases |
| `entitlement_status` | minimum shared set: `active`, `inactive`; reserved additive values: `grace`, `revoked`, `expired` | aligns with shared access snapshot language and subscription lifecycle docs | Step 02 freezes the canonical term and minimum interoperable values; richer lifecycle mapping remains additive |
| `quota_status` | minimum shared set: `available`, `exhausted`; reserved additive values: `limited`, `reset_pending` | aligns with Stage G quota preview and `quota_exhausted` event language | keep current domain-specific quota policy detail outside shared vocabulary |
| `notification_type` | `release_update`, `follow_update`, `resume_reminder`, `system_notice`, `commercial_notice` | freezes shared inbox intent without forcing current runtime fixture fields to rename | current `source_type=publish_batch` maps to `release_update`; `source_type=follow_subject` maps to `follow_update` |
| `discovery_section_type` | `fresh_batch`, `follow_update`, `resume`, `saved`, `search_result`, `manual_slot` | aligns with F0/F1 discovery surfaces and current section keys | current instance keys such as `today_new`, `since_last_visit`, `continue_reading`, `saved_for_later` remain adapter inputs |
| `follow_target_type` | `content_source`, `taxonomy_tag`, `release_batch`, `collection` | aligns with F0 follow surfaces without leaking `publication` or `channel` into shared core naming | current `subject_type=publication` maps to `content_source`; future channel-level follow remains domain-specific unless promoted |
| `campaign_status` | `draft`, `active`, `paused`, `inactive`, `archived` | matches `promo_campaigns.status` state machine | shared docs use `campaign_status`; existing tables remain unchanged |
| `experiment_bucket_shape` | shape only in Step 02: `{ bucket_key, assignment_version, assignment_source, payload_ref? }` | aligns with current `experimentAssign` response shape | bucket values are not frozen yet; only the assignment shape is frozen |
| `state_panel_type` | `loading`, `empty`, `error`, `unavailable`, `cached`, `placeholder` | matches `docs/STATE_UI_GUIDELINES.md` and E2 | `premium locked / paywall preview` remains a presentation state, not a core panel type |

## Canonical Keys

| Canonical key | Legacy / domain alias | Rule |
| --- | --- | --- |
| `product_key` | same | required across shared contracts |
| `source_id` | `publication_id`, future `channel_id` mapper output | shared runtime speaks only `source_id` |
| `source_key` | `publication_key`, future `channel_key` mapper output | keep domain storage stable, map at adapter edge |
| `content_item_id` | `article_id`, future `video_id` mapper output | shared contracts do not expose `article_id` |
| `content_key` | `article_key`, future `video_key` mapper output | generic content identity only |
| `content_variant_id` | `article_variant_id`, future summary-variant ids | generic variant identity only |
| `release_batch_id` | `publish_batch_id` physical field may stay during migration | shared docs prefer `release_batch_id` for canonical model naming |
| `release_batch_key` | `publish_batch_key` | additive alias only |
| `follow_target_key` | `subject_key` | shared naming should not depend on follow catalog internals |
| `notification_id` | `_id`, `notification_inbox_id` | shared models prefer semantic ids over store-specific names |
| `campaign_key` | same | shared commercial surfaces keep this stable |
| `experiment_key` | same | shared experimentation surfaces keep this stable |

## Canonical Term Unification

| Current synonym | Canonical shared term | Migration suggestion |
| --- | --- | --- |
| `publication` when used as shared source noun | `content_source` | keep `publication` inside magazine domain objects and adapters |
| `article` when used as shared content noun | `content_item` | keep `article` in current storage and domain code; map at adapter edge |
| `article_variant` when used as shared variant noun | `content_variant` | do not rename existing collections in Step 02 |
| `subject_type` / `subject_key` | `follow_target_type` / `follow_target_key` | shared docs and packages should adopt the canonical names |
| `source_type` on inbox items | `notification_type` | preserve existing fixture field for now; adapters map to canonical type |
| section instance keys such as `today_new` | `discovery_section_type` plus `section_key` | keep both: `section_key` for instance identity, `section_type` for shared semantics |

## Reserved Domain-Specific Vocabulary

These must stay outside shared canonical enums unless promotion rules are met:

- issue registry status
- timestamp anchors
- watch-or-skip decision labels
- input quality tier
- video duration buckets
- print section path and cover-slot labels
