export const mappingDiagnosticsShapeName = "adapter_mapping_diagnostics";

export const mappingDiagnosticsFieldNames = [
  "adapter_id",
  "route_type",
  "source_kind",
  "family_kind",
  "mapped_shared_fields",
  "mapped_family_fields",
  "retained_domain_extras",
  "unmapped_source_fields",
  "unsupported_reason",
  "warnings",
  "notes"
];

export function createMappingDiagnostics(overrides = {}) {
  return Object.freeze({
    adapter_id: "unknown-adapter",
    route_type: "direct",
    source_kind: "unknown_source_kind",
    family_kind: null,
    mapped_shared_fields: [],
    mapped_family_fields: [],
    retained_domain_extras: [],
    unmapped_source_fields: [],
    unsupported_reason: null,
    warnings: [],
    notes: [],
    ...overrides
  });
}
