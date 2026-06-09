import { buildRetainedExtras } from "../../../../packages/attention-adapter-runtime/src/build-retained-extras.js";

const youtubeDomainExtras = Object.freeze([
  "timestamp_anchors",
  "watch_or_skip",
  "input_quality_tier",
  "duration_seconds",
  "playback_policy"
]);

export function buildYoutubeRetainedExtras({ mapping_execution } = {}) {
  return buildRetainedExtras({
    adapter_only_extras: [],
    domain_only_extras:
      mapping_execution?.retained_extras?.length > 0 ? mapping_execution.retained_extras : youtubeDomainExtras
  });
}
