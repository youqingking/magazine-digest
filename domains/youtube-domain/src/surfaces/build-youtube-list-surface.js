import { createContentListSurface } from "../../../../packages/attention-core-mobile-ui/src/contracts/content-list-surface.js";

function pickVisibleValues(retained_extras = {}, keys = []) {
  const selected = {};

  for (const groupName of ["adapter_only", "domain_only"]) {
    const group = retained_extras?.[groupName] || {};
    for (const key of keys) {
      if (key in group) {
        selected[key] = group[key];
      }
    }
  }

  return selected;
}

function formatDuration(value) {
  if (typeof value !== "number") {
    return null;
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function buildYoutubeListSurface({
  domain_manifest,
  surface_manifest,
  shared_projection,
  retained_extras,
  diagnostics
} = {}) {
  const list_item = shared_projection?.content_list_item || {};
  const visible_keys = surface_manifest?.retained_extras_visibility_rules?.mobile?.content_list_surface || [];
  const visible_extras = pickVisibleValues(retained_extras, visible_keys);

  return createContentListSurface({
    domain_key: domain_manifest?.domain_key,
    route_type: domain_manifest?.route_type,
    family_kind: domain_manifest?.family_kind,
    content_ref: shared_projection?.content_ref || null,
    variant_key: shared_projection?.content_variant_key || null,
    title: list_item.title || "",
    summary: list_item.summary || "",
    tags: list_item.tags || [],
    meta_chips: [formatDuration(visible_extras.duration_seconds), visible_extras.watch_or_skip, visible_extras.input_quality_tier].filter(Boolean),
    retained_extra_preview: visible_extras,
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warnings: [...(diagnostics?.warnings || [])]
    }
  });
}
