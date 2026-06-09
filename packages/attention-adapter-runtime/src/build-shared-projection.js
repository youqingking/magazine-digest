import { projectToSharedEnvelope } from "../../attention-core-runtime/src/project-to-shared-envelope.js";

function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

export function buildSharedProjection({
  adapter_id,
  raw_input = {},
  family_normalized_shape = null,
  projection_name = "shared_content_projection",
  models = []
}) {
  return Object.freeze({
    adapter_id,
    projection_name,
    models: freezeArray(models),
    shared_projection: projectToSharedEnvelope({
      adapter_id,
      raw_input,
      family_normalized_shape
    })
  });
}
