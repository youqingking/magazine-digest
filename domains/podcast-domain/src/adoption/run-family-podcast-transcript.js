import { executePilotMapping } from "../../../../packages/attention-adapter-runtime/src/execute-pilot-mapping.js";
import { buildPilotDiagnostics } from "../../../../packages/attention-adapter-runtime/src/build-pilot-diagnostics.js";
import { runRouteResolution } from "../../../../packages/attention-core-runtime/src/run-route-resolution.js";
import { adoptPilotEntry } from "../../../../packages/attention-core-runtime/src/adopt-pilot-entry.js";
import { runFamilyNormalizer } from "../../../../packages/attention-family-runtime/src/run-family-normalizer.js";
import { createDomainPilotReport } from "../../../../packages/attention-adapter-harness/src/domain-pilot-report-shape.js";
import { projectFamilyPodcastTranscript } from "./project-family-podcast-transcript.js";

const podcastDomainOnlySemantics = [
  "show_id",
  "show_title",
  "episode_title",
  "guest_names",
  "chapter_titles",
  "feed_url",
  "episode_number",
  "season_number",
  "audio_source_url",
  "source_platform",
  "podcast_network",
  "enclosure_url"
];

export function runFamilyPodcastTranscript(raw_input = {}) {
  const mapping_execution = executePilotMapping({
    adapter_id: "family-podcast-transcript",
    raw_input
  });

  const route_resolution = runRouteResolution({
    adapter_id: mapping_execution.adapter_id,
    route_type: mapping_execution.route_type,
    family_kind: mapping_execution.family_kind,
    source_kind: mapping_execution.source_kind,
    registry_entry: mapping_execution.registry_entry,
    registry_entries: mapping_execution.registry_entries
  });

  const family_execution = runFamilyNormalizer({
    family_kind: mapping_execution.family_kind,
    raw_input
  });

  const shared_projection = projectFamilyPodcastTranscript(raw_input, family_execution.normalized_shape);
  const retainedExtras = {
    adapter_only: [...mapping_execution.retained_extras],
    domain_only: podcastDomainOnlySemantics.filter((field) => field in raw_input)
  };
  const diagnostics = buildPilotDiagnostics({
    mapping_execution,
    raw_input,
    route_resolution,
    retained_extra_groups: retainedExtras,
    accepted_runtime_fields: ["product_key", "episode_key", "summary_body", "fetched_at"],
    additional_notes: ["Step 06 podcast adoption executed through transcript family and shared runtime."]
  });

  const adopted = adoptPilotEntry({
    domain_name: "podcast-domain",
    adapter_id: mapping_execution.adapter_id,
    route_type: mapping_execution.route_type,
    family_kind: mapping_execution.family_kind,
    selected_path: route_resolution.resolved_path,
    family_normalized_fixture: family_execution.normalized_shape,
    shared_projection_fixture: shared_projection,
    diagnostics_fixture: diagnostics,
    retained_extras: retainedExtras,
    warnings: diagnostics.warnings,
    no_domain_upgrade: false
  });

  return createDomainPilotReport(adopted);
}
