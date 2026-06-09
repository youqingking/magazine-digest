import { buildPilotDiagnostics } from "../../../../packages/attention-adapter-runtime/src/build-pilot-diagnostics.js";

const acceptedRuntimeFields = Object.freeze([
  "product_key",
  "body",
  "body_format",
  "tags",
  "audience_segment",
  "reading_mode",
  "revision",
  "publish_status",
  "available_from",
  "available_until",
  "update_type",
  "update_priority",
  "fetched_at"
]);

export function buildMagazineDiagnostics({
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
    additional_notes: ["Step 06 direct magazine adoption executed through shared runtime."]
  });
}
