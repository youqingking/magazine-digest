export const runtimeSurfaceMapShapeName = "shared_runtime_surface_map";

export const runtimeSurfaceMapFieldNames = [
  "adapter_id",
  "route_type",
  "family_kind",
  "selected_path",
  "normalized_shape_name",
  "shared_projection_name",
  "diagnostics_hooks"
];

export function createSharedRuntimeSurfaceMap({
  adapter_id,
  route_type,
  family_kind = null,
  selected_path,
  normalized_shape_name = null,
  shared_projection_name,
  diagnostics_hooks = []
}) {
  return Object.freeze({
    adapter_id,
    route_type,
    family_kind,
    selected_path,
    normalized_shape_name,
    shared_projection_name,
    diagnostics_hooks
  });
}
