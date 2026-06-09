import { buildDomainManifestEntry } from "../../../../packages/attention-adapter-runtime/src/build-domain-manifest-entry.js";
import { buildPodcastDiagnostics } from "../diagnostics/build-podcast-diagnostics.js";
import { buildPodcastRetainedExtras } from "../projections/build-podcast-retained-extras.js";
import { projectPodcastFamilySharedEnvelope } from "../projections/project-podcast-family-shared-envelope.js";

export const domainManifest = buildDomainManifestEntry({
  domain_key: "podcast",
  route_type: "family",
  family_kind: "transcript_first_longform",
  adapter_ids: ["family-podcast-transcript"],
  primary_input_shape: "podcast_transcript_raw_input",
  primary_shared_projection: "family_then_shared_content_projection",
  retained_extras_keys: {
    adapter_only_extras: ["cue_id", "provider_confidence_trace", "player_deep_link_fragment", "subtitle_track_id"],
    domain_only_extras: [
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
    ]
  },
  diagnostics_entry: "build-podcast-diagnostics",
  supported_capabilities: [
    "stable_manifest",
    "family_normalization",
    "shared_projection",
    "retained_extras",
    "diagnostics"
  ],
  unsupported_capabilities: ["ui_migration", "ingestion", "business_logic_migration", "real_source_execution"],
  deferred_product_intelligence: {
    deferred: true,
    status: "deferred",
    notes: ["Step 07 keeps podcast product intelligence out of runtime adoption."]
  },
  adoption_status: "stable_projection_migrated",
  fixture_paths: {
    input: "domains/podcast-domain/fixtures/family-podcast-transcript.input.json",
    family_normalized: "domains/podcast-domain/fixtures/family-podcast-transcript.family.json",
    shared_projection: "domains/podcast-domain/fixtures/family-podcast-transcript.shared.json",
    diagnostics: "domains/podcast-domain/fixtures/family-podcast-transcript.diagnostics.json"
  },
  report_paths: {
    validation_report: "output/shared-step-07/validation-report.json",
    capability_report: "output/shared-step-07/domain-capability-report.json",
    protected_snapshot: "output/shared-step-07/protected-paths.snapshot.json"
  },
  runtime_hooks: {
    project_shared_envelope: projectPodcastFamilySharedEnvelope,
    build_retained_extras: buildPodcastRetainedExtras,
    build_diagnostics: buildPodcastDiagnostics
  }
});
