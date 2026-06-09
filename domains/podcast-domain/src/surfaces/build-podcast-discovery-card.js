import { createDiscoveryCardSurface } from "../../../../packages/attention-core-mobile-ui/src/contracts/discovery-card-surface.js";

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

function toSnippet(value = "", maxLength = 72) {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export function buildPodcastDiscoveryCard({
  domain_manifest,
  surface_manifest,
  shared_projection,
  retained_extras,
  diagnostics
} = {}) {
  const detail = shared_projection?.content_detail_envelope || {};
  const visible_keys = surface_manifest?.retained_extras_visibility_rules?.mobile?.discovery_card_surface || [];
  const visible_extras = pickVisibleValues(retained_extras, visible_keys);

  return createDiscoveryCardSurface({
    domain_key: domain_manifest?.domain_key,
    route_type: domain_manifest?.route_type,
    family_kind: domain_manifest?.family_kind,
    card_key: shared_projection?.content_ref?.content_key || null,
    title: detail.title || "",
    summary: toSnippet(detail.body || ""),
    eyebrow: visible_extras.show_title || "Transcript-backed podcast",
    badges: [
      visible_extras.episode_number ? `E${visible_extras.episode_number}` : null,
      visible_extras.source_platform,
      "family-backed"
    ].filter(Boolean),
    retained_extra_preview: visible_extras,
    diagnostics_summary: {
      adapter_id: diagnostics?.adapter_id ?? null,
      warnings: [...(diagnostics?.warnings || [])]
    }
  });
}
