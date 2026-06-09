# Shared Model Examples

## Purpose

These examples show how domain objects map into shared canonical contracts without moving or rewriting current domain code.

Rules:

- examples only
- no migration implementation in Step 02
- shared fields and domain-only fields are called out explicitly

References:

- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SHARED_ENUMS_AND_KEYS.md`

## Example 1: Magazine Domain -> Shared

### Domain-side source objects

```json
{
  "publication": {
    "publication_id": "pub_readers_digest",
    "publication_key": "readers_digest",
    "display_name": "Reader's Digest"
  },
  "issue": {
    "issue_id": "issue_readers_digest_2025_12",
    "issue_label": "2025-12",
    "cover_slot": "hero"
  },
  "article": {
    "article_id": "art_rd_2025_12_001",
    "article_key": "real_rd_2025_12_001",
    "title": "23 Winter Tips",
    "section_key": "cover_story",
    "start_page": 30
  },
  "article_variants": [
    {
      "article_variant_id": "var_rd_001_general_quick",
      "language": "zh-CN",
      "audience_segment": "general",
      "reading_mode": "quick_30s",
      "revision": 1
    },
    {
      "article_variant_id": "var_rd_001_general_deep",
      "language": "zh-CN",
      "audience_segment": "general",
      "reading_mode": "deep_3m",
      "revision": 1
    }
  ]
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_cn_content",
    "source_id": "pub_readers_digest",
    "source_key": "readers_digest",
    "content_item_id": "art_rd_2025_12_001",
    "content_key": "real_rd_2025_12_001",
    "language": "zh-CN"
  },
  "content_variant_key": {
    "product_key": "demo_cn_content",
    "content_item_id": "art_rd_2025_12_001",
    "language": "zh-CN",
    "audience_segment": "general",
    "reading_mode": "quick_30s",
    "revision": 1
  },
  "content_list_item": {
    "content_ref": "content_ref",
    "primary_variant_key": "content_variant_key",
    "title": "23 Winter Tips",
    "summary": "Short preview text",
    "tags": ["winter", "cover_story"],
    "publish_status": "published",
    "available_from": "2025-12-01T09:00:00+08:00",
    "available_until": null,
    "update_type": "new_publish",
    "update_priority": 100
  },
  "content_detail_envelope": {
    "content_ref": "content_ref",
    "resolved_variant_key": "content_variant_key",
    "title": "23 Winter Tips",
    "body": "markdown or normalized rich text body",
    "body_format": "markdown",
    "tags": ["winter", "cover_story"],
    "entitlement_snapshot": null,
    "quota_snapshot": null,
    "runtime_mode": "local",
    "source": "magazine_adapter",
    "fetched_at": "2026-03-24T00:00:00+08:00"
  }
}
```

### Shared vs domain-only split

- shared:
  - `publication_id/publication_key` become `source_id/source_key`
  - `article_id/article_key` become `content_item_id/content_key`
  - variant selection fields stay shared: `language`, `audience_segment`, `reading_mode`, `revision`
  - list/detail surfaces use shared `ContentListItem` and `ContentDetailEnvelope`
- stay domain-specific:
  - `issue_id`, `issue_label`
  - `start_page`
  - print section path, cover slot, spread placement
  - editorial publication taxonomy nuances

## Example 2: YouTube Domain -> Shared

### Domain-side source objects

```json
{
  "channel": {
    "channel_id": "yt_ch_ai_briefing",
    "channel_key": "ai_briefing",
    "display_name": "AI Briefing"
  },
  "video": {
    "video_id": "yt_vid_2026_03_24_001",
    "video_key": "ai_briefing_2026_03_24",
    "title": "AI Briefing March 24",
    "duration_seconds": 840
  },
  "video_summary_variants": [
    {
      "summary_variant_id": "yt_var_001_general_quick",
      "language": "zh-CN",
      "audience_segment": "general",
      "reading_mode": "quick_30s",
      "revision": 2
    },
    {
      "summary_variant_id": "yt_var_001_general_deep",
      "language": "zh-CN",
      "audience_segment": "general",
      "reading_mode": "deep_3m",
      "revision": 2
    }
  ]
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_cn_content",
    "source_id": "yt_ch_ai_briefing",
    "source_key": "ai_briefing",
    "content_item_id": "yt_vid_2026_03_24_001",
    "content_key": "ai_briefing_2026_03_24",
    "language": "zh-CN"
  },
  "content_variant_key": {
    "product_key": "demo_cn_content",
    "content_item_id": "yt_vid_2026_03_24_001",
    "language": "zh-CN",
    "audience_segment": "general",
    "reading_mode": "quick_30s",
    "revision": 2
  },
  "content_list_item": {
    "content_ref": "content_ref",
    "primary_variant_key": "content_variant_key",
    "title": "AI Briefing March 24",
    "summary": "Short summary preview",
    "tags": ["ai", "daily_briefing"],
    "publish_status": "published",
    "available_from": "2026-03-24T09:00:00+08:00",
    "available_until": null,
    "update_type": "revision",
    "update_priority": 80
  },
  "content_detail_envelope": {
    "content_ref": "content_ref",
    "resolved_variant_key": "content_variant_key",
    "title": "AI Briefing March 24",
    "body": "normalized summary body",
    "body_format": "markdown",
    "tags": ["ai", "daily_briefing"],
    "entitlement_snapshot": null,
    "quota_snapshot": null,
    "runtime_mode": "remote",
    "source": "youtube_adapter",
    "fetched_at": "2026-03-24T00:00:00+08:00"
  }
}
```

### Shared vs domain-only split

- shared:
  - `channel_id/channel_key` map into `source_id/source_key`
  - `video_id/video_key` map into `content_item_id/content_key`
  - summary variants map into generic `ContentVariantKey`
  - list/detail shells reuse shared canonical models
- stay domain-specific:
  - `timestamp anchors`
  - `watch-or-skip`
  - `input quality tier`
  - duration, chapters, poster rules, playback policy

## Cross-domain Mapping Rule

The shared layer owns the stable projection targets only:

- `ContentRef`
- `ContentVariantKey`
- `ContentListItem`
- `ContentDetailEnvelope`

Each domain keeps its own source identity, source-native metadata, and workflow semantics until a later wave promotes them under `docs/SHARED_CHANGE_POLICY.md`.
