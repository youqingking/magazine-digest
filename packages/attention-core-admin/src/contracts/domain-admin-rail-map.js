function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

export const domainAdminRailMapShapeName = "domain_admin_rail_map";

export const domainAdminRailMapFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "generated_rails",
  "manual_rails",
  "registry_entries",
  "deferred_rails",
  "planning_status"
]);

export function createDomainAdminRailMap({
  domain_key,
  generated_rails = [],
  manual_rails = [],
  registry_entries = [],
  deferred_rails = [],
  planning_status = "frozen_for_step_08"
} = {}) {
  return Object.freeze({
    surface_type: domainAdminRailMapShapeName,
    domain_key,
    generated_rails: freezeArray(generated_rails),
    manual_rails: freezeArray(manual_rails),
    registry_entries: freezeArray(registry_entries),
    deferred_rails: freezeArray(deferred_rails),
    planning_status
  });
}
