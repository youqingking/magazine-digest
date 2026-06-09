import { buildMagazineAdminPreview } from "../surfaces/build-magazine-admin-preview.js";
import { buildMagazineDetailSurface } from "../surfaces/build-magazine-detail-surface.js";
import { buildMagazineDiscoveryCard } from "../surfaces/build-magazine-discovery-card.js";
import { buildMagazineListSurface } from "../surfaces/build-magazine-list-surface.js";

export const domainSurfaceManifest = Object.freeze({
  manifest_version: "0.0.0-step08",
  domain_key: "magazine",
  route_type: "direct",
  family_kind: null,
  list_surface_builder: "build-magazine-list-surface",
  detail_surface_builder: "build-magazine-detail-surface",
  discovery_card_builder: "build-magazine-discovery-card",
  admin_preview_builder: "build-magazine-admin-preview",
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
      content_list_surface: Object.freeze(["issue_label", "cover_slot"]),
      content_detail_surface: Object.freeze(["issue_label", "start_page", "print_taxonomy_path", "cover_slot"]),
      discovery_card_surface: Object.freeze(["issue_label", "cover_slot"])
    }),
    admin: Object.freeze({
      resource_preview_surface: Object.freeze(["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"]),
      generated_resource_surface: Object.freeze(["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"])
    })
  }),
  diagnostics_entry: "build-magazine-diagnostics",
  adoption_status: "second_migration_slice_frozen",
  runtime_hooks: Object.freeze({
    build_list_surface: buildMagazineListSurface,
    build_detail_surface: buildMagazineDetailSurface,
    build_discovery_card: buildMagazineDiscoveryCard,
    build_admin_preview: buildMagazineAdminPreview
  })
});
