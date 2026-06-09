import { directYoutubeSummaryPilot } from "../../../../packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js";
import { resolveAdapterRoute } from "../../../../packages/attention-core-runtime/src/route-resolver.js";
import { directYoutubeSummaryEntry } from "./direct-youtube-summary-entry.js";

export function mapDirectYoutubeSummarySkeleton(rawInput = {}) {
  const route_resolution = resolveAdapterRoute({
    adapter_id: directYoutubeSummaryEntry.adapter_id,
    route_type: directYoutubeSummaryEntry.route_type,
    family_kind: null,
    source_kind: directYoutubeSummaryPilot.source_kind,
    registry_entry: directYoutubeSummaryEntry.registry_entry
  });

  return Object.freeze({
    domain_name: "youtube-domain",
    adapter_id: directYoutubeSummaryEntry.adapter_id,
    route_resolution,
    input_preview: {
      input_shape_name: directYoutubeSummaryPilot.input_shape.shape_name,
      received_fields: Object.keys(rawInput)
    },
    shared_projection_target: directYoutubeSummaryPilot.shared_outputs,
    retained_extras: directYoutubeSummaryPilot.retained_extras
  });
}
