function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

export const surfaceRegistryShapeName = "surface_registry";

export const surfaceRegistryFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "registered_surfaces",
  "generated_rails",
  "manual_rails",
  "deferred_surfaces",
  "planning_status"
]);

export function createSurfaceRegistry({
  domain_key,
  registered_surfaces = [],
  generated_rails = [],
  manual_rails = [],
  deferred_surfaces = [],
  planning_status = "frozen_for_step_08"
} = {}) {
  return Object.freeze({
    surface_type: surfaceRegistryShapeName,
    domain_key,
    registered_surfaces: freezeArray(registered_surfaces),
    generated_rails: freezeArray(generated_rails),
    manual_rails: freezeArray(manual_rails),
    deferred_surfaces: freezeArray(deferred_surfaces),
    planning_status
  });
}
