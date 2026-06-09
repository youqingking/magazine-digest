import { consumeAdapterRegistry, getRegistryEntryById } from "./registry-consumer.js";
import { resolveAdapterRoute } from "./route-resolver.js";

export function runRouteResolution({
  adapter_id,
  route_type,
  family_kind = null,
  source_kind,
  registry_entry = null,
  registry_entries = []
}) {
  const consumed = consumeAdapterRegistry(registry_entries.length ? registry_entries : registry_entry ? [registry_entry] : []);
  const resolvedEntry = registry_entry || getRegistryEntryById(consumed.entries, adapter_id);

  if (!resolvedEntry) {
    throw new Error(`missing_registry_entry:${adapter_id}`);
  }

  const route_resolution = resolveAdapterRoute({
    adapter_id,
    route_type,
    family_kind,
    source_kind,
    registry_entry: resolvedEntry
  });

  return Object.freeze({
    ...route_resolution,
    registry_summary: {
      entry_count: consumed.entry_count,
      route_coverage: consumed.route_coverage
    }
  });
}
