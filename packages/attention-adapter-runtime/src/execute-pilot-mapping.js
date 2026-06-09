import { getIntegratedPilotById, getIntegratedRegistryEntryById, integratedPilotRegistry } from "./pilots/index.js";
import { resolveRouteType } from "./resolve-route-type.js";

export function executePilotMapping({ adapter_id, raw_input = {} }) {
  const pilot = getIntegratedPilotById(adapter_id);
  const registry_entry = getIntegratedRegistryEntryById(adapter_id);

  if (!pilot || !registry_entry) {
    throw new Error(`unknown_adapter_id:${adapter_id}`);
  }

  return Object.freeze({
    adapter_id,
    route_type: resolveRouteType(pilot),
    family_kind: pilot.family_kind ?? null,
    source_kind: pilot.source_kind,
    pilot,
    registry_entry,
    registry_entries: integratedPilotRegistry,
    raw_input,
    input_shape_name: pilot.input_shape?.shape_name || null,
    provided_fields: Object.keys(raw_input),
    retained_extras: pilot.retained_extras || []
  });
}
