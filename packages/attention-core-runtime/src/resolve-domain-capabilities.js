export function resolveDomainCapabilities({ manifest, family_only = false, no_domain_upgrade = false } = {}) {
  const supported = new Set(manifest?.supported_capabilities || []);
  const unsupported = new Set(manifest?.unsupported_capabilities || []);

  return Object.freeze({
    domain_key: manifest?.domain_key ?? null,
    route_type: manifest?.route_type ?? null,
    family_kind: manifest?.family_kind ?? null,
    shared_projection_ready:
      supported.has("shared_projection") && !unsupported.has("shared_projection"),
    retained_extras_ready:
      supported.has("retained_extras") && !unsupported.has("retained_extras"),
    diagnostics_ready: supported.has("diagnostics") && !unsupported.has("diagnostics"),
    stable_manifest_ready: supported.has("stable_manifest") && !unsupported.has("stable_manifest"),
    product_intelligence_deferred: Boolean(manifest?.deferred_product_intelligence?.deferred),
    ui_migration_started: supported.has("ui_migration"),
    ingestion_started: supported.has("ingestion"),
    family_only,
    no_domain_upgrade
  });
}
