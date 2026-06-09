# Source Family Models

## Purpose

Step 03 freezes the family-layer contract models that can sit between shared core and source adapters.

Shared core remains unchanged.

References:

- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SOURCE_FAMILY_PROMOTION_RULES.md`

## Family Models By Source Family

### 1. `transcript_first_longform`

| Model | What it is | Why family-level | Required fields | Must not promote directly to shared core |
| --- | --- | --- | --- | --- |
| `TranscriptDocumentRef` | family-level reference to one transcript-backed content record | transcript availability and segmentation are common across podcast/interview transcript sources | `family_name`, `source_family_item_id`, `transcript_status`, `language`, `primary_speaker_set` | raw transcript asset ids, ASR provider metadata, source fetch urls |
| `TranscriptSegment` | one ordered transcript segment | segment ordering is common inside transcript-first sources but not across all content sources | `segment_id`, `ordinal`, `text`, `speaker_ref`, `timestamp_range`, `clip_anchor_ref?` | waveform data, subtitle cue ids, player vendor fragments |
| `SpeakerTurn` | normalized speaker run inside a transcript | speaker-turn semantics are useful across transcript-native sources | `speaker_ref`, `turn_id`, `segment_range`, `display_name`, `confidence?` | diarization vendor confidence models, speaker embedding ids |
| `TimestampRange` | family-level time range reference | timestamp range is common in transcript-backed longform but not in print or structured records | `start_ms`, `end_ms`, `duration_ms` | player-specific deep links, playback state |
| `TranscriptAvailabilitySnapshot` | transcript completeness and availability view | transcript completeness belongs above adapters but below shared core | `transcript_status`, `completeness_state`, `segment_count`, `speaker_count` | ASR retry diagnostics, ingest queue state |

### 2. `official_structured_sources`

| Model | What it is | Why family-level | Required fields | Must not promote directly to shared core |
| --- | --- | --- | --- | --- |
| `StructuredRecordRef` | family-level ref for official records, filings, or register entries | official record identity is broader than one source but narrower than shared content | `family_name`, `record_id`, `record_key`, `record_kind`, `record_status` | SEC accession numbers, arXiv category internals, register-specific urls |
| `RecordPartyRef` | issuer, filer, applicant, or issuing body ref | official records often share party semantics | `party_id`, `party_role`, `display_name` | source-native legal ids, exchange-specific identifiers |
| `RecordRevisionRef` | one version or amendment of a structured record | revision/amendment semantics are stable within this family | `revision_id`, `revision_kind`, `effective_date`, `amended_date?`, `supersedes_revision_id?` | source-native document packaging rules |
| `RecordDeltaSummary` | normalized summary of what changed between revisions | delta semantics are useful across structured official records | `delta_id`, `delta_kind`, `summary`, `changed_sections` | source-native diff markup, filing parser traces |
| `StructuredEffectiveWindow` | effective and withdrawal timing for official records | timing semantics are common here but not universal across all sources | `effective_date`, `withdrawn_date?`, `published_date?` | jurisdiction-specific enforcement logic |

### 3. `knowledge_community_qa`

| Model | What it is | Why family-level | Required fields | Must not promote directly to shared core |
| --- | --- | --- | --- | --- |
| `QaThreadRef` | family-level thread/question ref | thread/question semantics are common across Q&A communities | `family_name`, `thread_id`, `thread_key`, `title`, `thread_status` | source-native permalink ids, site-specific tags DSL |
| `QaAnswerSummary` | one answer projection under a Q&A thread | answer-level ranking and acceptance are family semantics | `answer_id`, `author_ref`, `score`, `acceptance_state`, `moderation_state` | exact vote ledger, site-specific privilege state |
| `AcceptedAnswerRef` | explicit accepted answer pointer | accepted-answer semantics are common in Q&A but not in social streams | `thread_id`, `answer_id`, `accepted_at?`, `accepted_by_ref?` | moderator override traces, reputation effects |
| `QaRankingSnapshot` | family-level answer/thread ranking view | answer ordering is shared within Q&A families | `sort_mode`, `top_answer_id?`, `score_distribution` | source-specific ranking formulas |
| `QaModerationSnapshot` | visibility and moderation status view | moderation is shared at the family level, not at shared core | `moderation_state`, `locked`, `deleted`, `edited` | site-specific flag reasons and appeal workflows |

### 4. `open_social_expert_stream`

| Model | What it is | Why family-level | Required fields | Must not promote directly to shared core |
| --- | --- | --- | --- | --- |
| `SocialPostRef` | family-level ref for one post in a discussion stream | post identity is common across open social sources | `family_name`, `post_id`, `author_ref`, `created_at`, `freshness_state` | source-native post uri, federation internals |
| `ReplyTreeSummary` | normalized reply-tree view | thread/reply-tree semantics are common in open discussion streams | `root_post_id`, `reply_count`, `depth_hint`, `last_reply_at` | source-native conversation graph internals |
| `ReshareEdge` | repost, quote, or share relationship | reshare semantics are family-level and not shared-core safe | `origin_post_id`, `reshare_post_id`, `reshare_type`, `created_at` | platform-specific boosting algorithms |
| `WatchlistMembershipSnapshot` | list/watchlist membership and monitoring metadata | watchlist/list semantics are useful within this family | `list_id`, `membership_role`, `added_at`, `watch_reason?` | platform-specific list permissions |
| `SocialFreshnessSnapshot` | freshness and stream recency view | stream freshness belongs above adapters but below shared core | `freshness_state`, `last_activity_at`, `engagement_hint?` | source-native engagement formulas, algorithm labels |

### 5. `visual_inspiration_curated_asset`

| Model | What it is | Why family-level | Required fields | Must not promote directly to shared core |
| --- | --- | --- | --- | --- |
| `CuratedAssetRef` | family-level ref for a visual or curated asset | asset identity and attribution are common in this family | `family_name`, `asset_id`, `asset_key`, `asset_kind`, `source_link` | source-native CDN urls, image transform params |
| `CollectionMembershipRef` | board, channel, or collection membership | collection semantics are common inside curated asset sources | `collection_id`, `collection_key`, `arrangement_role`, `ordinal?` | site-specific collection permissions |
| `AttributionSnapshot` | author/source attribution projection | attribution belongs in family because it is stronger than shared tags but narrower than universal content fields | `creator_name`, `creator_ref?`, `source_link`, `attribution_required` | platform-native profile metadata |
| `LicenseSnapshot` | normalized licensing view | license class is common within curated assets and not always needed in shared core | `license_class`, `license_label`, `reuse_allowed`, `commercial_use_allowed?` | jurisdiction-specific legal text |
| `AssetArrangementSlot` | family-level pinning/arrangement placement | arrangement semantics belong in family, not shared discovery core | `slot_id`, `arrangement_role`, `ordinal`, `pinned` | board-specific layout geometry |

## Family To Shared Projection Rule

Family models project into shared core only through explicit mapping:

- transcript-backed longform may project transcript-derived summaries into `ContentDetailEnvelope`
- structured records may project into `ContentRef` and `ContentListItem`
- Q&A threads may project top-level thread and accepted answer summaries into shared detail/list shapes
- social streams may project selected posts into shared list/detail shapes
- curated assets may project selected asset cards into shared list/detail shapes

The family models themselves do not alter Step 02 canonical model boundaries.
