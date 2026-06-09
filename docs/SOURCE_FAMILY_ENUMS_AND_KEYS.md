# Source Family Enums And Keys

## Purpose

Step 03 freezes the family-layer vocabulary that is broader than a single source but still not suitable for shared core.

Shared core remains unchanged.

References:

- `docs/SHARED_ENUMS_AND_KEYS.md`
- `docs/SOURCE_FAMILY_MODELS.md`

## Family Names

Canonical `source_family_name` values:

- `transcript_first_longform`
- `official_structured_sources`
- `knowledge_community_qa`
- `open_social_expert_stream`
- `visual_inspiration_curated_asset`

## Family Enums

| Vocabulary | Canonical values | Family |
| --- | --- | --- |
| `transcript_status` | `available`, `partial`, `missing`, `blocked` | transcript-first longform |
| `transcript_completeness_state` | `complete`, `partial`, `excerpt_only`, `unknown` | transcript-first longform |
| `clip_anchor_type` | `timestamp_range`, `speaker_turn`, `segment_ref` | transcript-first longform |
| `record_kind` | `filing`, `register_entry`, `paper_record`, `official_notice` | official structured sources |
| `record_status` | `draft`, `filed`, `effective`, `superseded`, `withdrawn` | official structured sources |
| `revision_kind` | `initial`, `amended`, `corrected`, `restated`, `withdrawn` | official structured sources |
| `party_role` | `issuer`, `filer`, `agency`, `author`, `applicant` | official structured sources |
| `thread_status` | `open`, `answered`, `closed`, `archived` | knowledge community / Q&A |
| `acceptance_state` | `accepted`, `not_accepted`, `not_applicable` | knowledge community / Q&A |
| `moderation_state` | `visible`, `collapsed`, `locked`, `removed` | knowledge community / Q&A and open social |
| `qa_sort_mode` | `score`, `accepted_first`, `recent`, `activity` | knowledge community / Q&A |
| `reshare_type` | `repost`, `quote`, `share` | open social / expert stream |
| `freshness_state` | `live`, `fresh`, `aging`, `archived` | open social / expert stream |
| `watch_reason` | `author_watch`, `list_watch`, `topic_watch`, `manual_watch` | open social / expert stream |
| `asset_kind` | `image`, `graphic`, `scan`, `board_card`, `mixed_asset` | visual inspiration / curated asset |
| `license_class` | `open`, `attribution_required`, `restricted`, `unknown` | visual inspiration / curated asset |
| `arrangement_role` | `primary`, `supporting`, `featured`, `pinned` | visual inspiration / curated asset |

## Family Keys

| Canonical key | Used by |
| --- | --- |
| `source_family_name` | all family contracts |
| `source_family_item_id` | all family contracts |
| `transcript_document_id` | transcript-first longform |
| `segment_id` | transcript-first longform |
| `speaker_ref` | transcript-first longform |
| `record_id` | official structured sources |
| `revision_id` | official structured sources |
| `delta_id` | official structured sources |
| `party_id` | official structured sources |
| `qa_thread_id` | knowledge community / Q&A |
| `qa_answer_id` | knowledge community / Q&A |
| `accepted_answer_id` | knowledge community / Q&A |
| `social_post_id` | open social / expert stream |
| `reply_tree_id` | open social / expert stream |
| `watchlist_id` | open social / expert stream |
| `asset_id` | visual inspiration / curated asset |
| `collection_id` | visual inspiration / curated asset |
| `license_id` | visual inspiration / curated asset |

## Family Vocabulary Guardrail

- family enums may use family nouns such as `transcript`, `record`, `answer`, `post`, and `asset`
- family enums must not use single-source nouns such as `edgar_accession_no`, `bluesky_uri`, `stackexchange_site_slug`, or `pinterest_pin_id` as canonical family vocabulary
- if a term is only natural for one source inside a family, it stays in the adapter
