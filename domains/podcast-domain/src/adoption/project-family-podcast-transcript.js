import { projectToSharedEnvelope } from "../../../../packages/attention-core-runtime/src/project-to-shared-envelope.js";

export function projectFamilyPodcastTranscript(raw_input = {}, family_normalized_shape = {}) {
  return projectToSharedEnvelope({
    adapter_id: "family-podcast-transcript",
    raw_input,
    family_normalized_shape
  });
}
