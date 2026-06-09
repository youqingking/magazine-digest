export const transcriptFirstLongformNormalizerName = "transcript_first_longform_normalizer";
export const transcriptFirstLongformNormalizedShapeName = "transcript_first_longform_normalized_shape";

export const transcriptFirstLongformNormalizerContract = Object.freeze({
  family_kind: "transcript_first_longform",
  expected_input_shape: "podcast_transcript_raw_input",
  expected_input_fields: [
    "podcast_episode_id",
    "podcast_show_key",
    "language",
    "transcript_segments",
    "provider_confidence_trace",
    "player_deep_link_fragment"
  ],
  expected_normalized_fields: [
    "family_name",
    "transcript_document_ref",
    "transcript_segments",
    "speaker_turns",
    "transcript_availability_snapshot"
  ],
  retained_adapter_only_extras: ["cue_id", "provider_confidence_trace", "player_deep_link_fragment", "subtitle_track_id"]
});

export function normalizeTranscriptFirstLongform(rawSourceShape = {}) {
  return Object.freeze({
    family_name: "transcript_first_longform",
    normalized_shape_name: transcriptFirstLongformNormalizedShapeName,
    transcript_document_ref: {
      source_family_item_id: rawSourceShape.podcast_episode_id || "unknown_episode",
      transcript_status: "available",
      language: rawSourceShape.language || "und",
      primary_speaker_set: Array.isArray(rawSourceShape.transcript_segments)
        ? [...new Set(rawSourceShape.transcript_segments.map((segment) => segment.speaker_label).filter(Boolean))]
        : []
    },
    transcript_segments: Array.isArray(rawSourceShape.transcript_segments)
      ? rawSourceShape.transcript_segments.map((segment, index) => ({
          segment_id: segment.cue_id || `segment_${index + 1}`,
          ordinal: index + 1,
          text: segment.text || "",
          speaker_ref: segment.speaker_label ? `speaker_${String(segment.speaker_label).toLowerCase()}` : "speaker_unknown",
          timestamp_range: {
            start_ms: segment.start_ms || 0,
            end_ms: segment.end_ms || 0,
            duration_ms: Math.max((segment.end_ms || 0) - (segment.start_ms || 0), 0)
          }
        }))
      : [],
    speaker_turns: Array.isArray(rawSourceShape.transcript_segments)
      ? rawSourceShape.transcript_segments.map((segment, index) => ({
          speaker_ref: segment.speaker_label ? `speaker_${String(segment.speaker_label).toLowerCase()}` : "speaker_unknown",
          turn_id: `turn_${index + 1}`,
          segment_range: [index + 1, index + 1],
          display_name: segment.speaker_label || "Unknown"
        }))
      : [],
    transcript_availability_snapshot: {
      transcript_status: "available",
      completeness_state: "unknown",
      segment_count: Array.isArray(rawSourceShape.transcript_segments) ? rawSourceShape.transcript_segments.length : 0,
      speaker_count: Array.isArray(rawSourceShape.transcript_segments)
        ? [...new Set(rawSourceShape.transcript_segments.map((segment) => segment.speaker_label).filter(Boolean))].length
        : 0
    },
    retained_adapter_only_extras: {
      cue_id: Array.isArray(rawSourceShape.transcript_segments)
        ? rawSourceShape.transcript_segments.map((segment) => segment.cue_id).filter(Boolean)
        : [],
      provider_confidence_trace: rawSourceShape.provider_confidence_trace || null,
      player_deep_link_fragment: rawSourceShape.player_deep_link_fragment || null,
      subtitle_track_id: rawSourceShape.subtitle_track_id || null
    }
  });
}
