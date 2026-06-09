import { buildPodcastAdminPreview } from "../surfaces/build-podcast-admin-preview.js";
import { buildPodcastDetailSurface } from "../surfaces/build-podcast-detail-surface.js";
import { buildPodcastDiscoveryCard } from "../surfaces/build-podcast-discovery-card.js";
import { buildPodcastListSurface } from "../surfaces/build-podcast-list-surface.js";

export const domainSurfaceManifest = Object.freeze({
  manifest_version: "0.0.0-step08",
  domain_key: "podcast",
  route_type: "family",
  family_kind: "transcript_first_longform",
  list_surface_builder: "build-podcast-list-surface",
  detail_surface_builder: "build-podcast-detail-surface",
  discovery_card_builder: "build-podcast-discovery-card",
  admin_preview_builder: "build-podcast-admin-preview",
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
      content_list_surface: Object.freeze(["show_title", "episode_number", "season_number", "source_platform"]),
      content_detail_surface: Object.freeze([
        "show_title",
        "episode_number",
        "season_number",
        "guest_names",
        "chapter_titles",
        "source_platform",
        "podcast_network"
      ]),
      discovery_card_surface: Object.freeze(["show_title", "episode_number", "source_platform"])
    }),
    admin: Object.freeze({
      resource_preview_surface: Object.freeze([
        "show_id",
        "show_title",
        "episode_number",
        "season_number",
        "guest_names",
        "chapter_titles",
        "feed_url",
        "source_platform",
        "podcast_network"
      ]),
      generated_resource_surface: Object.freeze([
        "show_id",
        "show_title",
        "episode_number",
        "season_number",
        "guest_names",
        "chapter_titles",
        "feed_url",
        "source_platform",
        "podcast_network"
      ])
    })
  }),
  diagnostics_entry: "build-podcast-diagnostics",
  adoption_status: "second_migration_slice_frozen",
  runtime_hooks: Object.freeze({
    build_list_surface: buildPodcastListSurface,
    build_detail_surface: buildPodcastDetailSurface,
    build_discovery_card: buildPodcastDiscoveryCard,
    build_admin_preview: buildPodcastAdminPreview
  })
});
