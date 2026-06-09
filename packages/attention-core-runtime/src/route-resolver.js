import { createSharedRuntimeSurfaceMap } from "./runtime-surface-map.js";

const familyNormalizerShapeByKind = Object.freeze({
  transcript_first_longform: "transcript_first_longform_normalized_shape",
  official_structured_sources: "official_structured_sources_normalized_shape"
});

function buildDiagnosticsHooks(entry, warnings = [], errors = []) {
  return Object.freeze({
    adapter_id: entry?.adapter_id || null,
    warning_count: warnings.length,
    error_count: errors.length,
    warnings,
    errors,
    hook_names: [
      "route_type_guard",
      "family_kind_guard",
      "shared_projection_guard",
      "retained_extras_review"
    ]
  });
}

export function resolveAdapterRoute({
  adapter_id,
  route_type,
  family_kind = null,
  source_kind,
  registry_entry
}) {
  const warnings = [];
  const errors = [];
  const entry = registry_entry || {};

  if (entry.adapter_id !== adapter_id) {
    errors.push("adapter_id_mismatch");
  }

  if (entry.source_kind !== source_kind) {
    errors.push("source_kind_mismatch");
  }

  if (entry.route_type && entry.route_type !== route_type) {
    errors.push("route_type_mismatch");
  }

  if (entry.adapter_route_type && entry.adapter_route_type !== route_type) {
    errors.push("adapter_route_type_mismatch");
  }

  if (route_type === "direct" && family_kind) {
    errors.push("direct_route_must_not_have_family_kind");
  }

  if (route_type === "family" && !family_kind) {
    errors.push("family_route_requires_family_kind");
  }

  if (route_type === "family" && family_kind && !familyNormalizerShapeByKind[family_kind]) {
    errors.push("unknown_family_kind");
  }

  if (!entry.output_shape_name) {
    errors.push("missing_output_shape_name");
  }

  if (route_type === "direct") {
    const diagnostics_hooks = buildDiagnosticsHooks(entry, warnings, errors);
    return Object.freeze({
      adapter_id,
      route_type,
      family_kind: null,
      resolved_path: ["source_adapter", "shared_core"],
      expected_intermediate_shape: null,
      expected_shared_projection: entry.output_shape_name || null,
      diagnostics_hooks,
      runtime_surface_map: createSharedRuntimeSurfaceMap({
        adapter_id,
        route_type,
        family_kind: null,
        selected_path: ["source_adapter", "shared_core"],
        normalized_shape_name: null,
        shared_projection_name: entry.output_shape_name || null,
        diagnostics_hooks: diagnostics_hooks.hook_names
      })
    });
  }

  const expected_intermediate_shape = familyNormalizerShapeByKind[family_kind] || null;
  const diagnostics_hooks = buildDiagnosticsHooks(entry, warnings, errors);

  return Object.freeze({
    adapter_id,
    route_type,
    family_kind,
    resolved_path: ["source_adapter", "family_normalizer", "shared_core"],
    expected_intermediate_shape,
    expected_shared_projection: entry.output_shape_name || null,
    diagnostics_hooks,
    runtime_surface_map: createSharedRuntimeSurfaceMap({
      adapter_id,
      route_type,
      family_kind,
      selected_path: ["source_adapter", "family_normalizer", "shared_core"],
      normalized_shape_name: expected_intermediate_shape,
      shared_projection_name: entry.output_shape_name || null,
      diagnostics_hooks: diagnostics_hooks.hook_names
    })
  });
}
