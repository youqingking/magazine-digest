export const pilotRegistryReportShapeName = "pilot_registry_report";

export const pilotRegistryReportFieldNames = [
  "adapter_id",
  "route_type",
  "family_kind",
  "selected_path",
  "normalized_shape_name",
  "shared_projection_name",
  "retained_extras",
  "warnings"
];

export function createPilotRegistryReport({
  adapter_id,
  route_type,
  family_kind = null,
  selected_path,
  normalized_shape_name = null,
  shared_projection_name,
  retained_extras = [],
  warnings = []
}) {
  return Object.freeze({
    adapter_id,
    route_type,
    family_kind,
    selected_path,
    normalized_shape_name,
    shared_projection_name,
    retained_extras,
    warnings
  });
}
