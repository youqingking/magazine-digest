export const packageName = "magazine-domain";

export { directMagazineSummaryEntry } from "./pilots/direct-magazine-summary-entry.js";
export { mapDirectMagazineSummarySkeleton } from "./pilots/direct-magazine-summary-mapper.js";
export { getDirectMagazineSummaryDiagnostics } from "./pilots/direct-magazine-summary-diagnostics.js";

export const domainBoundary = Object.freeze({
  route_type: "direct",
  family_kind: null,
  owns: ["domain README", "pilot entry", "pilot mapper stub", "pilot diagnostics stub"],
  doesNotInclude: ["business code migration", "family layer dependency", "page composition", "ingestion"]
});
