import { directMagazineSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js";
import { buildPilotRegistryEntry } from "../../../../packages/attention-adapter-runtime/src/registry-entry-builder.js";

export const directMagazineSummaryEntry = Object.freeze({
  domain_name: "magazine-domain",
  adapter_id: "direct-magazine-summary",
  route_type: "direct",
  registry_entry: buildPilotRegistryEntry(directMagazineSummaryPilot)
});
