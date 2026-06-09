import { buildSharedProjection } from "../../../../packages/attention-adapter-runtime/src/build-shared-projection.js";

export function projectYoutubeSharedEnvelope({ raw_input } = {}) {
  return buildSharedProjection({
    adapter_id: "direct-youtube-summary",
    raw_input,
    projection_name: "shared_content_projection",
    models: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"]
  }).shared_projection;
}
