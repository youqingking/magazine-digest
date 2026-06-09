import { buildYoutubeAdminPreview } from "../surfaces/build-youtube-admin-preview.js";
import { buildYoutubeDetailSurface } from "../surfaces/build-youtube-detail-surface.js";
import { buildYoutubeDiscoveryCard } from "../surfaces/build-youtube-discovery-card.js";
import { buildYoutubeListSurface } from "../surfaces/build-youtube-list-surface.js";

export const domainSurfaceManifest = Object.freeze({
  manifest_version: "0.0.0-step08",
  domain_key: "youtube",
  route_type: "direct",
  family_kind: null,
  list_surface_builder: "build-youtube-list-surface",
  detail_surface_builder: "build-youtube-detail-surface",
  discovery_card_builder: "build-youtube-discovery-card",
  admin_preview_builder: "build-youtube-admin-preview",
  supported_mobile_surfaces: Object.freeze([
    "content_list_surface",
    "content_detail_surface",
    "discovery_card_surface",
    "state_panel_surface_map"
  ]),
  supported_admin_surfaces: Object.freeze([
    "resource_preview_surface",
    "domain_admin_rail_map",
    "generated_resource_surface",
    "surface_registry"
  ]),
  deferred_surfaces: Object.freeze(["inbox_preview_surface", "manual_rail_surface"]),
  retained_extras_visibility_rules: Object.freeze({
    mobile: Object.freeze({
      content_list_surface: Object.freeze(["duration_seconds", "watch_or_skip", "input_quality_tier"]),
      content_detail_surface: Object.freeze([
        "duration_seconds",
        "watch_or_skip",
        "input_quality_tier",
        "timestamp_anchors",
        "playback_policy"
      ]),
      discovery_card_surface: Object.freeze(["duration_seconds", "watch_or_skip"])
    }),
    admin: Object.freeze({
      resource_preview_surface: Object.freeze([
        "duration_seconds",
        "watch_or_skip",
        "input_quality_tier",
        "timestamp_anchors",
        "playback_policy"
      ]),
      generated_resource_surface: Object.freeze([
        "duration_seconds",
        "watch_or_skip",
        "input_quality_tier",
        "timestamp_anchors",
        "playback_policy"
      ])
    })
  }),
  diagnostics_entry: "build-youtube-diagnostics",
  adoption_status: "second_migration_slice_frozen",
  runtime_hooks: Object.freeze({
    build_list_surface: buildYoutubeListSurface,
    build_detail_surface: buildYoutubeDetailSurface,
    build_discovery_card: buildYoutubeDiscoveryCard,
    build_admin_preview: buildYoutubeAdminPreview
  })
});
