import { buildDomainManifestEntry } from "../../../../packages/attention-adapter-runtime/src/build-domain-manifest-entry.js";
import { buildMagazineDiagnostics } from "../diagnostics/build-magazine-diagnostics.js";
import { buildMagazineRetainedExtras } from "../projections/build-magazine-retained-extras.js";
import { projectMagazineSharedEnvelope } from "../projections/project-magazine-shared-envelope.js";

export const domainManifest = buildDomainManifestEntry({
  domain_key: "magazine",
  route_type: "direct",
  family_kind: null,
  adapter_ids: ["direct-magazine-summary"],
  primary_input_shape: "magazine_summary_input",
  primary_shared_projection: "shared_content_projection",
  retained_extras_keys: {
    adapter_only_extras: [],
    domain_only_extras: ["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"]
  },
  diagnostics_entry: "build-magazine-diagnostics",
  supported_capabilities: ["stable_manifest", "shared_projection", "retained_extras", "diagnostics"],
  unsupported_capabilities: ["ui_migration", "ingestion", "business_logic_migration", "real_source_execution"],
  deferred_product_intelligence: {
    deferred: true,
    status: "deferred",
    notes: ["Step 07 keeps domain intelligence out of runtime adoption."]
  },
  adoption_status: "stable_projection_migrated",
  fixture_paths: {
    input: "domains/magazine-domain/fixtures/direct-magazine-summary.input.json",
    shared_projection: "domains/magazine-domain/fixtures/direct-magazine-summary.shared.json",
    diagnostics: "domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json",
    family_normalized: null
  },
  report_paths: {
    validation_report: "output/shared-step-07/validation-report.json",
    capability_report: "output/shared-step-07/domain-capability-report.json",
    protected_snapshot: "output/shared-step-07/protected-paths.snapshot.json"
  },
  runtime_hooks: {
    project_shared_envelope: projectMagazineSharedEnvelope,
    build_retained_extras: buildMagazineRetainedExtras,
    build_diagnostics: buildMagazineDiagnostics
  }
});
