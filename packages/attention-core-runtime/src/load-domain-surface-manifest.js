const requiredSurfaceManifestFields = Object.freeze([
  "domain_key",
  "route_type",
  "family_kind",
  "list_surface_builder",
  "detail_surface_builder",
  "discovery_card_builder",
  "admin_preview_builder",
  "supported_mobile_surfaces",
  "supported_admin_surfaces",
  "deferred_surfaces",
  "retained_extras_visibility_rules",
  "diagnostics_entry",
  "adoption_status"
]);

const nullableRequiredFields = new Set(["family_kind"]);

function unwrapSurfaceManifest(manifestOrModule = {}) {
  if (manifestOrModule && typeof manifestOrModule === "object" && "domainSurfaceManifest" in manifestOrModule) {
    return manifestOrModule.domainSurfaceManifest;
  }

  if (manifestOrModule && typeof manifestOrModule === "object" && "default" in manifestOrModule) {
    return manifestOrModule.default;
  }

  return manifestOrModule;
}

export function getMissingDomainSurfaceManifestFields(manifest = {}) {
  return requiredSurfaceManifestFields.filter((field) => {
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

export const domainSurfaceManifestRequiredFieldNames = requiredSurfaceManifestFields;

export function loadDomainSurfaceManifest({ manifest, expected_domain_key = null } = {}) {
  const loadedManifest = unwrapSurfaceManifest(manifest) || {};
  const missing_fields = getMissingDomainSurfaceManifestFields(loadedManifest);
  const domain_key = loadedManifest.domain_key ?? expected_domain_key ?? null;

  return Object.freeze({
    domain_key,
    manifest: Object.freeze({ ...loadedManifest }),
    missing_fields: Object.freeze(missing_fields),
    ok: missing_fields.length === 0
  });
}
