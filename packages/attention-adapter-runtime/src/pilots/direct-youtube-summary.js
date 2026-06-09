import { createMappingDiagnostics } from "../contracts/mapping-diagnostics.js";

export const directYoutubeSummaryPilot = Object.freeze({
  adapter_id: "direct-youtube-summary",
  route_type: "direct",
  source_kind: "youtube_summary_object",
  family_kind: null,
  input_shape: Object.freeze({
    shape_name: "youtube_summary_input",
    fields: [
      "channel_id",
      "channel_key",
      "video_id",
      "video_key",
      "language",
      "title",
      "summary",
      "timestamp_anchors",
      "watch_or_skip",
      "input_quality_tier",
      "duration_seconds",
      "playback_policy"
    ]
  }),
  mapping_path: ["source_adapter", "shared_core"],
  shared_outputs: Object.freeze({
    models: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"],
    output_shape_name: "shared_content_projection"
  }),
  retained_extras: ["timestamp_anchors", "watch_or_skip", "input_quality_tier", "duration_seconds", "playback_policy"],
  diagnostics_example: createMappingDiagnostics({
    adapter_id: "direct-youtube-summary",
    route_type: "direct",
    source_kind: "youtube_summary_object",
    family_kind: null,
    mapped_shared_fields: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"],
    mapped_family_fields: [],
    retained_domain_extras: [
      "timestamp_anchors",
      "watch_or_skip",
      "input_quality_tier",
      "duration_seconds",
      "playback_policy"
    ],
    unmapped_source_fields: [],
    unsupported_reason: null,
    warnings: ["Do not retro-fit playback semantics into transcript family."],
    notes: ["YouTube remains direct-path-first in Step 04."]
  })
});
