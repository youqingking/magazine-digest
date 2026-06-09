import { createMappingDiagnostics } from "../contracts/mapping-diagnostics.js";

export const familyPodcastTranscriptPilot = Object.freeze({
  adapter_id: "family-podcast-transcript",
  route_type: "family",
  source_kind: "podcast_transcript_source",
  family_kind: "transcript_first_longform",
  input_shape: Object.freeze({
    shape_name: "podcast_transcript_raw_input",
    fields: [
      "podcast_episode_id",
      "podcast_show_key",
      "language",
      "transcript_segments",
      "provider_confidence_trace",
      "player_deep_link_fragment"
    ]
  }),
  family_normalized_shape: Object.freeze({
    family_name: "transcript_first_longform",
    models: ["TranscriptDocumentRef", "TranscriptSegment", "SpeakerTurn", "TimestampRange"]
  }),
  mapping_path: ["source_adapter", "source_family", "shared_core"],
  shared_outputs: Object.freeze({
    models: ["ContentRef", "ContentDetailEnvelope"],
    output_shape_name: "family_then_shared_content_projection"
  }),
  retained_extras: ["cue_id", "provider_confidence_trace", "player_deep_link_fragment", "subtitle_track_id"],
  diagnostics_example: createMappingDiagnostics({
    adapter_id: "family-podcast-transcript",
    route_type: "family",
    source_kind: "podcast_transcript_source",
    family_kind: "transcript_first_longform",
    mapped_shared_fields: ["ContentRef", "ContentDetailEnvelope"],
    mapped_family_fields: ["TranscriptDocumentRef", "TranscriptSegment", "SpeakerTurn", "TimestampRange"],
    retained_domain_extras: ["cue_id", "provider_confidence_trace", "player_deep_link_fragment", "subtitle_track_id"],
    unmapped_source_fields: [],
    unsupported_reason: null,
    warnings: ["Transcript-native metadata is not shared-core truth."],
    notes: ["Transcript semantics normalize through family before shared projection."]
  })
});
