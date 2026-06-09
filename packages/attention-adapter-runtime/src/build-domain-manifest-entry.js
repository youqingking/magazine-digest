const requiredManifestFields = Object.freeze([
  "domain_key",
  "route_type",
  "family_kind",
  "adapter_ids",
  "primary_input_shape",
  "primary_shared_projection",
  "retained_extras_keys",
  "diagnostics_entry",
  "supported_capabilities",
  "unsupported_capabilities",
  "deferred_product_intelligence",
  "adoption_status",
  "fixture_paths",
  "report_paths"
]);

function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

function freezeObjectMap(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

export const domainManifestFieldNames = requiredManifestFields;

export function buildDomainManifestEntry(entry = {}) {
  return Object.freeze({
    manifest_version: "0.0.0-step07",
    domain_key: entry.domain_key ?? null,
    route_type: entry.route_type ?? null,
    family_kind: entry.family_kind ?? null,
    adapter_ids: freezeArray(entry.adapter_ids),
    primary_input_shape: entry.primary_input_shape ?? null,
    primary_shared_projection: entry.primary_shared_projection ?? null,
    retained_extras_keys: Object.freeze({
      adapter_only_extras: freezeArray(entry.retained_extras_keys?.adapter_only_extras),
      domain_only_extras: freezeArray(entry.retained_extras_keys?.domain_only_extras)
    }),
    diagnostics_entry: entry.diagnostics_entry ?? null,
    supported_capabilities: freezeArray(entry.supported_capabilities),
    unsupported_capabilities: freezeArray(entry.unsupported_capabilities),
    deferred_product_intelligence: freezeObjectMap(entry.deferred_product_intelligence),
    adoption_status: entry.adoption_status ?? null,
    fixture_paths: freezeObjectMap(entry.fixture_paths),
    report_paths: freezeObjectMap(entry.report_paths),
    runtime_hooks: Object.freeze({
      ...(entry.runtime_hooks || {})
    })
  });
}
