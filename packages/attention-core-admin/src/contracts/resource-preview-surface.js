function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const resourcePreviewSurfaceShapeName = "resource_preview_surface";

export const resourcePreviewSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "route_type",
  "family_kind",
  "resource_key",
  "title",
  "subtitle",
  "status",
  "retained_extra_preview",
  "diagnostics_summary"
]);

export function createResourcePreviewSurface({
  domain_key,
  route_type,
  family_kind = null,
  resource_key = null,
  title = "",
  subtitle = "",
  status = "preview_ready",
  retained_extra_preview = {},
  diagnostics_summary = {}
} = {}) {
  return Object.freeze({
    surface_type: resourcePreviewSurfaceShapeName,
    domain_key,
    route_type,
    family_kind,
    resource_key,
    title,
    subtitle,
    status,
    retained_extra_preview: freezeObject(retained_extra_preview),
    diagnostics_summary: freezeObject(diagnostics_summary)
  });
}
