import { createMappingDiagnostics } from "./contracts/mapping-diagnostics.js";

function unique(list = []) {
  return [...new Set(list.filter(Boolean))];
}

export function buildPilotDiagnostics({
  mapping_execution,
  raw_input = {},
  route_resolution = null,
  retained_extra_groups = { adapter_only: [], domain_only: [] },
  accepted_runtime_fields = [],
  additional_warnings = [],
  additional_notes = []
}) {
  const pilot = mapping_execution.pilot;
  const expectedFields = new Set(pilot.input_shape?.fields || []);
  const combinedRetained = unique([
    ...(pilot.diagnostics_example?.retained_domain_extras || []),
    ...(retained_extra_groups.adapter_only || []),
    ...(retained_extra_groups.domain_only || [])
  ]);
  const routeWarnings = route_resolution?.diagnostics_hooks?.warnings || [];
  const routeErrors = route_resolution?.diagnostics_hooks?.errors || [];
  const unmappedSourceFields = Object.keys(raw_input).filter(
    (field) => !expectedFields.has(field) && !combinedRetained.includes(field) && !accepted_runtime_fields.includes(field)
  );

  return Object.freeze({
    ...createMappingDiagnostics({
      ...pilot.diagnostics_example,
      adapter_id: mapping_execution.adapter_id,
      route_type: mapping_execution.route_type,
      source_kind: mapping_execution.source_kind,
      family_kind: mapping_execution.family_kind,
      retained_domain_extras: combinedRetained,
      unmapped_source_fields: unmappedSourceFields,
      warnings: unique([...(pilot.diagnostics_example?.warnings || []), ...routeWarnings, ...additional_warnings]),
      notes: unique([
        ...(pilot.diagnostics_example?.notes || []),
        ...routeErrors.map((error) => `route_error:${error}`),
        ...additional_notes
      ])
    }),
    retained_extra_groups: Object.freeze({
      adapter_only: [...(retained_extra_groups.adapter_only || [])],
      domain_only: [...(retained_extra_groups.domain_only || [])]
    })
  });
}
