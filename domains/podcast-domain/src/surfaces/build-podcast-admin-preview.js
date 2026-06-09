import { createResourcePreviewSurface } from "../../../../packages/attention-core-admin/src/contracts/resource-preview-surface.js";

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

export function buildPodcastAdminPreview({
  domain_manifest,
  surface_manifest,
  shared_projection,
  retained_extras,
  diagnostics
} = {}) {
  const detail = shared_projection?.content_detail_envelope || {};
  const visible_keys = surface_manifest?.retained_extras_visibility_rules?.admin?.resource_preview_surface || [];
  const visible_extras = pickVisibleValues(retained_extras, visible_keys);

  return createResourcePreviewSurface({
    domain_key: domain_manifest?.domain_key,
    route_type: domain_manifest?.route_type,
    family_kind: domain_manifest?.family_kind,
    resource_key: shared_projection?.content_ref?.content_key || null,
    title: detail.title || "",
    subtitle: `${visible_extras.show_title || "Podcast"} · ${visible_extras.source_platform || "family-backed preview"}`,
    retained_extra_preview: visible_extras,
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warning_count: Array.isArray(diagnostics?.warnings) ? diagnostics.warnings.length : 0,
      retained_domain_extras: diagnostics?.retained_domain_extras || []
    }
  });
}
