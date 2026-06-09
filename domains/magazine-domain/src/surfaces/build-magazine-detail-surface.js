import { createContentDetailSurface } from "../../../../packages/attention-core-mobile-ui/src/contracts/content-detail-surface.js";

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

function toSection(label, value) {
  return { label, value };
}

export function buildMagazineDetailSurface({
  domain_manifest,
  surface_manifest,
  shared_projection,
  retained_extras,
  diagnostics
} = {}) {
  const detail = shared_projection?.content_detail_envelope || {};
  const visible_keys = surface_manifest?.retained_extras_visibility_rules?.mobile?.content_detail_surface || [];
  const visible_extras = pickVisibleValues(retained_extras, visible_keys);

  return createContentDetailSurface({
    domain_key: domain_manifest?.domain_key,
    route_type: domain_manifest?.route_type,
    family_kind: domain_manifest?.family_kind,
    content_ref: shared_projection?.content_ref || null,
    title: detail.title || "",
    body: detail.body || "",
    body_format: detail.body_format || "markdown",
    tags: detail.tags || [],
    hero_summary: `${visible_extras.issue_label || "Issue pending"}${visible_extras.start_page ? ` · p.${visible_extras.start_page}` : ""}`,
    meta_sections: [
      toSection("Issue", visible_extras.issue_label || "n/a"),
      toSection("Start page", visible_extras.start_page ?? "n/a"),
      toSection("Cover slot", visible_extras.cover_slot || "n/a")
    ],
    retained_extra_sections: [
      toSection("Print taxonomy", Array.isArray(visible_extras.print_taxonomy_path) ? visible_extras.print_taxonomy_path.join(" / ") : "n/a")
    ],
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warning_count: Array.isArray(diagnostics?.warnings) ? diagnostics.warnings.length : 0
    }
  });
}
