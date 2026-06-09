import {
  createDeferredInboxPreviewSurface,
  inboxPreviewSurfaceShapeName
} from "../../attention-core-mobile-ui/src/contracts/inbox-preview-surface.js";
import {
  createStateSurfaceMap,
  stateSurfaceMapShapeName
} from "../../attention-core-mobile-ui/src/contracts/state-surface-map.js";

const defaultStatePanelTypes = Object.freeze(["loading", "empty", "error", "unavailable", "cached", "placeholder"]);

function summarizeDiagnostics(diagnostics = {}) {
  return Object.freeze({
    adapter_id: diagnostics.adapter_id ?? null,
    warning_count: Array.isArray(diagnostics.warnings) ? diagnostics.warnings.length : 0,
    note_count: Array.isArray(diagnostics.notes) ? diagnostics.notes.length : 0,
    warnings: Object.freeze([...(diagnostics.warnings || [])])
  });
}

export function projectToMobileSurface({
  domain_manifest,
  surface_manifest,
  domain_report,
  retained_extras_snapshot = {}
} = {}) {
  const shared_projection = domain_report?.shared_projection_fixture ?? {};
  const diagnostics = domain_report?.diagnostics_fixture ?? {};
  const hooks = surface_manifest?.runtime_hooks || {};
  const mobile_surfaces = {};

  if (surface_manifest?.supported_mobile_surfaces?.includes("content_list_surface")) {
    mobile_surfaces.content_list_surface = hooks.build_list_surface({
      domain_manifest,
      surface_manifest,
      shared_projection,
      retained_extras: retained_extras_snapshot,
      diagnostics
    });
  }

  if (surface_manifest?.supported_mobile_surfaces?.includes("content_detail_surface")) {
    mobile_surfaces.content_detail_surface = hooks.build_detail_surface({
      domain_manifest,
      surface_manifest,
      shared_projection,
      retained_extras: retained_extras_snapshot,
      diagnostics
    });
  }

  if (surface_manifest?.supported_mobile_surfaces?.includes("discovery_card_surface")) {
    mobile_surfaces.discovery_card_surface = hooks.build_discovery_card({
      domain_manifest,
      surface_manifest,
      shared_projection,
      retained_extras: retained_extras_snapshot,
      diagnostics
    });
  }

  if (
    surface_manifest?.supported_mobile_surfaces?.includes(inboxPreviewSurfaceShapeName) ||
    surface_manifest?.deferred_surfaces?.includes(inboxPreviewSurfaceShapeName)
  ) {
    mobile_surfaces.inbox_preview_surface = createDeferredInboxPreviewSurface({
      domain_key: domain_manifest?.domain_key,
      notes: ["Step 08 reserves the contract, but actual inbox preview adoption remains deferred."]
    });
  }

  mobile_surfaces[stateSurfaceMapShapeName] = createStateSurfaceMap({
    domain_key: domain_manifest?.domain_key,
    supported_surfaces: surface_manifest?.supported_mobile_surfaces || [],
    deferred_surfaces: surface_manifest?.deferred_surfaces || [],
    state_panel_types: defaultStatePanelTypes,
    default_surface_states: {
      content_list_surface: "placeholder",
      content_detail_surface: "placeholder",
      discovery_card_surface: "placeholder",
      inbox_preview_surface: surface_manifest?.deferred_surfaces?.includes(inboxPreviewSurfaceShapeName)
        ? "deferred"
        : "placeholder"
    }
  });

  return Object.freeze({
    domain_key: domain_manifest?.domain_key ?? null,
    route_type: domain_manifest?.route_type ?? null,
    family_kind: domain_manifest?.family_kind ?? null,
    supported_mobile_surfaces: Object.freeze([...(surface_manifest?.supported_mobile_surfaces || [])]),
    deferred_surfaces: Object.freeze([...(surface_manifest?.deferred_surfaces || [])]),
    surfaces: Object.freeze({ ...mobile_surfaces }),
    diagnostics_summary: summarizeDiagnostics(diagnostics)
  });
}
