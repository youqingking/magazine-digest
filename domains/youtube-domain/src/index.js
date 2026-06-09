export const packageName = "youtube-domain";

export { directYoutubeSummaryEntry } from "./pilots/direct-youtube-summary-entry.js";
export { mapDirectYoutubeSummarySkeleton } from "./pilots/direct-youtube-summary-mapper.js";
export { getDirectYoutubeSummaryDiagnostics } from "./pilots/direct-youtube-summary-diagnostics.js";

export const domainBoundary = Object.freeze({
  route_type: "direct",
  family_kind: null,
  owns: ["domain README", "pilot entry", "pilot mapper stub", "pilot diagnostics stub"],
  doesNotInclude: ["transcript-family retro-fit", "business code migration", "page composition", "ingestion"]
});
