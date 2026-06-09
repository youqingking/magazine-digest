function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const discoveryCardSurfaceShapeName = "discovery_card_surface";

export const discoveryCardSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "route_type",
  "family_kind",
  "card_key",
  "title",
  "summary",
  "eyebrow",
  "badges",
  "action_hint",
  "retained_extra_preview",
  "diagnostics_summary",
  "state_panel_type"
]);

export function createDiscoveryCardSurface({
  domain_key,
  route_type,
  family_kind = null,
  card_key = null,
  title = "",
  summary = "",
  eyebrow = "",
  badges = [],
  action_hint = "open_detail",
  retained_extra_preview = {},
  diagnostics_summary = {},
  state_panel_type = "placeholder"
} = {}) {
  return Object.freeze({
    surface_type: discoveryCardSurfaceShapeName,
    domain_key,
    route_type,
    family_kind,
    card_key,
    title,
    summary,
    eyebrow,
    badges: freezeArray(badges),
    action_hint,
    retained_extra_preview: freezeObject(retained_extra_preview),
    diagnostics_summary: freezeObject(diagnostics_summary),
    state_panel_type
  });
}
