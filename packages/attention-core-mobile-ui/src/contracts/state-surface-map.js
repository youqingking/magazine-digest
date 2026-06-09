function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const stateSurfaceMapShapeName = "state_panel_surface_map";

export const stateSurfaceMapFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "supported_surfaces",
  "deferred_surfaces",
  "state_panel_types",
  "default_surface_states"
]);

export function createStateSurfaceMap({
  domain_key,
  supported_surfaces = [],
  deferred_surfaces = [],
  state_panel_types = [],
  default_surface_states = {}
} = {}) {
  return Object.freeze({
    surface_type: stateSurfaceMapShapeName,
    domain_key,
    supported_surfaces: freezeArray(supported_surfaces),
    deferred_surfaces: freezeArray(deferred_surfaces),
    state_panel_types: freezeArray(state_panel_types),
    default_surface_states: freezeObject(default_surface_states)
  });
}
