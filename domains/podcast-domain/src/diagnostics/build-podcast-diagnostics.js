import { buildPilotDiagnostics } from "../../../../packages/attention-adapter-runtime/src/build-pilot-diagnostics.js";

const acceptedRuntimeFields = Object.freeze(["product_key", "episode_key", "summary_body", "fetched_at"]);

export function buildPodcastDiagnostics({
  raw_input,
  mapping_execution,
  route_resolution,
  retained_extras
} = {}) {
  return buildPilotDiagnostics({
    mapping_execution,
    raw_input,
    route_resolution,
    retained_extra_groups: retained_extras,
    accepted_runtime_fields: acceptedRuntimeFields,
    additional_notes: ["Step 06 podcast adoption executed through transcript family and shared runtime."]
  });
}
