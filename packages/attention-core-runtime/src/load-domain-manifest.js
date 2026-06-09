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

const nullableRequiredFields = new Set(["family_kind"]);

function unwrapManifest(manifestOrModule = {}) {
  if (manifestOrModule && typeof manifestOrModule === "object" && "domainManifest" in manifestOrModule) {
    return manifestOrModule.domainManifest;
  }

  if (manifestOrModule && typeof manifestOrModule === "object" && "default" in manifestOrModule) {
    return manifestOrModule.default;
  }

  return manifestOrModule;
}

export function getMissingDomainManifestFields(manifest = {}) {
  return requiredManifestFields.filter((field) => {
    if (!(field in (manifest || {}))) {
      return true;
    }

    const value = manifest[field];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (nullableRequiredFields.has(field) && value === null) {
      return false;
    }

    return value === undefined || value === null;
  });
}

export const domainManifestRequiredFieldNames = requiredManifestFields;

export function loadDomainManifest({ manifest, expected_domain_key = null } = {}) {
  const loadedManifest = unwrapManifest(manifest) || {};
  const missing_fields = getMissingDomainManifestFields(loadedManifest);
  const domain_key = loadedManifest.domain_key ?? expected_domain_key ?? null;

  return Object.freeze({
    domain_key,
    manifest: Object.freeze({ ...loadedManifest }),
    missing_fields: Object.freeze(missing_fields),
    ok: missing_fields.length === 0
  });
}
