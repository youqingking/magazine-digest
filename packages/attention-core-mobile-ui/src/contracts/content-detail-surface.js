function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const contentDetailSurfaceShapeName = "content_detail_surface";

export const contentDetailSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "route_type",
  "family_kind",
  "content_ref",
  "title",
  "body",
  "body_format",
  "tags",
  "hero_summary",
  "meta_sections",
  "retained_extra_sections",
  "diagnostics_summary",
  "state_panel_type"
]);

export function createContentDetailSurface({
  domain_key,
  route_type,
  family_kind = null,
  content_ref = null,
  title = "",
  body = "",
  body_format = "markdown",
  tags = [],
  hero_summary = "",
  meta_sections = [],
  retained_extra_sections = [],
  diagnostics_summary = {},
  state_panel_type = "placeholder"
} = {}) {
  return Object.freeze({
    surface_type: contentDetailSurfaceShapeName,
    domain_key,
    route_type,
    family_kind,
    content_ref,
    title,
    body,
    body_format,
    tags: freezeArray(tags),
    hero_summary,
    meta_sections: freezeArray(meta_sections),
    retained_extra_sections: freezeArray(retained_extra_sections),
    diagnostics_summary: freezeObject(diagnostics_summary),
    state_panel_type
  });
}
