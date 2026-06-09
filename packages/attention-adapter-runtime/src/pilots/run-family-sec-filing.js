import { executePilotMapping } from "../execute-pilot-mapping.js";
import { buildPilotDiagnostics } from "../build-pilot-diagnostics.js";
import { runRouteResolution } from "../../../attention-core-runtime/src/run-route-resolution.js";
import { projectToSharedEnvelope } from "../../../attention-core-runtime/src/project-to-shared-envelope.js";
import { adoptPilotEntry } from "../../../attention-core-runtime/src/adopt-pilot-entry.js";
import { runFamilyNormalizer } from "../../../attention-family-runtime/src/run-family-normalizer.js";

export const familySecFilingFixtureInput = Object.freeze({
  product_key: "demo_official_records",
  source_id: "sec_edgar",
  source_key: "sec_edgar",
  accession_no: "0000123456-26-000001",
  form_type: "8-K",
  issuer_name: "Example Corp",
  filed_at: "2026-03-10T21:00:00Z",
  amendment_flag: false,
  parser_trace_id: "trace_sec_001",
  raw_document_package_ref: "pkg_sec_001",
  title: "Example Corp 8-K",
  summary: "Initial filing summary",
  body: "Initial filing summary",
  language: "en",
  fetched_at: "2026-03-24T00:00:00+08:00"
});

export function runFamilySecFiling(raw_input = familySecFilingFixtureInput) {
  const mapping_execution = executePilotMapping({
    adapter_id: "family-sec-filing",
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

  const shared_projection = projectToSharedEnvelope({
    adapter_id: mapping_execution.adapter_id,
    raw_input,
    family_normalized_shape: family_execution.normalized_shape
  });

  const diagnostics = buildPilotDiagnostics({
    mapping_execution,
    raw_input,
    route_resolution,
    retained_extra_groups: {
      adapter_only: mapping_execution.retained_extras,
      domain_only: []
    },
    additional_notes: ["Step 06 family-only SEC validation executed through family runtime."]
  });

  return adoptPilotEntry({
    domain_name: "family-only-pilot",
    adapter_id: mapping_execution.adapter_id,
    route_type: mapping_execution.route_type,
    family_kind: mapping_execution.family_kind,
    selected_path: route_resolution.resolved_path,
    family_normalized_fixture: family_execution.normalized_shape,
    shared_projection_fixture: shared_projection,
    diagnostics_fixture: diagnostics,
    retained_extras: {
      adapter_only: [...mapping_execution.retained_extras],
      domain_only: []
    },
    warnings: diagnostics.warnings,
    no_domain_upgrade: true
  });
}
