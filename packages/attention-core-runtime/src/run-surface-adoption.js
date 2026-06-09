import fs from "node:fs";
import path from "node:path";
import { mergeDomainManifests } from "./merge-domain-manifests.js";
import { mergeDomainSurfaceManifests } from "./merge-domain-surface-manifests.js";
import { projectToAdminSurface } from "./project-to-admin-surface.js";
import { projectToMobileSurface } from "./project-to-mobile-surface.js";
import { runDomainAdoption } from "./run-domain-adoption.js";

function readJson(repo_root, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repo_root, relativePath), "utf8"));
}

function freezeObject(record = {}) {
  return Object.freeze({ ...(record || {}) });
}

function pickValues(raw_input = {}, keys = []) {
  return Object.freeze(
    (Array.isArray(keys) ? keys : []).reduce((accumulator, key) => {
      if (key in (raw_input || {})) {
        accumulator[key] = raw_input[key];
      }
      return accumulator;
    }, {})
  );
}

function buildRetainedExtrasSnapshot({ domain_manifest, raw_input = {} } = {}) {
  const adapter_only = pickValues(raw_input, domain_manifest?.retained_extras_keys?.adapter_only_extras || []);
  const domain_only = pickValues(raw_input, domain_manifest?.retained_extras_keys?.domain_only_extras || []);

  return Object.freeze({
    adapter_only,
    domain_only,
    all_keys: Object.freeze([
      ...new Set([...Object.keys(adapter_only || {}), ...Object.keys(domain_only || {})])
    ])
  });
}

function createMissingSurfaceDiagnostics({ domain_key, missing_fields = [] }) {
  return Object.freeze({
    domain_key,
    missing_surface_manifest_fields: Object.freeze([...(missing_fields || [])]),
    unsupported_reason: "missing_surface_manifest_fields"
  });
}

export function runSurfaceAdoption({
  domain_manifests = [],
  surface_manifests = [],
  family_only_reports = [],
  repo_root = process.cwd()
} = {}) {
  const domain_adoption = runDomainAdoption({
    manifests: domain_manifests,
    family_only_reports,
    repo_root
  });
  const merged_domain_manifests = mergeDomainManifests(domain_manifests);
  const merged_surface_manifests = mergeDomainSurfaceManifests(surface_manifests);
  const surface_reports = domain_adoption.domain_reports.map((domain_report) => {
    const domain_key = domain_report?.manifest?.domain_key ?? null;
    const domain_manifest = merged_domain_manifests.by_domain_key[domain_key] || null;
    const loaded_surface_manifest = merged_surface_manifests.manifests.find((entry) => entry.domain_key === domain_key) || {
      domain_key,
      manifest: null,
      missing_fields: ["domain_key"],
      ok: false
    };

    if (!domain_manifest || !loaded_surface_manifest.ok) {
      return Object.freeze({
        domain_key,
        route_type: domain_manifest?.route_type ?? null,
        family_kind: domain_manifest?.family_kind ?? null,
        adoption_status: loaded_surface_manifest?.manifest?.adoption_status ?? "surface_manifest_invalid",
        retained_extras_snapshot: freezeObject({}),
        mobile_surface_projection: null,
        admin_surface_projection: null,
        surface_manifest_diagnostics: createMissingSurfaceDiagnostics({
          domain_key,
          missing_fields: loaded_surface_manifest?.missing_fields || []
        })
      });
    }

    const raw_input = readJson(repo_root, domain_manifest.fixture_paths.input);
    const retained_extras_snapshot = buildRetainedExtrasSnapshot({
      domain_manifest,
      raw_input
    });

    return Object.freeze({
      domain_key,
      route_type: domain_manifest.route_type,
      family_kind: domain_manifest.family_kind,
      adoption_status: loaded_surface_manifest.manifest.adoption_status,
      retained_extras_snapshot,
      mobile_surface_projection: projectToMobileSurface({
        domain_manifest,
        surface_manifest: loaded_surface_manifest.manifest,
        domain_report,
        retained_extras_snapshot
      }),
      admin_surface_projection: projectToAdminSurface({
        domain_manifest,
        surface_manifest: loaded_surface_manifest.manifest,
        domain_report,
        retained_extras_snapshot
      }),
      surface_manifest_diagnostics: Object.freeze({
        domain_key,
        missing_surface_manifest_fields: Object.freeze([]),
        unsupported_reason: null
      })
    });
  });

  return Object.freeze({
    generated_at: new Date().toISOString(),
    step: "shared-step-08",
    domain_reports: Object.freeze(domain_adoption.domain_reports),
    surface_reports: Object.freeze(surface_reports),
    family_only_reports: Object.freeze([...(family_only_reports || [])]),
    coverage: Object.freeze({
      mobile_facing_domains: surface_reports.filter(
        (report) => report.mobile_surface_projection?.surfaces?.content_list_surface
      ).length,
      admin_preview_domains: surface_reports.filter(
        (report) => report.admin_surface_projection?.surfaces?.resource_preview_surface
      ).length,
      family_only_pilots: (family_only_reports || []).filter((report) => report.no_domain_upgrade).length
    }),
    warnings: Object.freeze([
      ...merged_surface_manifests.duplicate_domain_keys.map((domain_key) => `duplicate_surface_manifest_domain_key:${domain_key}`)
    ]),
    manifest_diagnostics: Object.freeze({
      domain_manifest_diagnostics: domain_adoption.manifest_diagnostics,
      surface_manifest_diagnostics: merged_surface_manifests.manifest_diagnostics
    })
  });
}
