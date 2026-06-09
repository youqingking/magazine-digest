import { familyPodcastTranscriptPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js";

export function getFamilyPodcastTranscriptDiagnostics() {
  return Object.freeze({
    domain_name: "podcast-domain",
    adapter_id: "family-podcast-transcript",
    route_type: "family",
    family_kind: "transcript_first_longform",
    diagnostics: familyPodcastTranscriptPilot.diagnostics_example
  });
}
