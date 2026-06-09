import { directYoutubeSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js";

export function getDirectYoutubeSummaryDiagnostics() {
  return Object.freeze({
    domain_name: "youtube-domain",
    adapter_id: "direct-youtube-summary",
    route_type: "direct",
    diagnostics: directYoutubeSummaryPilot.diagnostics_example
  });
}
