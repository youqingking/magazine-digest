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

function formatDuration(value) {
  if (typeof value !== "number") {
    return "n/a";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function buildYoutubeDetailSurface({
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
    hero_summary: `${formatDuration(visible_extras.duration_seconds)} · ${visible_extras.playback_policy || "preview_only"}`,
    meta_sections: [
      { label: "Duration", value: formatDuration(visible_extras.duration_seconds) },
      { label: "Watch or skip", value: visible_extras.watch_or_skip || "n/a" },
      { label: "Input quality", value: visible_extras.input_quality_tier || "n/a" }
    ],
    retained_extra_sections: [
      {
        label: "Timestamp anchors",
        value: Array.isArray(visible_extras.timestamp_anchors) ? visible_extras.timestamp_anchors.join(", ") : "n/a"
      },
      { label: "Playback policy", value: visible_extras.playback_policy || "n/a" }
    ],
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warning_count: Array.isArray(diagnostics?.warnings) ? diagnostics.warnings.length : 0
    }
  });
}
