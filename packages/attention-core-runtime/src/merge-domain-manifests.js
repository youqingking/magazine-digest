import { loadDomainManifest } from "./load-domain-manifest.js";

export function mergeDomainManifests(manifests = []) {
  const loaded = manifests.map((manifest) => loadDomainManifest({ manifest }));
  const duplicate_domain_keys = [];
  const by_domain_key = {};

  for (const entry of loaded) {
    if (!entry.domain_key) {
      continue;
    }

    if (by_domain_key[entry.domain_key]) {
      duplicate_domain_keys.push(entry.domain_key);
      continue;
    }

    by_domain_key[entry.domain_key] = entry.manifest;
  }

  return Object.freeze({
    manifests: Object.freeze(loaded),
    by_domain_key: Object.freeze({ ...by_domain_key }),
    duplicate_domain_keys: Object.freeze([...new Set(duplicate_domain_keys)]),
    manifest_diagnostics: Object.freeze(
      loaded.map((entry) =>
        Object.freeze({
          domain_key: entry.domain_key,
          ok: entry.ok,
          missing_fields: entry.missing_fields
        })
      )
    )
  });
}
