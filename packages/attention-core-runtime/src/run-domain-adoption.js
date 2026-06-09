import fs from "node:fs";
import path from "node:path";
import { executePilotMapping } from "../../attention-adapter-runtime/src/execute-pilot-mapping.js";
import { runFamilyNormalizer } from "../../attention-family-runtime/src/run-family-normalizer.js";
import { createDomainPilotReport } from "../../attention-adapter-harness/src/domain-pilot-report-shape.js";
import { loadDomainManifest } from "./load-domain-manifest.js";
import { mergeDomainManifests } from "./merge-domain-manifests.js";
import { runRouteResolution } from "./run-route-resolution.js";

function readJson(repo_root, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repo_root, relativePath), "utf8"));
}

function createManifestDiagnostics({ manifest, missing_fields = [], warnings = [] }) {
  return Object.freeze({
    adapter_id: manifest?.adapter_ids?.[0] ?? null,
    route_type: manifest?.route_type ?? null,
    source_kind: null,
    family_kind: manifest?.family_kind ?? null,
    mapped_shared_fields: [],
    mapped_family_fields: [],
    retained_domain_extras: [],
    unmapped_source_fields: [],
    unsupported_reason: "missing_manifest_fields",
    warnings: Object.freeze([...warnings]),
    notes: Object.freeze([`missing_manifest_fields:${missing_fields.join(",")}`])
  });
}

function runSingleDomainAdoption({ loaded_manifest, repo_root }) {
  const { manifest, missing_fields } = loaded_manifest;

  if (missing_fields.length > 0) {
    return Object.freeze({
      manifest: Object.freeze({
        domain_key: loaded_manifest.domain_key,
        adoption_status: manifest?.adoption_status ?? "manifest_invalid"
      }),
      ...createDomainPilotReport({
        domain_name: `${loaded_manifest.domain_key || "unknown"}-domain`,
        adapter_id: manifest?.adapter_ids?.[0] ?? null,
        route_type: manifest?.route_type ?? null,
        family_kind: manifest?.family_kind ?? null,
        selected_path: [],
        family_normalized_fixture: null,
        shared_projection_fixture: null,
        diagnostics_fixture: createManifestDiagnostics({
          manifest,
          missing_fields,
          warnings: ["manifest_driven_adoption_requires_all_required_fields"]
        }),
        retained_extras: { adapter_only: [], domain_only: [] },
        warnings: ["manifest_invalid"],
        no_domain_upgrade: false
      })
    });
  }

  const raw_input = readJson(repo_root, manifest.fixture_paths.input);
  const mapping_execution = executePilotMapping({
    adapter_id: manifest.adapter_ids[0],
    raw_input
  });

  const route_resolution = runRouteResolution({
    adapter_id: mapping_execution.adapter_id,
    route_type: manifest.route_type,
    family_kind: manifest.family_kind,
    source_kind: mapping_execution.source_kind,
    registry_entry: mapping_execution.registry_entry,
    registry_entries: mapping_execution.registry_entries
  });

  const family_execution =
    manifest.route_type === "family"
      ? runFamilyNormalizer({
          family_kind: manifest.family_kind,
          raw_input
        })
      : null;

  const retained_extras = manifest.runtime_hooks.build_retained_extras({
    manifest,
    raw_input,
    mapping_execution,
    route_resolution,
    family_execution
  });
  const shared_projection = manifest.runtime_hooks.project_shared_envelope({
    manifest,
    raw_input,
    mapping_execution,
    route_resolution,
    family_execution,
    retained_extras
  });
  const diagnostics = manifest.runtime_hooks.build_diagnostics({
    manifest,
    raw_input,
    mapping_execution,
    route_resolution,
    family_execution,
    retained_extras,
    shared_projection
  });

  return Object.freeze({
    manifest: Object.freeze({
      domain_key: manifest.domain_key,
      route_type: manifest.route_type,
      family_kind: manifest.family_kind,
      primary_shared_projection: manifest.primary_shared_projection,
      adoption_status: manifest.adoption_status
    }),
    ...createDomainPilotReport({
      domain_name: `${manifest.domain_key}-domain`,
      adapter_id: mapping_execution.adapter_id,
      route_type: manifest.route_type,
      family_kind: manifest.family_kind,
      selected_path: route_resolution.resolved_path,
      family_normalized_fixture: family_execution?.normalized_shape ?? null,
      shared_projection_fixture: shared_projection,
      diagnostics_fixture: diagnostics,
      retained_extras,
      warnings: diagnostics.warnings || [],
      no_domain_upgrade: false
    })
  });
}

export function runDomainAdoption({ manifests = [], family_only_reports = [], repo_root = process.cwd() } = {}) {
  const merged = mergeDomainManifests(manifests);
  const warnings = [
    ...merged.duplicate_domain_keys.map((domain_key) => `duplicate_manifest_domain_key:${domain_key}`)
  ];
  const domain_reports = merged.manifests.map((loaded_manifest) =>
    runSingleDomainAdoption({
      loaded_manifest,
      repo_root
    })
  );

  return Object.freeze({
    generated_at: new Date().toISOString(),
    step: "shared-step-07",
    domain_reports: Object.freeze(domain_reports),
    family_only_reports: Object.freeze([...(family_only_reports || [])]),
    coverage: Object.freeze({
      direct_domains: domain_reports.filter((report) => report.route_type === "direct").length,
      family_backed_domains: domain_reports.filter((report) => report.route_type === "family").length,
      family_only_pilots: (family_only_reports || []).filter((report) => report.no_domain_upgrade).length
    }),
    warnings: Object.freeze(warnings),
    manifest_diagnostics: merged.manifest_diagnostics
  });
}
