import { projectToSharedEnvelope } from "../../../../packages/attention-core-runtime/src/project-to-shared-envelope.js";

export function projectDirectMagazineSummary(raw_input = {}) {
  return projectToSharedEnvelope({
    adapter_id: "direct-magazine-summary",
    raw_input
  });
}
