import { mappingDiagnosticsShapeName } from "./contracts/mapping-diagnostics.js";
import { resolveRouteType } from "./resolve-route-type.js";

export function buildPilotRegistryEntry(pilot) {
  const route_type = resolveRouteType(pilot);
  return Object.freeze({
    adapter_id: pilot.adapter_id,
    route_type,
    adapter_route_type: route_type,
    source_kind: pilot.source_kind,
    family_kind: pilot.family_kind ?? null,
    input_shape_name: pilot.input_shape?.shape_name || null,
    output_shape_name: pilot.shared_outputs?.output_shape_name || null,
    diagnostics_shape_name: mappingDiagnosticsShapeName,
    supported_capabilities:
      route_type === "family"
        ? ["family_normalization", "shared_projection", "mapping_diagnostics"]
        : ["shared_projection", "mapping_diagnostics"],
    status: "pilot",
    retained_extras: pilot.retained_extras || [],
    shared_output_models: pilot.shared_outputs?.models || []
  });
}

export function buildPilotRegistryEntries(pilots = []) {
  return pilots.map((pilot) => buildPilotRegistryEntry(pilot));
}
