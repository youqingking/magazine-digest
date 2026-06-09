# Shared Canonical Models

## Purpose

Step 02 freezes the shared canonical models that sit above magazine and future YouTube domain objects.

Rules:

- shared names stay content-type-agnostic
- shared models are additive contracts, not a rewrite of existing domain storage
- magazine and YouTube must enter these models through adapters or mappers
- fields that still encode print-only or video-only semantics remain in the domain layer

References:

- `docs/SHARED_BASE.md`
- `docs/DOMAIN_SPLIT.md`
- `docs/SHARED_ENUMS_AND_KEYS.md`
- `docs/SHARED_MODEL_EXAMPLES.md`
- `docs/SHARED_CHANGE_POLICY.md`

## Canonical Models

| Model | What it is | Why it is shared | Required shared fields | Must stay domain-specific |
| --- | --- | --- | --- | --- |
| `ProductContext` | Product-scoped runtime context carried by shared services and UI | every shared contract, cache key, event, and policy is `product_key` scoped | `product_key`, `product_id`, `locale`, `timezone`, `platform`, `runtime_mode`, `release_channel` | domain launch copy, product-specific campaign copy, source-specific onboarding hints |
| `ContentRef` | Stable reference to a logical content item and its source | both magazine and YouTube need a generic way to refer to content without leaking `article` or `video` nouns | `product_key`, `source_id`, `source_key`, `content_item_id`, `content_key`, `language` | `publication_id`, `issue_label`, `channel_id`, `video_id`, source-native permalink conventions |
| `ContentVariantKey` | Selector key for one readable variant of a content item | variant selection by audience and mode is already shared platform behavior | `product_key`, `content_item_id`, `language`, `audience_segment`, `reading_mode`, `revision` | article-only variant ids, transcript asset ids, dub/caption asset ids, print layout references |
| `ContentListItem` | Shared list-card projection for discovery, search, inbox landing, and saved/resume lists | both domains need a stable shell card shape | `content_ref`, `primary_variant_key`, `title`, `summary`, `tags`, `publish_status`, `available_from`, `available_until`, `update_type`, `update_priority` | magazine page number, issue cover slot, YouTube duration badge, thumbnail crop policy |
| `ContentDetailEnvelope` | Shared detail payload wrapper for one resolved variant plus state previews | detail read path, entitlement preview, quota preview, and runtime provenance are platform concerns | `content_ref`, `resolved_variant_key`, `title`, `body`, `body_format`, `tags`, `entitlement_snapshot`, `quota_snapshot`, `runtime_mode`, `source`, `fetched_at` | timestamp anchors, chapter markers, watch-or-skip guidance, print spread layout, issue TOC placement |
| `DiscoverySection` | Shared section wrapper for feed, search modules, continue reading, and saved/follow slices | discovery shells must be reusable across content domains | `section_key`, `section_type`, `title`, `items`, `position`, `state_panel_type` | publication-only editorial buckets, playlist-only grouping rules, source-native artwork rules |
| `FollowTarget` | Shared followable entity projection | both domains need follows, but not the same source nouns | `product_key`, `follow_target_type`, `follow_target_key`, `display_name`, `notify_level`, `status` | magazine publication filters, YouTube creator policy, playlist grouping semantics, author-specific governance |
| `InboxItem` | Durable user-visible notification/inbox projection | inbox-first notification truth is shared platform behavior | `notification_id`, `product_key`, `user_id`, `notification_type`, `title`, `body_preview`, `action_ref`, `status`, `created_at`, `updated_at` | source-native deep link fragments, timestamp jumps, issue page jump targets |
| `NotificationPreferenceSnapshot` | Shared per-product notification preference snapshot | push/inbox/digest rules are cross-domain | `product_key`, `user_id`, `push_enabled`, `inbox_enabled`, `digest_enabled`, `follow_alert_level`, `breaking_push_override`, `quiet_hours_enabled`, `quiet_hours_start_minute`, `quiet_hours_end_minute`, `timezone` | creator-specific alert bundles, publication-only digest copy templates |
| `UserContentState` | Shared per-user projection for progress, bookmark, and newness | continue reading, save-for-later, and seen/opened state are reusable | `product_key`, `user_id`, `content_item_id`, `reading_state`, `bookmark_status`, `newness_state`, `resume_progress_basis_points`, `last_opened_at`, `last_read_mode` | scroll anchor internals, playback timestamp anchors, watch completion thresholds, transcript checkpoint ids |
| `EntitlementSnapshot` | Shared current-state access projection for one user and product context | access decision surfaces must not fork by content type | `product_key`, `subject_id`, `access_state`, `decision_source`, `entitlement_status`, `granted_at`, `expires_at`, `denial_reason` | payment-provider trace ids, source-native purchase packaging, domain-only benefit copy |
| `QuotaSnapshot` | Shared usage/quota projection that can be shown in paywall, profile, and detail contexts | quota preview and exhaustion handling are shared product concerns | `product_key`, `quota_status`, `remaining`, `total`, `reset_at`, `policy_id`, `reason` | domain-only consumption units, source-specific soft-limit narratives |
| `PricingPreview` | Shared preview of price settlement before purchase | pricing preview, floor application, and campaign attachment are shared commercial seams | `product_key`, `pricing_plan_id`, `original_amount_fen`, `final_amount_fen`, `price_floor_fen`, `applied_price_multiplier_basis_points`, `floor_applied`, `campaign_id`, `campaign_status`, `denial_reason` | provider form fields, region-specific payment channel payloads, domain-only merchandising copy |
| `CampaignPreview` | Shared campaign summary shown in paywall, invite, or notifications | campaigns and promo previews are cross-domain platform capabilities | `product_key`, `campaign_id`, `campaign_key`, `campaign_status`, `title`, `subtitle`, `discount_label`, `eligibility_summary`, `start_at`, `end_at` | domain-specific landing art, editorial sponsorship details, source-only fulfillment rules |
| `ExperimentAssignment` | Shared experiment assignment result used by runtime and UI | experiment wiring is platform-level and should not depend on one content type | `product_key`, `installation_id`, `experiment_id`, `experiment_key`, `assignment_version`, `bucket_key`, `assignment_source`, `bucket_shape`, `cache_ttl_seconds` | algorithm-specific feature payloads, source-ranking internals, domain-only optimization metrics |
| `PublishBatchSummary` | Shared summary for one publish/release batch | magazine drops and future YouTube release bundles both need release-level summary surfaces | `product_key`, `release_batch_id`, `release_batch_key`, `title`, `description`, `status`, `item_count`, `effective_at`, `updated_at` | issue label, issue packaging rules, playlist premiere windows, video-series rollout metadata |
| `RuntimeMode` | Shared runtime selection value object for local, remote, or hybrid execution | runtime provenance and fallback are platform-wide concerns | `runtime_mode`, `source`, `remote_ready`, `fallback_mode`, `resolved_at` | remote base URLs, credential material, transport-specific diagnostics |

## Model Notes

### `ContentRef`

- shared contract aliases current magazine fields through adapters:
  - `publication_id` -> `source_id`
  - `publication_key` -> `source_key`
  - `article_id` -> `content_item_id`
  - `article_key` -> `content_key`
- a future YouTube adapter maps `channel` or other content origin concepts into the same shape without making shared code speak in video-native nouns

### `ContentVariantKey`

- shared selection continues to use `audience_segment` and `reading_mode` from Stage B and Stage F0/F1
- variant identity remains generic even if the source domain stores article variants or video summary variants differently

### `UserContentState`

- Step 02 freezes only generic progress and list-state vocabulary
- playback-derived resume anchors, watch percentage rules, and print-scroll hints stay outside shared canonical truth

### `RuntimeMode`

- Step 02 freezes `local`, `remote`, and `hybrid` as the shared vocabulary from H0
- runtime configuration values and real transport setup remain outside this step

## Adapter Boundary

Shared models are projection targets, not source-of-truth replacements for current domain storage.

- magazine domain objects map into shared canonical models through magazine adapters
- YouTube domain objects map into shared canonical models through YouTube adapters
- Step 02 does not move or rename existing domain files, collections, or runtime flows
