export const domainPilotReportShapeName = "domain_pilot_report";

export const domainPilotReportFieldNames = [
  "domain_name",
  "adapter_id",
  "route_type",
  "family_kind",
  "selected_path",
  "family_normalized_fixture",
  "shared_projection_fixture",
  "diagnostics_fixture",
  "retained_extras",
  "warnings",
  "no_domain_upgrade"
];

export function createDomainPilotReport({
  domain_name,
  adapter_id,
  route_type,
  family_kind = null,
  selected_path,
  family_normalized_fixture = null,
  shared_projection_fixture,
  diagnostics_fixture,
  retained_extras = { adapter_only: [], domain_only: [] },
  warnings = [],
  no_domain_upgrade = false
}) {
  return Object.freeze({
    domain_name,
    adapter_id,
    route_type,
    family_kind,
    selected_path,
    family_normalized_fixture,
    shared_projection_fixture,
    diagnostics_fixture,
    retained_extras,
    warnings,
    no_domain_upgrade
  });
}
