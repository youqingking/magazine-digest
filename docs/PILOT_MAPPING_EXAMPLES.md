# Pilot Mapping Examples

## Purpose

These examples freeze Step 04 pilot mappings without performing real source integration or domain migration.

References:

- `docs/ADAPTER_LAYER.md`
- `docs/ADAPTER_DIAGNOSTICS.md`
- `docs/SHARED_MODEL_EXAMPLES.md`
- `docs/SOURCE_FAMILY_EXAMPLES.md`

## 1. `direct-magazine-summary`

### Input Shape

```json
{
  "publication_id": "pub_readers_digest",
  "publication_key": "readers_digest",
  "article_id": "art_rd_2026_03_001",
  "article_key": "rd_2026_03_001",
  "language": "zh-CN",
  "title": "Spring Cleanup Checklist",
  "summary": "Quick summary for the issue feature",
  "issue_id": "issue_rd_2026_03",
  "issue_label": "2026-03",
  "start_page": 24,
  "print_taxonomy_path": ["home", "cleaning"],
  "cover_slot": "feature"
}
```

### Mapping Path

`magazine domain object -> shared core`

### Shared Outputs

- `ContentRef`
- `ContentVariantKey`
- `ContentListItem`
- `ContentDetailEnvelope`

### Retained Extras

- `issue_id`
- `issue_label`
- `start_page`
- `print_taxonomy_path`
- `cover_slot`

### Diagnostics Example

```json
{
  "adapter_id": "direct-magazine-summary",
  "route_type": "direct",
  "source_kind": "magazine_summary_object",
  "family_kind": null,
  "mapped_shared_fields": [
    "ContentRef",
    "ContentVariantKey",
    "ContentListItem",
    "ContentDetailEnvelope"
  ],
  "mapped_family_fields": [],
  "retained_domain_extras": [
    "issue_id",
    "issue_label",
    "start_page",
    "print_taxonomy_path",
    "cover_slot"
  ],
  "unmapped_source_fields": [],
  "unsupported_reason": null,
  "warnings": [
    "Do not promote issue packaging into shared core.",
    "Do not force magazine into a family path."
  ],
  "notes": [
    "Magazine remains direct-path-first in Step 04."
  ]
}
```

## 2. `direct-youtube-summary`

### Input Shape

```json
{
  "channel_id": "yt_ch_ai_briefing",
  "channel_key": "ai_briefing",
  "video_id": "yt_vid_2026_03_24_001",
  "video_key": "ai_briefing_2026_03_24",
  "language": "zh-CN",
  "title": "AI Briefing March 24",
  "summary": "Short summary projection",
  "timestamp_anchors": ["00:30", "05:10"],
  "watch_or_skip": "watch",
  "input_quality_tier": "editor_verified",
  "duration_seconds": 840,
  "playback_policy": "youtube_embedded_only"
}
```

### Mapping Path

`youtube domain object -> shared core`

### Shared Outputs

- `ContentRef`
- `ContentVariantKey`
- `ContentListItem`
- `ContentDetailEnvelope`

### Retained Extras

- `timestamp_anchors`
- `watch_or_skip`
- `input_quality_tier`
- `duration_seconds`
- `playback_policy`

### Diagnostics Example

```json
{
  "adapter_id": "direct-youtube-summary",
  "route_type": "direct",
  "source_kind": "youtube_summary_object",
  "family_kind": null,
  "mapped_shared_fields": [
    "ContentRef",
    "ContentVariantKey",
    "ContentListItem",
    "ContentDetailEnvelope"
  ],
  "mapped_family_fields": [],
  "retained_domain_extras": [
    "timestamp_anchors",
    "watch_or_skip",
    "input_quality_tier",
    "duration_seconds",
    "playback_policy"
  ],
  "unmapped_source_fields": [],
  "unsupported_reason": null,
  "warnings": [
    "Do not retro-fit playback semantics into transcript family.",
    "Do not promote watch_or_skip into shared core."
  ],
  "notes": [
    "YouTube remains direct-path-first in Step 04."
  ]
}
```

## 3. `family-podcast-transcript`

### Source Raw Shape

```json
{
  "podcast_episode_id": "pod_ep_204",
  "podcast_show_key": "deep_research_radio",
  "language": "en",
  "transcript_segments": [
    {
      "cue_id": "c001",
      "speaker_label": "Host",
      "start_ms": 0,
      "end_ms": 14000,
      "text": "Welcome back to the show..."
    }
  ],
  "provider_confidence_trace": "trace_stub_001",
  "player_deep_link_fragment": "t=0"
}
```

### Family-Normalized Shape

```json
{
  "family_name": "transcript_first_longform",
  "transcript_document_ref": {
    "source_family_item_id": "pod_ep_204",
    "transcript_status": "available",
    "language": "en",
    "primary_speaker_set": ["Host"]
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
  },
  "speaker_turn": {
    "speaker_ref": "speaker_host",
    "turn_id": "turn_001",
    "segment_range": [1, 1],
    "display_name": "Host"
  }
}
```

### Shared Projection

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

### Retained Extras

- `cue_id`
- `provider_confidence_trace`
- `player_deep_link_fragment`
- subtitle track ids

### Diagnostics Example

```json
{
  "adapter_id": "family-podcast-transcript",
  "route_type": "family",
  "source_kind": "podcast_transcript_source",
  "family_kind": "transcript_first_longform",
  "mapped_shared_fields": [
    "ContentRef",
    "ContentDetailEnvelope"
  ],
  "mapped_family_fields": [
    "TranscriptDocumentRef",
    "TranscriptSegment",
    "SpeakerTurn",
    "TimestampRange"
  ],
  "retained_domain_extras": [
    "cue_id",
    "provider_confidence_trace",
    "player_deep_link_fragment",
    "subtitle_track_id"
  ],
  "unmapped_source_fields": [],
  "unsupported_reason": null,
  "warnings": [
    "Transcript-native metadata is not shared-core truth.",
    "Do not let playback deep links leak into family contracts."
  ],
  "notes": [
    "Transcript semantics normalize through family before shared projection."
  ]
}
```

## 4. `family-sec-filing`

### Source Raw Shape

```json
{
  "accession_no": "0000123456-26-000001",
  "form_type": "8-K",
  "issuer_name": "Example Corp",
  "filed_at": "2026-03-10T21:00:00Z",
  "amendment_flag": false,
  "parser_trace_id": "trace_sec_001"
}
```

### Family-Normalized Shape

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

### Shared Projection

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

### Retained Extras

- `accession_no`
- form-specific section details
- `parser_trace_id`
- raw document packaging references

### Diagnostics Example

```json
{
  "adapter_id": "family-sec-filing",
  "route_type": "family",
  "source_kind": "sec_filing_source",
  "family_kind": "official_structured_sources",
  "mapped_shared_fields": [
    "ContentRef",
    "ContentListItem",
    "ContentDetailEnvelope"
  ],
  "mapped_family_fields": [
    "StructuredRecordRef",
    "RecordPartyRef",
    "RecordRevisionRef",
    "StructuredEffectiveWindow"
  ],
  "retained_domain_extras": [
    "accession_no",
    "form_type",
    "parser_trace_id",
    "raw_document_package_ref"
  ],
  "unmapped_source_fields": [],
  "unsupported_reason": null,
  "warnings": [
    "Do not promote SEC accession formatting into family vocabulary.",
    "Do not promote parser traces beyond adapter."
  ],
  "notes": [
    "Official structured semantics normalize through family before shared projection."
  ]
}
```

## Compatibility Notes

### Why Magazine Is Still Direct Path First

- the magazine adapter already projects well into shared summary/detail shells
- issue and print-taxonomy semantics are still single-source semantics
- no frozen Step 03 family provides a natural middle layer for issue packaging

### Why YouTube Is Still Direct Path First

- the YouTube adapter already projects summary variants into shared list/detail shells
- playback identity and watch behavior remain source-specific
- transcript family can carry transcript-native sidecars later without becoming the canonical route for all YouTube semantics

### YouTube Semantics That May Later Borrow Transcript Family

- transcript segments
- speaker turns
- timestamp ranges
- transcript completeness snapshots
- clip-anchor sidecars

### Magazine And YouTube Semantics That Should Not Retro-Fit Into Family

- `issue_id`
- `issue_label`
- print taxonomy path
- `watch_or_skip`
- `input_quality_tier`
- playback policy
- canonical channel or publication identity

### Family Layer Does Not Force Domain Re-Modeling

- family layer remains optional
- current domains may stay shared-plus-adapter
- Step 04 freezes route contracts and diagnostics only
