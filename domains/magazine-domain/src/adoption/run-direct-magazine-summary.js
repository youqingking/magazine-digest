import { executePilotMapping } from "../../../../packages/attention-adapter-runtime/src/execute-pilot-mapping.js";
import { buildPilotDiagnostics } from "../../../../packages/attention-adapter-runtime/src/build-pilot-diagnostics.js";
import { runRouteResolution } from "../../../../packages/attention-core-runtime/src/run-route-resolution.js";
import { adoptPilotEntry } from "../../../../packages/attention-core-runtime/src/adopt-pilot-entry.js";
import { createDomainPilotReport } from "../../../../packages/attention-adapter-harness/src/domain-pilot-report-shape.js";
import { projectDirectMagazineSummary } from "./project-direct-magazine-summary.js";

export function runDirectMagazineSummary(raw_input = {}) {
  const mapping_execution = executePilotMapping({
    adapter_id: "direct-magazine-summary",
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

  const shared_projection = projectDirectMagazineSummary(raw_input);
  const retainedExtras = {
    adapter_only: [],
    domain_only: [...mapping_execution.retained_extras]
  };
  const diagnostics = buildPilotDiagnostics({
    mapping_execution,
    raw_input,
    route_resolution,
    retained_extra_groups: retainedExtras,
    accepted_runtime_fields: [
      "product_key",
      "body",
      "body_format",
      "tags",
      "audience_segment",
      "reading_mode",
      "revision",
      "publish_status",
      "available_from",
      "available_until",
      "update_type",
      "update_priority",
      "fetched_at"
    ],
    additional_notes: ["Step 06 direct magazine adoption executed through shared runtime."]
  });

  const adopted = adoptPilotEntry({
    domain_name: "magazine-domain",
    adapter_id: mapping_execution.adapter_id,
    route_type: mapping_execution.route_type,
    family_kind: null,
    selected_path: route_resolution.resolved_path,
    shared_projection_fixture: shared_projection,
    diagnostics_fixture: diagnostics,
    retained_extras: retainedExtras,
    warnings: diagnostics.warnings,
    no_domain_upgrade: false
  });

  return createDomainPilotReport(adopted);
}
