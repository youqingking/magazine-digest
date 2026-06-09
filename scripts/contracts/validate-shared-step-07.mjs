import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-07");
const validationReportPath = path.join(outputDir, "validation-report.json");
const capabilityReportPath = path.join(outputDir, "domain-capability-report.json");
const protectedSnapshotPath = path.join(outputDir, "protected-paths.snapshot.json");

const requiredDocs = [
  "docs/DOMAIN_MANIFEST_SPEC.md",
  "docs/DOMAIN_CAPABILITY_MATRIX.md",
  "docs/STABLE_PROJECTION_RULES.md",
  "docs/RETAINED_EXTRAS_POLICY.md",
  "docs/PROTECTED_PATH_SNAPSHOT_POLICY.md",
  "docs/STAGE_SHARED_STEP07_DECISIONS.md",
  "docs/STEP_07_ACCEPTANCE.md"
];

const requiredFiles = [
  ...requiredDocs,
  "packages/attention-core-runtime/src/load-domain-manifest.js",
  "packages/attention-core-runtime/src/merge-domain-manifests.js",
  "packages/attention-core-runtime/src/resolve-domain-capabilities.js",
  "packages/attention-core-runtime/src/run-domain-adoption.js",
  "packages/attention-adapter-runtime/src/build-domain-manifest-entry.js",
  "packages/attention-adapter-runtime/src/build-retained-extras.js",
  "packages/attention-adapter-runtime/src/build-shared-projection.js",
  "packages/attention-adapter-harness/src/protected-snapshot-report.js",
  "packages/attention-adapter-harness/src/domain-capability-report.js",
  "domains/magazine-domain/src/manifest/domain.manifest.js",
  "domains/magazine-domain/src/projections/project-magazine-shared-envelope.js",
  "domains/magazine-domain/src/projections/build-magazine-retained-extras.js",
  "domains/magazine-domain/src/diagnostics/build-magazine-diagnostics.js",
  "domains/youtube-domain/src/manifest/domain.manifest.js",
  "domains/youtube-domain/src/projections/project-youtube-shared-envelope.js",
  "domains/youtube-domain/src/projections/build-youtube-retained-extras.js",
  "domains/youtube-domain/src/diagnostics/build-youtube-diagnostics.js",
  "domains/podcast-domain/src/manifest/domain.manifest.js",
  "domains/podcast-domain/src/projections/project-podcast-family-shared-envelope.js",
  "domains/podcast-domain/src/projections/build-podcast-retained-extras.js",
  "domains/podcast-domain/src/diagnostics/build-podcast-diagnostics.js",
  "scripts/contracts/validate-shared-step-07.mjs",
  "scripts/contracts/validate-shared-step-07.ps1"
];

const protectedPaths = [
  "docs/SHARED_CANONICAL_MODELS.md",
  "docs/SHARED_ENUMS_AND_KEYS.md",
  "docs/SHARED_PACKAGE_APIS.md",
  "docs/SHARED_MODEL_EXAMPLES.md",
  "docs/SHARED_CHANGE_POLICY.md",
  "docs/SHARED_MIGRATION_WAVES.md",
  "docs/STAGE_SHARED_STEP02_DECISIONS.md",
  "docs/STEP_02_ACCEPTANCE.md",
  "docs/SOURCE_FAMILY_LAYER.md",
  "docs/SOURCE_FAMILY_MODELS.md",
  "docs/SOURCE_FAMILY_ENUMS_AND_KEYS.md",
  "docs/SOURCE_FAMILY_PROMOTION_RULES.md",
  "docs/SOURCE_FAMILY_EXAMPLES.md",
  "docs/SOURCE_FAMILY_COMPATIBILITY.md",
  "docs/STAGE_SHARED_STEP03_DECISIONS.md",
  "docs/STEP_03_ACCEPTANCE.md",
  "docs/ADAPTER_LAYER.md",
  "docs/ADAPTER_ROUTING_RULES.md",
  "docs/ADAPTER_REGISTRY.md",
  "docs/ADAPTER_DIAGNOSTICS.md",
  "docs/PILOT_ADAPTER_SELECTION.md",
  "docs/PILOT_MAPPING_EXAMPLES.md",
  "docs/STAGE_SHARED_STEP04_DECISIONS.md",
  "docs/STEP_04_ACCEPTANCE.md",
  "docs/PILOT_REGISTRY_INTEGRATION.md",
  "docs/ROUTE_RESOLUTION_FLOW.md",
  "docs/DOMAIN_SKELETON_MIGRATION.md",
  "docs/DOMAIN_PILOT_SELECTION.md",
  "docs/PODCAST_DOMAIN_POSITIONING.md",
  "docs/STAGE_SHARED_STEP05_DECISIONS.md",
  "docs/STEP_05_ACCEPTANCE.md",
  "docs/SELECTED_DOMAIN_ADOPTION.md",
  "docs/DOMAIN_PROJECTION_FIXTURES.md",
  "docs/SHARED_RUNTIME_ADOPTION_RULES.md",
  "docs/FAMILY_ONLY_PILOT_HANDLING.md",
  "docs/STAGE_SHARED_STEP06_DECISIONS.md",
  "docs/STEP_06_ACCEPTANCE.md",
  "packages/attention-core-runtime/src/route-resolver.js",
  "packages/attention-core-runtime/src/registry-consumer.js",
  "packages/attention-core-runtime/src/runtime-surface-map.js",
  "packages/attention-core-runtime/src/adopt-pilot-entry.js",
  "packages/attention-core-runtime/src/project-to-shared-envelope.js",
  "packages/attention-core-runtime/src/run-route-resolution.js",
  "packages/attention-family-runtime/src/run-family-normalizer.js",
  "packages/attention-family-runtime/src/normalized-shape-guards.js",
  "packages/attention-family-runtime/src/normalizers/transcript-first-longform.js",
  "packages/attention-family-runtime/src/normalizers/official-structured-sources.js",
  "packages/attention-family-runtime/src/normalizers/index.js",
  "packages/attention-adapter-runtime/src/execute-pilot-mapping.js",
  "packages/attention-adapter-runtime/src/build-pilot-diagnostics.js",
  "packages/attention-adapter-runtime/src/registry-entry-builder.js",
  "packages/attention-adapter-runtime/src/resolve-route-type.js",
  "packages/attention-adapter-runtime/src/pilots/index.js",
  "packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js",
  "packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js",
  "packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js",
  "packages/attention-adapter-runtime/src/pilots/family-sec-filing.js",
  "packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js",
  "packages/attention-adapter-harness/src/pilot-registry-report.js",
  "packages/attention-adapter-harness/src/route-resolution-report.js",
  "packages/attention-adapter-harness/src/adoption-report-shape.js",
  "packages/attention-adapter-harness/src/domain-pilot-report-shape.js",
  "domains/magazine-domain/src/adoption/project-direct-magazine-summary.js",
  "domains/magazine-domain/src/adoption/run-direct-magazine-summary.js",
  "domains/magazine-domain/fixtures/direct-magazine-summary.input.json",
  "domains/magazine-domain/fixtures/direct-magazine-summary.shared.json",
  "domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json",
  "domains/youtube-domain/src/adoption/project-direct-youtube-summary.js",
  "domains/youtube-domain/src/adoption/run-direct-youtube-summary.js",
  "domains/youtube-domain/fixtures/direct-youtube-summary.input.json",
  "domains/youtube-domain/fixtures/direct-youtube-summary.shared.json",
  "domains/youtube-domain/fixtures/direct-youtube-summary.diagnostics.json",
  "domains/podcast-domain/src/adoption/project-family-podcast-transcript.js",
  "domains/podcast-domain/src/adoption/run-family-podcast-transcript.js",
  "domains/podcast-domain/fixtures/family-podcast-transcript.input.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.family.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.shared.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.diagnostics.json",
  "scripts/contracts/validate-shared-step-02.mjs",
  "scripts/contracts/validate-shared-step-02.ps1",
  "scripts/contracts/validate-shared-step-03.mjs",
  "scripts/contracts/validate-shared-step-03.ps1",
  "scripts/contracts/validate-shared-step-04.mjs",
  "scripts/contracts/validate-shared-step-04.ps1",
  "scripts/contracts/validate-shared-step-05.mjs",
  "scripts/contracts/validate-shared-step-05.ps1",
  "scripts/contracts/validate-shared-step-06.mjs",
  "scripts/contracts/validate-shared-step-06.ps1"
];

const podcastOutOfScopeTerms = [
  "60s summary",
  "3min structured brief",
  "worth-listening signal",
  "cross-episode compare",
  "topic tracking",
  "Chinese restructuring",
  "reusable quote intelligence"
];

const step07CodeFiles = [
  "packages/attention-core-runtime/src/load-domain-manifest.js",
  "packages/attention-core-runtime/src/merge-domain-manifests.js",
  "packages/attention-core-runtime/src/resolve-domain-capabilities.js",
  "packages/attention-core-runtime/src/run-domain-adoption.js",
  "packages/attention-adapter-runtime/src/build-domain-manifest-entry.js",
  "packages/attention-adapter-runtime/src/build-retained-extras.js",
  "packages/attention-adapter-runtime/src/build-shared-projection.js",
  "domains/magazine-domain/src/manifest/domain.manifest.js",
  "domains/magazine-domain/src/projections/project-magazine-shared-envelope.js",
  "domains/magazine-domain/src/projections/build-magazine-retained-extras.js",
  "domains/magazine-domain/src/diagnostics/build-magazine-diagnostics.js",
  "domains/youtube-domain/src/manifest/domain.manifest.js",
  "domains/youtube-domain/src/projections/project-youtube-shared-envelope.js",
  "domains/youtube-domain/src/projections/build-youtube-retained-extras.js",
  "domains/youtube-domain/src/diagnostics/build-youtube-diagnostics.js",
  "domains/podcast-domain/src/manifest/domain.manifest.js",
  "domains/podcast-domain/src/projections/project-podcast-family-shared-envelope.js",
  "domains/podcast-domain/src/projections/build-podcast-retained-extras.js",
  "domains/podcast-domain/src/diagnostics/build-podcast-diagnostics.js"
];

const checks = [];
const errors = [];
const warnings = [];

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(repoPath(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) {
    errors.push(`${name}:${detail}`);
  }
}

function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

async function importModule(relativePath) {
  return import(pathToFileURL(repoPath(relativePath)).href);
}

async function main() {
  ensureOutputDir();

  for (const file of requiredFiles) {
    addCheck(`exists:${file}`, exists(file), "missing required Step 07 file");
  }

  const manifestDoc = exists("docs/DOMAIN_MANIFEST_SPEC.md") ? read("docs/DOMAIN_MANIFEST_SPEC.md") : "";
  const matrixDoc = exists("docs/DOMAIN_CAPABILITY_MATRIX.md") ? read("docs/DOMAIN_CAPABILITY_MATRIX.md") : "";
  const projectionDoc = exists("docs/STABLE_PROJECTION_RULES.md") ? read("docs/STABLE_PROJECTION_RULES.md") : "";
  const extrasDoc = exists("docs/RETAINED_EXTRAS_POLICY.md") ? read("docs/RETAINED_EXTRAS_POLICY.md") : "";
  const snapshotDoc = exists("docs/PROTECTED_PATH_SNAPSHOT_POLICY.md") ? read("docs/PROTECTED_PATH_SNAPSHOT_POLICY.md") : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP07_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP07_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_07_ACCEPTANCE.md") ? read("docs/STEP_07_ACCEPTANCE.md") : "";

  addCheck(
    "docs:manifest-spec",
    manifestDoc.includes("stable domain contract") &&
      manifestDoc.includes("package public APIs") &&
      manifestDoc.includes("route_type = family") &&
      manifestDoc.includes("transcript_first_longform") &&
      manifestDoc.includes("route_type = direct"),
    "manifest spec missing stable contract or route freeze"
  );
  addCheck(
    "docs:capability-matrix",
    matrixDoc.includes("`magazine`") &&
      matrixDoc.includes("`youtube`") &&
      matrixDoc.includes("`podcast`") &&
      matrixDoc.includes("no_domain_upgrade = true"),
    "capability matrix missing selected domains or SEC handling"
  );
  addCheck(
    "docs:stable-projection-rules",
    projectionDoc.includes("input -> shared projection") &&
      projectionDoc.includes("retained extras") &&
      projectionDoc.includes("diagnostics"),
    "stable projection rules missing stable module scope"
  );
  addCheck(
    "docs:retained-extras-policy",
    extrasDoc.includes("adapter_only_extras") &&
      extrasDoc.includes("domain_only_extras") &&
      extrasDoc.includes("not") &&
      extrasDoc.includes("shared canonical models"),
    "retained extras policy missing grouping or shared-core guardrail"
  );
  addCheck(
    "docs:protected-snapshot-policy",
    snapshotDoc.includes("content-hash snapshot") &&
      snapshotDoc.includes("baseline snapshot generated") &&
      snapshotDoc.includes("protected-paths.snapshot.json"),
    "protected snapshot policy missing hash snapshot baseline rule"
  );
  addCheck(
    "docs:step07-decisions",
    decisionsDoc.includes("manifest-driven adoption") &&
      decisionsDoc.includes("Step 07 does not do") &&
      decisionsDoc.includes("SEC promotion into a product domain"),
    "Step 07 decisions doc missing adoption or non-goal boundary"
  );
  addCheck(
    "docs:step07-acceptance",
    acceptanceDoc.includes("Step 02 shared core is unchanged") &&
      acceptanceDoc.includes("Step 06 first adoption boundaries are not overturned") &&
      acceptanceDoc.includes("validate-shared-step-07.mjs"),
    "acceptance doc missing frozen-boundary or validation command"
  );

  for (const term of podcastOutOfScopeTerms) {
    addCheck(
      `docs:podcast-out-of-scope:${term}`,
      projectionDoc.includes(`\`${term}\``) && decisionsDoc.includes(`\`${term}\``),
      `Step 07 docs must explicitly keep ${term} out of scope`
    );
  }

  const coreLoadModule = await importModule("packages/attention-core-runtime/src/load-domain-manifest.js");
  const coreMergeModule = await importModule("packages/attention-core-runtime/src/merge-domain-manifests.js");
  const coreCapabilityModule = await importModule("packages/attention-core-runtime/src/resolve-domain-capabilities.js");
  const coreAdoptionModule = await importModule("packages/attention-core-runtime/src/run-domain-adoption.js");
  const adapterManifestModule = await importModule("packages/attention-adapter-runtime/src/build-domain-manifest-entry.js");
  const adapterExtrasModule = await importModule("packages/attention-adapter-runtime/src/build-retained-extras.js");
  const adapterProjectionModule = await importModule("packages/attention-adapter-runtime/src/build-shared-projection.js");
  const snapshotReportModule = await importModule("packages/attention-adapter-harness/src/protected-snapshot-report.js");
  const capabilityReportModule = await importModule("packages/attention-adapter-harness/src/domain-capability-report.js");
  const secPilotModule = await importModule("packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js");

  const magazineManifestModule = await importModule("domains/magazine-domain/src/manifest/domain.manifest.js");
  const youtubeManifestModule = await importModule("domains/youtube-domain/src/manifest/domain.manifest.js");
  const podcastManifestModule = await importModule("domains/podcast-domain/src/manifest/domain.manifest.js");

  addCheck(
    "runtime:core-step07-exports",
    typeof coreLoadModule.loadDomainManifest === "function" &&
      typeof coreMergeModule.mergeDomainManifests === "function" &&
      typeof coreCapabilityModule.resolveDomainCapabilities === "function" &&
      typeof coreAdoptionModule.runDomainAdoption === "function",
    "missing Step 07 core runtime exports"
  );
  addCheck(
    "runtime:adapter-step07-exports",
    typeof adapterManifestModule.buildDomainManifestEntry === "function" &&
      typeof adapterExtrasModule.buildRetainedExtras === "function" &&
      typeof adapterProjectionModule.buildSharedProjection === "function",
    "missing Step 07 adapter runtime exports"
  );
  addCheck(
    "runtime:harness-step07-exports",
    typeof snapshotReportModule.buildProtectedSnapshotReport === "function" &&
      typeof capabilityReportModule.createDomainCapabilityReport === "function",
    "missing Step 07 harness exports"
  );

  const manifests = [
    magazineManifestModule.domainManifest,
    youtubeManifestModule.domainManifest,
    podcastManifestModule.domainManifest
  ];
  const loadedManifests = manifests.map((manifest) => coreLoadModule.loadDomainManifest({ manifest }));

  for (const loadedManifest of loadedManifests) {
    addCheck(
      `manifest:complete:${loadedManifest.domain_key}`,
      loadedManifest.ok,
      loadedManifest.ok ? "manifest complete" : loadedManifest.missing_fields.join(", ")
    );
  }

  const mergedManifests = coreMergeModule.mergeDomainManifests(manifests);
  addCheck(
    "manifest:no-duplicates",
    mergedManifests.duplicate_domain_keys.length === 0,
    mergedManifests.duplicate_domain_keys.length ? mergedManifests.duplicate_domain_keys.join(", ") : "no duplicates"
  );

  addCheck(
    "manifest:route-freeze:magazine",
    magazineManifestModule.domainManifest.route_type === "direct" && magazineManifestModule.domainManifest.family_kind === null,
    "magazine manifest must remain direct"
  );
  addCheck(
    "manifest:route-freeze:youtube",
    youtubeManifestModule.domainManifest.route_type === "direct" && youtubeManifestModule.domainManifest.family_kind === null,
    "youtube manifest must remain direct"
  );
  addCheck(
    "manifest:route-freeze:podcast",
    podcastManifestModule.domainManifest.route_type === "family" &&
      podcastManifestModule.domainManifest.family_kind === "transcript_first_longform",
    "podcast manifest must remain transcript-family-backed"
  );

  const invalidAdoption = coreAdoptionModule.runDomainAdoption({
    manifests: [{ domain_key: "broken" }],
    repo_root: repoRoot
  });
  addCheck(
    "manifest:missing-field-diagnostics",
    invalidAdoption.domain_reports[0]?.diagnostics_fixture?.unsupported_reason === "missing_manifest_fields" &&
      invalidAdoption.domain_reports[0]?.diagnostics_fixture?.notes?.[0]?.startsWith("missing_manifest_fields:"),
    "missing manifest fields must produce explicit diagnostics"
  );

  const secReport = secPilotModule.runFamilySecFiling();
  const adoptionReport = coreAdoptionModule.runDomainAdoption({
    manifests,
    family_only_reports: [secReport],
    repo_root: repoRoot
  });
  const byDomainKey = Object.fromEntries(
    adoptionReport.domain_reports.map((report) => [report.manifest?.domain_key, report])
  );

  const magazineExpectedShared = readJson("domains/magazine-domain/fixtures/direct-magazine-summary.shared.json");
  const magazineExpectedDiagnostics = readJson("domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json");
  const youtubeExpectedShared = readJson("domains/youtube-domain/fixtures/direct-youtube-summary.shared.json");
  const youtubeExpectedDiagnostics = readJson("domains/youtube-domain/fixtures/direct-youtube-summary.diagnostics.json");
  const podcastExpectedFamily = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.family.json");
  const podcastExpectedShared = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.shared.json");
  const podcastExpectedDiagnostics = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.diagnostics.json");

  addCheck(
    "stable-projection:magazine-shared",
    sameJson(byDomainKey.magazine.shared_projection_fixture, magazineExpectedShared),
    "magazine stable shared projection mismatch"
  );
  addCheck(
    "stable-projection:magazine-diagnostics",
    sameJson(byDomainKey.magazine.diagnostics_fixture, magazineExpectedDiagnostics),
    "magazine stable diagnostics mismatch"
  );
  addCheck(
    "stable-projection:youtube-shared",
    sameJson(byDomainKey.youtube.shared_projection_fixture, youtubeExpectedShared),
    "youtube stable shared projection mismatch"
  );
  addCheck(
    "stable-projection:youtube-diagnostics",
    sameJson(byDomainKey.youtube.diagnostics_fixture, youtubeExpectedDiagnostics),
    "youtube stable diagnostics mismatch"
  );
  addCheck(
    "stable-projection:podcast-family",
    sameJson(byDomainKey.podcast.family_normalized_fixture, podcastExpectedFamily),
    "podcast stable family fixture mismatch"
  );
  addCheck(
    "stable-projection:podcast-shared",
    sameJson(byDomainKey.podcast.shared_projection_fixture, podcastExpectedShared),
    "podcast stable shared projection mismatch"
  );
  addCheck(
    "stable-projection:podcast-diagnostics",
    sameJson(byDomainKey.podcast.diagnostics_fixture, podcastExpectedDiagnostics),
    "podcast stable diagnostics mismatch"
  );

  addCheck(
    "sec:family-only-pilot",
    secReport.no_domain_upgrade === true &&
      secReport.route_type === "family" &&
      secReport.family_kind === "official_structured_sources",
    "SEC must remain a family-only pilot"
  );
  addCheck("sec:no-domain-upgrade", !exists("domains/sec-domain/package.json"), "SEC must not become a product domain");

  const capabilityReport = capabilityReportModule.createDomainCapabilityReport({
    manifests,
    family_only_pilots: [secReport]
  });
  writeJson(capabilityReportPath, capabilityReport);

  addCheck(
    "coverage:direct-domains",
    capabilityReport.coverage.direct_domains >= 2,
    "direct domains must be >= 2"
  );
  addCheck(
    "coverage:family-backed-domains",
    capabilityReport.coverage.family_backed_domains >= 1,
    "family-backed domains must be >= 1"
  );
  addCheck(
    "coverage:family-only-pilots",
    capabilityReport.coverage.family_only_pilots >= 1,
    "family-only pilots must be >= 1"
  );

  const protectedSnapshotReport = snapshotReportModule.buildProtectedSnapshotReport({
    repo_root: repoRoot,
    protected_paths: protectedPaths,
    snapshot_path: "output/shared-step-07/protected-paths.snapshot.json"
  });

  addCheck(
    "protected:paths-exist",
    protectedSnapshotReport.missing_paths.length === 0,
    protectedSnapshotReport.missing_paths.length ? protectedSnapshotReport.missing_paths.join(", ") : "all protected paths exist"
  );
  addCheck(
    "protected:hash-match",
    protectedSnapshotReport.hash_mismatches.length === 0,
    protectedSnapshotReport.hash_mismatches.length ? protectedSnapshotReport.hash_mismatches.join(", ") : "all protected hashes match snapshot"
  );
  addCheck(
    "protected:snapshot-generated",
    fs.existsSync(protectedSnapshotPath),
    "protected snapshot must be generated"
  );
  if (protectedSnapshotReport.baseline_snapshot_generated) {
    warnings.push("protected_snapshot_baseline_generated:Step 07 created the initial protected-path hash baseline.");
  }

  for (const file of step07CodeFiles) {
    const text = read(file);
    addCheck(
      `boundary:no-page-migration:${file}`,
      !/uniCloud|pages\/|router\b|createPage|onLoad|onShow|searchLogic|businessLogic/i.test(text),
      "Step 07 code drifted into page or business migration"
    );

    const normalized = text.toLowerCase();
    for (const term of podcastOutOfScopeTerms) {
      addCheck(
        `podcast-intelligence:not-in-step07-code:${file}:${term}`,
        !normalized.includes(term.toLowerCase()),
        `out-of-scope podcast intelligence leaked into Step 07 code: ${term}`
      );
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? "ok" : "failed",
    step: "shared-step-07",
    checked_docs: requiredDocs.length,
    checked_files: requiredFiles.length,
    checked_domains: manifests.length,
    coverage: capabilityReport.coverage,
    protected_snapshot: {
      mode: protectedSnapshotReport.mode,
      baseline_snapshot_generated: protectedSnapshotReport.baseline_snapshot_generated,
      path: "output/shared-step-07/protected-paths.snapshot.json"
    },
    checks,
    warnings,
    errors
  };

  writeJson(validationReportPath, report);
  console.log(JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  ensureOutputDir();
  const report = {
    timestamp: new Date().toISOString(),
    status: "failed",
    step: "shared-step-07",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  writeJson(validationReportPath, report);
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
