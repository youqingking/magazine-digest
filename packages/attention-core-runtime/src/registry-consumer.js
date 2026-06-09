export const registryConsumerShapeName = "adapter_registry_consumer";

export function consumeAdapterRegistry(registryEntries = []) {
  const entries = registryEntries.map((entry) => Object.freeze({ ...entry }));
  const byId = Object.freeze(
    entries.reduce((acc, entry) => {
      acc[entry.adapter_id] = entry;
      return acc;
    }, {})
  );

  const route_coverage = entries.reduce(
    (coverage, entry) => {
      if (entry.route_type === "direct" || entry.adapter_route_type === "direct") {
        coverage.direct += 1;
      }
      if (entry.route_type === "family" || entry.adapter_route_type === "family") {
        coverage.family += 1;
      }
      return coverage;
    },
    { direct: 0, family: 0 }
  );

  return Object.freeze({
    entry_count: entries.length,
    entries,
    by_id: byId,
    route_coverage
  });
}

export function getRegistryEntryById(registryEntries = [], adapterId) {
  return registryEntries.find((entry) => entry.adapter_id === adapterId) || null;
}
