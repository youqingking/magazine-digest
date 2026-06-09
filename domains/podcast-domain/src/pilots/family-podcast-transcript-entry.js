import { familyPodcastTranscriptPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js";
import { buildPilotRegistryEntry } from "../../../../packages/attention-adapter-runtime/src/registry-entry-builder.js";

export const familyPodcastTranscriptEntry = Object.freeze({
  domain_name: "podcast-domain",
  adapter_id: "family-podcast-transcript",
  route_type: "family",
  family_kind: "transcript_first_longform",
  registry_entry: buildPilotRegistryEntry(familyPodcastTranscriptPilot)
});
