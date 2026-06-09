import { familyPodcastTranscriptPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js";
import { resolveAdapterRoute } from "../../../../packages/attention-core-runtime/src/route-resolver.js";
import { normalizeTranscriptFirstLongform } from "../../../../packages/attention-family-runtime/src/normalizers/transcript-first-longform.js";
import { familyPodcastTranscriptEntry } from "./family-podcast-transcript-entry.js";

export function mapFamilyPodcastTranscriptSkeleton(rawInput = {}) {
  const registry_entry = familyPodcastTranscriptEntry.registry_entry;
  const route_resolution = resolveAdapterRoute({
    adapter_id: familyPodcastTranscriptEntry.adapter_id,
    route_type: familyPodcastTranscriptEntry.route_type,
    family_kind: familyPodcastTranscriptEntry.family_kind,
    source_kind: familyPodcastTranscriptPilot.source_kind,
    registry_entry
  });

  const family_normalized_shape = normalizeTranscriptFirstLongform(rawInput);

  return Object.freeze({
    domain_name: "podcast-domain",
    adapter_id: familyPodcastTranscriptEntry.adapter_id,
    family_kind: familyPodcastTranscriptEntry.family_kind,
    route_resolution,
    family_normalized_shape,
    shared_projection_target: familyPodcastTranscriptPilot.shared_outputs,
    retained_extras: familyPodcastTranscriptPilot.retained_extras
  });
}
