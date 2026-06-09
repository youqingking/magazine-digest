export const packageName = "podcast-domain";

export { familyPodcastTranscriptEntry } from "./pilots/family-podcast-transcript-entry.js";
export { mapFamilyPodcastTranscriptSkeleton } from "./pilots/family-podcast-transcript-mapper.js";
export { getFamilyPodcastTranscriptDiagnostics } from "./pilots/family-podcast-transcript-diagnostics.js";

export const domainBoundary = Object.freeze({
  route_type: "family",
  family_kind: "transcript_first_longform",
  owns: ["domain README", "pilot entry", "pilot mapper stub", "pilot diagnostics stub"],
  doesNotInclude: [
    "podcast product intelligence",
    "business code migration",
    "page composition",
    "ingestion"
  ]
});
