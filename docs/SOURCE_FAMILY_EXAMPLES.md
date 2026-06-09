# Source Family Examples

## Purpose

These examples freeze how source adapters may enter a family layer first, then project into shared core.

Shared core remains unchanged.

References:

- `docs/SOURCE_FAMILY_MODELS.md`
- `docs/SHARED_MODEL_EXAMPLES.md`

## Example 1: Podcast Transcript -> `transcript_first_longform`

### Adapter-side source object

```json
{
  "podcast_episode_id": "pod_ep_204",
  "podcast_show_key": "deep_research_radio",
  "transcript_segments": [
    {
      "cue_id": "c001",
      "speaker_label": "Host",
      "start_ms": 0,
      "end_ms": 14000,
      "text": "Welcome back to the show..."
    }
  ]
}
```

### Family projection

```json
{
  "family_name": "transcript_first_longform",
  "transcript_document_ref": {
    "source_family_item_id": "pod_ep_204",
    "transcript_status": "available",
    "language": "en"
  },
  "transcript_segment": {
    "segment_id": "seg_001",
    "ordinal": 1,
    "text": "Welcome back to the show...",
    "speaker_ref": "speaker_host",
    "timestamp_range": {
      "start_ms": 0,
      "end_ms": 14000,
      "duration_ms": 14000
    }
  }
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_audio_digest",
    "source_id": "show_deep_research_radio",
    "source_key": "deep_research_radio",
    "content_item_id": "pod_ep_204",
    "content_key": "deep_research_radio_204",
    "language": "en"
  },
  "content_detail_envelope": {
    "title": "Episode 204 Summary",
    "body": "Transcript-derived longform summary",
    "body_format": "markdown",
    "runtime_mode": "local",
    "source": "podcast_adapter_via_transcript_family"
  }
}
```

### Stay outside shared core

- raw subtitle cues
- diarization provider traces
- player deep-link fragments

## Example 2: SEC Filing -> `official_structured_sources`

### Adapter-side source object

```json
{
  "accession_no": "0000123456-26-000001",
  "form_type": "8-K",
  "issuer_name": "Example Corp",
  "filed_at": "2026-03-10T21:00:00Z",
  "amendment_flag": false
}
```

### Family projection

```json
{
  "family_name": "official_structured_sources",
  "structured_record_ref": {
    "record_id": "sec_0000123456_26_000001",
    "record_key": "example_corp_8k_20260310",
    "record_kind": "filing",
    "record_status": "filed"
  },
  "record_party_ref": {
    "party_id": "issuer_example_corp",
    "party_role": "issuer",
    "display_name": "Example Corp"
  },
  "record_revision_ref": {
    "revision_id": "rev_initial",
    "revision_kind": "initial",
    "effective_date": "2026-03-10"
  }
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_official_records",
    "source_id": "sec_edgar",
    "source_key": "sec_edgar",
    "content_item_id": "sec_0000123456_26_000001",
    "content_key": "example_corp_8k_20260310",
    "language": "en"
  },
  "content_list_item": {
    "title": "Example Corp 8-K",
    "summary": "Initial filing summary",
    "publish_status": "published",
    "update_type": "new_publish",
    "update_priority": 80
  }
}
```

### Stay outside shared core

- accession number formatting rules
- SEC form taxonomy details
- filing parser traces

## Example 3: Stack Exchange Thread -> `knowledge_community_qa`

### Adapter-side source object

```json
{
  "question_id": "se_8842",
  "title": "How do I compare two schemas safely?",
  "answers": [
    {
      "answer_id": "ans_1",
      "score": 42,
      "is_accepted": true
    }
  ]
}
```

### Family projection

```json
{
  "family_name": "knowledge_community_qa",
  "qa_thread_ref": {
    "thread_id": "se_8842",
    "thread_key": "compare_two_schemas_safely",
    "title": "How do I compare two schemas safely?",
    "thread_status": "answered"
  },
  "qa_answer_summary": {
    "answer_id": "ans_1",
    "score": 42,
    "acceptance_state": "accepted",
    "moderation_state": "visible"
  },
  "accepted_answer_ref": {
    "thread_id": "se_8842",
    "answer_id": "ans_1"
  }
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_knowledge",
    "source_id": "stack_exchange",
    "source_key": "stack_exchange",
    "content_item_id": "se_8842",
    "content_key": "compare_two_schemas_safely",
    "language": "en"
  },
  "content_detail_envelope": {
    "title": "How do I compare two schemas safely?",
    "body": "Question plus accepted-answer synthesis",
    "body_format": "markdown",
    "source": "stack_exchange_adapter_via_qa_family"
  }
}
```

### Stay outside shared core

- vote ledger internals
- reputation effects
- site privilege state

## Example 4: Bluesky Thread -> `open_social_expert_stream`

### Adapter-side source object

```json
{
  "bluesky_post_uri": "at://did:plc:abc/post/123",
  "author_handle": "expert.example.com",
  "reply_count": 12,
  "quote_count": 3
}
```

### Family projection

```json
{
  "family_name": "open_social_expert_stream",
  "social_post_ref": {
    "post_id": "bsky_123",
    "author_ref": "expert_example",
    "created_at": "2026-03-24T08:00:00Z",
    "freshness_state": "fresh"
  },
  "reply_tree_summary": {
    "root_post_id": "bsky_123",
    "reply_count": 12,
    "depth_hint": 3,
    "last_reply_at": "2026-03-24T10:00:00Z"
  },
  "reshare_edge": {
    "origin_post_id": "bsky_123",
    "reshare_post_id": "bsky_quote_1",
    "reshare_type": "quote",
    "created_at": "2026-03-24T09:00:00Z"
  }
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_expert_stream",
    "source_id": "bluesky_watchlist",
    "source_key": "bluesky_watchlist",
    "content_item_id": "bsky_123",
    "content_key": "expert_example_123",
    "language": "en"
  },
  "content_list_item": {
    "title": "Expert thread summary",
    "summary": "Fresh discussion summary",
    "publish_status": "published",
    "update_type": "revision",
    "update_priority": 70
  }
}
```

### Stay outside shared core

- federation uri internals
- platform engagement formulas
- source-native list permissions

## Example 5: Are.na Board Asset -> `visual_inspiration_curated_asset`

### Adapter-side source object

```json
{
  "block_id": "arena_blk_302",
  "channel_slug": "urban-references",
  "image_credit": "Studio Example",
  "license_label": "CC BY 4.0"
}
```

### Family projection

```json
{
  "family_name": "visual_inspiration_curated_asset",
  "curated_asset_ref": {
    "asset_id": "arena_blk_302",
    "asset_key": "urban_references_302",
    "asset_kind": "image",
    "source_link": "https://are.na/block/302"
  },
  "collection_membership_ref": {
    "collection_id": "arena_urban_references",
    "collection_key": "urban-references",
    "arrangement_role": "featured",
    "ordinal": 12
  },
  "attribution_snapshot": {
    "creator_name": "Studio Example",
    "source_link": "https://are.na/block/302",
    "attribution_required": true
  },
  "license_snapshot": {
    "license_class": "attribution_required",
    "license_label": "CC BY 4.0",
    "reuse_allowed": true
  }
}
```

### Shared projection

```json
{
  "content_ref": {
    "product_key": "demo_visual_library",
    "source_id": "arena",
    "source_key": "arena",
    "content_item_id": "arena_blk_302",
    "content_key": "urban_references_302",
    "language": "und"
  },
  "content_list_item": {
    "title": "Urban reference card",
    "summary": "Curated visual asset with attribution",
    "publish_status": "published",
    "update_type": "highlight_refresh",
    "update_priority": 60
  }
}
```

### Stay outside shared core

- source-native CDN params
- board layout geometry
- full legal license text
