import { buildDomainManifestEntry } from "../../../../packages/attention-adapter-runtime/src/build-domain-manifest-entry.js";
import { buildYoutubeDiagnostics } from "../diagnostics/build-youtube-diagnostics.js";
import { buildYoutubeRetainedExtras } from "../projections/build-youtube-retained-extras.js";
import { projectYoutubeSharedEnvelope } from "../projections/project-youtube-shared-envelope.js";

export const domainManifest = buildDomainManifestEntry({
  domain_key: "youtube",
  route_type: "direct",
  family_kind: null,
  adapter_ids: ["direct-youtube-summary"],
  primary_input_shape: "youtube_summary_input",
  primary_shared_projection: "shared_content_projection",
  retained_extras_keys: {
    adapter_only_extras: [],
    domain_only_extras: ["timestamp_anchors", "watch_or_skip", "input_quality_tier", "duration_seconds", "playback_policy"]
  },
  diagnostics_entry: "build-youtube-diagnostics",
  supported_capabilities: ["stable_manifest", "shared_projection", "retained_extras", "diagnostics"],
  unsupported_capabilities: ["ui_migration", "ingestion", "business_logic_migration", "real_source_execution"],
  deferred_product_intelligence: {
    deferred: true,
    status: "deferred",
    notes: ["Step 07 keeps domain intelligence out of runtime adoption."]
  },
  adoption_status: "stable_projection_migrated",
  fixture_paths: {
    input: "domains/youtube-domain/fixtures/direct-youtube-summary.input.json",
    shared_projection: "domains/youtube-domain/fixtures/direct-youtube-summary.shared.json",
    diagnostics: "domains/youtube-domain/fixtures/direct-youtube-summary.diagnostics.json",
    family_normalized: null
  },
  report_paths: {
    validation_report: "output/shared-step-07/validation-report.json",
    capability_report: "output/shared-step-07/domain-capability-report.json",
    protected_snapshot: "output/shared-step-07/protected-paths.snapshot.json"
  },
  runtime_hooks: {
    project_shared_envelope: projectYoutubeSharedEnvelope,
    build_retained_extras: buildYoutubeRetainedExtras,
    build_diagnostics: buildYoutubeDiagnostics
  }
});
