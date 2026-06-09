export const routeResolutionReportShapeName = "route_resolution_report";

export const routeResolutionReportFieldNames = [
  "adapter_id",
  "route_type",
  "family_kind",
  "selected_path",
  "normalized_shape_name",
  "shared_projection_name",
  "retained_extras",
  "warnings"
];

export function createRouteResolutionReport({
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
