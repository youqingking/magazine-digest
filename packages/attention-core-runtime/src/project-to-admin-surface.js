import {
  createDomainAdminRailMap,
  domainAdminRailMapShapeName
} from "../../attention-core-admin/src/contracts/domain-admin-rail-map.js";
import {
  createGeneratedResourceSurface,
  generatedResourceSurfaceShapeName
} from "../../attention-core-admin/src/contracts/generated-resource-surface.js";
import {
  createManualRailSurface,
  manualRailSurfaceShapeName
} from "../../attention-core-admin/src/contracts/manual-rail-surface.js";
import { createSurfaceRegistry, surfaceRegistryShapeName } from "../../attention-core-admin/src/contracts/surface-registry.js";

function summarizeDiagnostics(diagnostics = {}) {
  return Object.freeze({
    adapter_id: diagnostics.adapter_id ?? null,
    warning_count: Array.isArray(diagnostics.warnings) ? diagnostics.warnings.length : 0,
    note_count: Array.isArray(diagnostics.notes) ? diagnostics.notes.length : 0
  });
}

export function projectToAdminSurface({
  domain_manifest,
  surface_manifest,
  domain_report,
  retained_extras_snapshot = {}
} = {}) {
  const shared_projection = domain_report?.shared_projection_fixture ?? {};
  const diagnostics = domain_report?.diagnostics_fixture ?? {};
  const hooks = surface_manifest?.runtime_hooks || {};
  const admin_surfaces = {};

  if (surface_manifest?.supported_admin_surfaces?.includes("resource_preview_surface")) {
    admin_surfaces.resource_preview_surface = hooks.build_admin_preview({
      domain_manifest,
      surface_manifest,
      shared_projection,
      retained_extras: retained_extras_snapshot,
      diagnostics
    });
  }

  admin_surfaces[domainAdminRailMapShapeName] = createDomainAdminRailMap({
    domain_key: domain_manifest?.domain_key,
    generated_rails: ["resource_preview", "generated_resource_surface"],
    manual_rails: surface_manifest?.deferred_surfaces?.includes(manualRailSurfaceShapeName) ? [] : ["manual_rail_surface"],
    registry_entries: surface_manifest?.supported_admin_surfaces || [],
    deferred_rails: surface_manifest?.deferred_surfaces || []
  });

  admin_surfaces[generatedResourceSurfaceShapeName] = createGeneratedResourceSurface({
    domain_key: domain_manifest?.domain_key,
    resource_preview: admin_surfaces.resource_preview_surface || null,
    generated_sections: [
      {
        section_key: "shared_projection_summary",
        title: "Shared projection summary",
        body_preview: shared_projection?.content_detail_envelope?.title || shared_projection?.content_list_item?.title || ""
      },
      {
        section_key: "retained_extras_summary",
        title: "Retained extras summary",
        retained_extra_keys: retained_extras_snapshot.all_keys || []
      }
    ],
    supported_actions: ["preview_only"],
    diagnostics_summary: summarizeDiagnostics(diagnostics)
  });

  admin_surfaces[manualRailSurfaceShapeName] = createManualRailSurface({
    domain_key: domain_manifest?.domain_key
  });

  admin_surfaces[surfaceRegistryShapeName] = createSurfaceRegistry({
    domain_key: domain_manifest?.domain_key,
    registered_surfaces: surface_manifest?.supported_admin_surfaces || [],
    generated_rails: ["resource_preview", "generated_resource_surface"],
    manual_rails: [],
    deferred_surfaces: surface_manifest?.deferred_surfaces || []
  });

  return Object.freeze({
    domain_key: domain_manifest?.domain_key ?? null,
    route_type: domain_manifest?.route_type ?? null,
    family_kind: domain_manifest?.family_kind ?? null,
    supported_admin_surfaces: Object.freeze([...(surface_manifest?.supported_admin_surfaces || [])]),
    deferred_surfaces: Object.freeze([...(surface_manifest?.deferred_surfaces || [])]),
    surfaces: Object.freeze({ ...admin_surfaces }),
    diagnostics_summary: summarizeDiagnostics(diagnostics)
  });
}
