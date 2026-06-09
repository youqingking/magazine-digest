function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const contentListSurfaceShapeName = "content_list_surface";

export const contentListSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "route_type",
  "family_kind",
  "content_ref",
  "variant_key",
  "title",
  "summary",
  "tags",
  "meta_chips",
  "state_panel_type",
  "retained_extra_preview",
  "diagnostics_summary"
]);

export function createContentListSurface({
  domain_key,
  route_type,
  family_kind = null,
  content_ref = null,
  variant_key = null,
  title = "",
  summary = "",
  tags = [],
  meta_chips = [],
  state_panel_type = "placeholder",
  retained_extra_preview = {},
  diagnostics_summary = {}
} = {}) {
  return Object.freeze({
    surface_type: contentListSurfaceShapeName,
    domain_key,
    route_type,
    family_kind,
    content_ref,
    variant_key,
    title,
    summary,
    tags: freezeArray(tags),
    meta_chips: freezeArray(meta_chips),
    state_panel_type,
    retained_extra_preview: freezeObject(retained_extra_preview),
    diagnostics_summary: freezeObject(diagnostics_summary)
  });
}
