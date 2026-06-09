import { directMagazineSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js";
import { resolveAdapterRoute } from "../../../../packages/attention-core-runtime/src/route-resolver.js";
import { directMagazineSummaryEntry } from "./direct-magazine-summary-entry.js";

export function mapDirectMagazineSummarySkeleton(rawInput = {}) {
  const route_resolution = resolveAdapterRoute({
    adapter_id: directMagazineSummaryEntry.adapter_id,
    route_type: directMagazineSummaryEntry.route_type,
    family_kind: null,
    source_kind: directMagazineSummaryPilot.source_kind,
    registry_entry: directMagazineSummaryEntry.registry_entry
  });

  return Object.freeze({
    domain_name: "magazine-domain",
    adapter_id: directMagazineSummaryEntry.adapter_id,
    route_resolution,
    input_preview: {
      input_shape_name: directMagazineSummaryPilot.input_shape.shape_name,
      received_fields: Object.keys(rawInput)
    },
    shared_projection_target: directMagazineSummaryPilot.shared_outputs,
    retained_extras: directMagazineSummaryPilot.retained_extras
  });
}
