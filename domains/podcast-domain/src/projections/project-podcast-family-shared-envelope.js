import { buildSharedProjection } from "../../../../packages/attention-adapter-runtime/src/build-shared-projection.js";

export function projectPodcastFamilySharedEnvelope({ raw_input, family_execution } = {}) {
  return buildSharedProjection({
    adapter_id: "family-podcast-transcript",
    raw_input,
    family_normalized_shape: family_execution?.normalized_shape ?? null,
    projection_name: "family_then_shared_content_projection",
    models: ["ContentRef", "ContentDetailEnvelope"]
  }).shared_projection;
}
