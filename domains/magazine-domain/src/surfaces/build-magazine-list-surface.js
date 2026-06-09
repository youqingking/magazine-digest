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

function summarizeDiagnostics(diagnostics = {}) {
  return {
    adapter_id: diagnostics.adapter_id ?? null,
    warnings: [...(diagnostics.warnings || [])]
  };
}

export function buildMagazineListSurface({
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
    meta_chips: [visible_extras.issue_label, visible_extras.cover_slot].filter(Boolean),
    retained_extra_preview: visible_extras,
    diagnostics_summary: summarizeDiagnostics(diagnostics)
  });
}
