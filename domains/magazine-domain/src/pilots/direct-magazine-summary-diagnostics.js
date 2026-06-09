import { directMagazineSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js";

export function getDirectMagazineSummaryDiagnostics() {
  return Object.freeze({
    domain_name: "magazine-domain",
    adapter_id: "direct-magazine-summary",
    route_type: "direct",
    diagnostics: directMagazineSummaryPilot.diagnostics_example
  });
}
