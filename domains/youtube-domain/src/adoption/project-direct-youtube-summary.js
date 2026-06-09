import { projectToSharedEnvelope } from "../../../../packages/attention-core-runtime/src/project-to-shared-envelope.js";

export function projectDirectYoutubeSummary(raw_input = {}) {
  return projectToSharedEnvelope({
    adapter_id: "direct-youtube-summary",
    raw_input
  });
}
