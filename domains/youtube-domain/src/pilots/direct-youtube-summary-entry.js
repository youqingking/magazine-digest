import { directYoutubeSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js";
import { buildPilotRegistryEntry } from "../../../../packages/attention-adapter-runtime/src/registry-entry-builder.js";

export const directYoutubeSummaryEntry = Object.freeze({
  domain_name: "youtube-domain",
  adapter_id: "direct-youtube-summary",
  route_type: "direct",
  registry_entry: buildPilotRegistryEntry(directYoutubeSummaryPilot)
});
