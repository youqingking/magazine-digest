function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const generatedResourceSurfaceShapeName = "generated_resource_surface";

export const generatedResourceSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "resource_preview",
  "generated_sections",
  "supported_actions",
  "diagnostics_summary"
]);

export function createGeneratedResourceSurface({
  domain_key,
  resource_preview = null,
  generated_sections = [],
  supported_actions = [],
  diagnostics_summary = {}
} = {}) {
  return Object.freeze({
    surface_type: generatedResourceSurfaceShapeName,
    domain_key,
    resource_preview,
    generated_sections: freezeArray(generated_sections),
    supported_actions: freezeArray(supported_actions),
    diagnostics_summary: freezeObject(diagnostics_summary)
  });
}
