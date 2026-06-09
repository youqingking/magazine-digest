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

export function buildPodcastDetailSurface({
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
    hero_summary: `${visible_extras.show_title || "Podcast"}${visible_extras.episode_number ? ` · E${visible_extras.episode_number}` : ""}`,
    meta_sections: [
      { label: "Show", value: visible_extras.show_title || "n/a" },
      { label: "Season", value: visible_extras.season_number ?? "n/a" },
      { label: "Episode", value: visible_extras.episode_number ?? "n/a" }
    ],
    retained_extra_sections: [
      {
        label: "Guests",
        value: Array.isArray(visible_extras.guest_names) ? visible_extras.guest_names.join(", ") : "n/a"
      },
      {
        label: "Chapters",
        value: Array.isArray(visible_extras.chapter_titles) ? visible_extras.chapter_titles.join(" / ") : "n/a"
      },
      { label: "Source platform", value: visible_extras.source_platform || "n/a" },
      { label: "Podcast network", value: visible_extras.podcast_network || "n/a" }
    ],
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warning_count: Array.isArray(diagnostics?.warnings) ? diagnostics.warnings.length : 0
    }
  });
}
