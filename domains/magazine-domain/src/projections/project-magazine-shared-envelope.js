import { buildSharedProjection } from "../../../../packages/attention-adapter-runtime/src/build-shared-projection.js";

export function projectMagazineSharedEnvelope({ raw_input } = {}) {
  return buildSharedProjection({
    adapter_id: "direct-magazine-summary",
    raw_input,
    projection_name: "shared_content_projection",
    models: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"]
  }).shared_projection;
}
