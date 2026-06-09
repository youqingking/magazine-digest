import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-05");
const reportPath = path.join(outputDir, "validation-report.json");

const requiredDocs = [
  "docs/PILOT_REGISTRY_INTEGRATION.md",
  "docs/ROUTE_RESOLUTION_FLOW.md",
  "docs/DOMAIN_SKELETON_MIGRATION.md",
  "docs/DOMAIN_PILOT_SELECTION.md",
  "docs/PODCAST_DOMAIN_POSITIONING.md",
  "docs/STAGE_SHARED_STEP05_DECISIONS.md",
  "docs/STEP_05_ACCEPTANCE.md"
];

const requiredFiles = [
  ...requiredDocs,
  "packages/attention-core-runtime/src/route-resolver.js",
  "packages/attention-core-runtime/src/registry-consumer.js",
  "packages/attention-core-runtime/src/runtime-surface-map.js",
  "packages/attention-family-runtime/src/normalizers/transcript-first-longform.js",
  "packages/attention-family-runtime/src/normalizers/official-structured-sources.js",
  "packages/attention-family-runtime/src/normalizers/index.js",
  "packages/attention-adapter-runtime/src/pilots/index.js",
  "packages/attention-adapter-runtime/src/registry-entry-builder.js",
  "packages/attention-adapter-runtime/src/resolve-route-type.js",
  "packages/attention-adapter-harness/src/pilot-registry-report.js",
  "packages/attention-adapter-harness/src/route-resolution-report.js",
  "domains/magazine-domain/package.json",
  "domains/magazine-domain/README.md",
  "domains/magazine-domain/src/index.js",
  "domains/magazine-domain/src/pilots/direct-magazine-summary-entry.js",
  "domains/magazine-domain/src/pilots/direct-magazine-summary-mapper.js",
  "domains/magazine-domain/src/pilots/direct-magazine-summary-diagnostics.js",
  "domains/youtube-domain/package.json",
  "domains/youtube-domain/README.md",
  "domains/youtube-domain/src/index.js",
  "domains/youtube-domain/src/pilots/direct-youtube-summary-entry.js",
  "domains/youtube-domain/src/pilots/direct-youtube-summary-mapper.js",
  "domains/youtube-domain/src/pilots/direct-youtube-summary-diagnostics.js",
  "domains/podcast-domain/package.json",
  "domains/podcast-domain/README.md",
  "domains/podcast-domain/src/index.js",
  "domains/podcast-domain/src/pilots/family-podcast-transcript-entry.js",
  "domains/podcast-domain/src/pilots/family-podcast-transcript-mapper.js",
  "domains/podcast-domain/src/pilots/family-podcast-transcript-diagnostics.js",
  "scripts/contracts/validate-shared-step-05.mjs",
  "scripts/contracts/validate-shared-step-05.ps1"
];

const protectedTrackedFiles = [
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
  "packages/attention-core-contracts/package.json",
  "packages/attention-core-contracts/README.md",
  "packages/attention-core-contracts/src/index.js",
  "packages/attention-core-runtime/package.json",
  "packages/attention-core-runtime/README.md",
  "packages/attention-core-runtime/src/index.js",
  "packages/attention-family-contracts/package.json",
  "packages/attention-family-contracts/README.md",
  "packages/attention-family-contracts/src/index.js",
  "packages/attention-family-runtime/package.json",
  "packages/attention-family-runtime/README.md",
  "packages/attention-family-runtime/src/index.js",
  "packages/attention-adapter-runtime/package.json",
  "packages/attention-adapter-runtime/README.md",
  "packages/attention-adapter-runtime/src/index.js",
  "packages/attention-adapter-runtime/src/registry.js",
  "packages/attention-adapter-runtime/src/contracts/direct-route.js",
  "packages/attention-adapter-runtime/src/contracts/family-route.js",
  "packages/attention-adapter-runtime/src/contracts/mapping-diagnostics.js",
  "packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js",
  "packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js",
  "packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js",
  "packages/attention-adapter-runtime/src/pilots/family-sec-filing.js",
  "packages/attention-adapter-harness/package.json",
  "packages/attention-adapter-harness/README.md",
  "packages/attention-adapter-harness/src/index.js",
  "packages/attention-adapter-harness/src/adapter-report-shape.js",
  "scripts/contracts/validate-shared-step-02.mjs",
  "scripts/contracts/validate-shared-step-02.ps1",
  "scripts/contracts/validate-shared-step-03.mjs",
  "scripts/contracts/validate-shared-step-03.ps1",
  "scripts/contracts/validate-shared-step-04.mjs",
  "scripts/contracts/validate-shared-step-04.ps1"
];

const requiredPilotIds = [
  "direct-magazine-summary",
  "direct-youtube-summary",
  "family-podcast-transcript",
  "family-sec-filing"
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

const checks = [];
const errors = [];
const warnings = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) {
    errors.push(`${name}:${detail}`);
  }
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

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function isTracked(relativePath) {
  try {
    execSync(`git ls-files --error-unmatch "${relativePath}"`, { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function changedProtectedTrackedFiles() {
  const output = execSync("git diff --name-only -- docs packages scripts domains", {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
  const changed = output ? output.split(/\r?\n/).filter(Boolean) : [];
  return changed.filter((file) => protectedTrackedFiles.includes(file) && isTracked(file));
}

async function main() {
  ensureOutputDir();

  for (const file of requiredFiles) {
    addCheck(`exists:${file}`, exists(file), "missing required Step 05 file");
  }

  const protectedChanges = changedProtectedTrackedFiles();
  addCheck(
    "protected-files-unchanged",
    protectedChanges.length === 0,
    protectedChanges.length ? protectedChanges.join(", ") : "no tracked protected files changed"
  );

  const step04ProtectedTracked = protectedTrackedFiles
    .filter((file) => file.includes("ADAPTER_") || file.includes("STEP_04") || file.includes("attention-adapter") || file.includes("validate-shared-step-04"))
    .filter(isTracked);
  if (step04ProtectedTracked.length === 0) {
    warnings.push("step04_protected_files_untracked:Step 04 files are present locally but not tracked, so immutability is validated by non-touch policy rather than git diff.");
  }

  const integrationDoc = exists("docs/PILOT_REGISTRY_INTEGRATION.md") ? read("docs/PILOT_REGISTRY_INTEGRATION.md") : "";
  const routeFlowDoc = exists("docs/ROUTE_RESOLUTION_FLOW.md") ? read("docs/ROUTE_RESOLUTION_FLOW.md") : "";
  const domainMigrationDoc = exists("docs/DOMAIN_SKELETON_MIGRATION.md") ? read("docs/DOMAIN_SKELETON_MIGRATION.md") : "";
  const podcastPositionDoc = exists("docs/PODCAST_DOMAIN_POSITIONING.md") ? read("docs/PODCAST_DOMAIN_POSITIONING.md") : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP05_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP05_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_05_ACCEPTANCE.md") ? read("docs/STEP_05_ACCEPTANCE.md") : "";

  addCheck(
    "docs:integration-roles",
    integrationDoc.includes("Shared core does not directly know source-specific raw shapes") &&
      integrationDoc.includes("Adapter runtime owns") &&
      integrationDoc.includes("Core runtime owns"),
    "integration doc missing frozen responsibility split"
  );
  addCheck(
    "docs:route-flow",
    routeFlowDoc.includes("resolved_path") &&
      routeFlowDoc.includes("expected_intermediate_shape") &&
      routeFlowDoc.includes("expected_shared_projection") &&
      routeFlowDoc.includes("diagnostics_hooks"),
    "route resolution flow doc missing resolver outputs"
  );
  addCheck(
    "docs:domain-migration",
    domainMigrationDoc.includes("podcast") && domainMigrationDoc.includes("SEC Stays A Family Pilot"),
    "domain skeleton migration doc missing selected-domain or SEC boundary"
  );
  addCheck(
    "docs:podcast-boundary",
    podcastPositionDoc.includes("Layer 1: Transcript Family Semantics") &&
      podcastPositionDoc.includes("Layer 2: Podcast-Domain Semantics") &&
      podcastPositionDoc.includes("Layer 3: Out-Of-Scope Product Intelligence"),
    "podcast positioning doc missing three-layer distinction"
  );
  addCheck(
    "docs:acceptance",
    acceptanceDoc.includes("Step 04 adapter layer is explicitly unchanged") &&
      acceptanceDoc.includes("validate-shared-step-05.mjs"),
    "acceptance doc missing Step 04 guard or validation command"
  );

  const coreResolver = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/route-resolver.js")).href);
  const registryConsumer = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/registry-consumer.js")).href);
  const runtimeSurfaceMapModule = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/runtime-surface-map.js")).href);
  const familyNormalizers = await import(pathToFileURL(repoPath("packages/attention-family-runtime/src/normalizers/index.js")).href);
  const adapterPilots = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/pilots/index.js")).href);
  const entryBuilderModule = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/registry-entry-builder.js")).href);
  const routeTypeModule = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/resolve-route-type.js")).href);
  const pilotRegistryReportModule = await import(pathToFileURL(repoPath("packages/attention-adapter-harness/src/pilot-registry-report.js")).href);
  const routeResolutionReportModule = await import(pathToFileURL(repoPath("packages/attention-adapter-harness/src/route-resolution-report.js")).href);

  addCheck("core:resolver-export", typeof coreResolver.resolveAdapterRoute === "function", "missing resolveAdapterRoute");
  addCheck("core:registry-consumer-export", typeof registryConsumer.consumeAdapterRegistry === "function", "missing consumeAdapterRegistry");
  addCheck(
    "core:runtime-surface-map-export",
    typeof runtimeSurfaceMapModule.createSharedRuntimeSurfaceMap === "function",
    "missing createSharedRuntimeSurfaceMap"
  );
  addCheck(
    "family:normalizers",
    familyNormalizers.familyNormalizerNames.includes("transcript_first_longform_normalizer") &&
      familyNormalizers.familyNormalizerNames.includes("official_structured_sources_normalizer"),
    "family normalizer index missing required normalizers"
  );
  addCheck("adapter:entry-builder", typeof entryBuilderModule.buildPilotRegistryEntry === "function", "missing buildPilotRegistryEntry");
  addCheck("adapter:route-helper", typeof routeTypeModule.resolveRouteType === "function", "missing resolveRouteType");
  addCheck(
    "harness:report-shapes",
    typeof pilotRegistryReportModule.createPilotRegistryReport === "function" &&
      typeof routeResolutionReportModule.createRouteResolutionReport === "function",
    "missing Step 05 harness report creators"
  );

  addCheck(
    "adapter:pilot-integration-count",
    adapterPilots.integratedPilots.length === 4 && adapterPilots.integratedPilotRegistry.length === 4,
    "integrated pilot registry must include 4 Step 04 pilots"
  );
  addCheck(
    "adapter:pilot-ids",
    requiredPilotIds.every((id) => adapterPilots.integratedPilotRegistry.some((entry) => entry.adapter_id === id)),
    "not all Step 04 pilots were collected into Step 05 registry"
  );

  const consumedRegistry = registryConsumer.consumeAdapterRegistry(adapterPilots.integratedPilotRegistry);
  addCheck("coverage:direct", consumedRegistry.route_coverage.direct >= 2, "direct route coverage must be >= 2");
  addCheck("coverage:family", consumedRegistry.route_coverage.family >= 2, "family route coverage must be >= 2");

  const podcastEntry = adapterPilots.getIntegratedRegistryEntryById("family-podcast-transcript");
  const podcastResolution = coreResolver.resolveAdapterRoute({
    adapter_id: podcastEntry.adapter_id,
    route_type: podcastEntry.route_type,
    family_kind: podcastEntry.family_kind,
    source_kind: podcastEntry.source_kind,
    registry_entry: podcastEntry
  });
  addCheck(
    "podcast:family-path",
    JSON.stringify(podcastResolution.resolved_path) === JSON.stringify(["source_adapter", "family_normalizer", "shared_core"]),
    "podcast-domain must resolve through family path"
  );

  const transcriptNormalized = familyNormalizers.normalizeTranscriptFirstLongform({
    podcast_episode_id: "pod_ep_204",
    podcast_show_key: "deep_research_radio",
    language: "en",
    transcript_segments: [{ cue_id: "c001", speaker_label: "Host", start_ms: 0, end_ms: 1000, text: "hello" }]
  });
  addCheck(
    "family:transcript-output",
    transcriptNormalized.family_name === "transcript_first_longform" &&
      transcriptNormalized.normalized_shape_name === "transcript_first_longform_normalized_shape",
    "transcript normalizer must emit family-normalized shape"
  );

  const officialNormalized = familyNormalizers.normalizeOfficialStructuredSources({
    accession_no: "0000123456-26-000001",
    form_type: "8-K",
    issuer_name: "Example Corp",
    filed_at: "2026-03-10T21:00:00Z",
    amendment_flag: false
  });
  addCheck(
    "family:official-output",
    officialNormalized.family_name === "official_structured_sources" &&
      officialNormalized.normalized_shape_name === "official_structured_sources_normalized_shape",
    "official structured normalizer must emit family-normalized shape"
  );

  const magazineDomain = await import(pathToFileURL(repoPath("domains/magazine-domain/src/index.js")).href);
  const youtubeDomain = await import(pathToFileURL(repoPath("domains/youtube-domain/src/index.js")).href);
  const podcastDomain = await import(pathToFileURL(repoPath("domains/podcast-domain/src/index.js")).href);

  addCheck("domains:magazine", magazineDomain.packageName === "magazine-domain", "missing magazine domain skeleton");
  addCheck("domains:youtube", youtubeDomain.packageName === "youtube-domain", "missing youtube domain skeleton");
  addCheck("domains:podcast", podcastDomain.packageName === "podcast-domain", "missing podcast domain skeleton");
  addCheck("domains:podcast-family", podcastDomain.domainBoundary.family_kind === "transcript_first_longform", "podcast domain must be family-backed");

  addCheck("sec:not-product-domain", !exists("domains/sec-domain/package.json"), "SEC must not become a selected product domain");

  const domainFiles = [
    "domains/magazine-domain/src/index.js",
    "domains/magazine-domain/src/pilots/direct-magazine-summary-entry.js",
    "domains/magazine-domain/src/pilots/direct-magazine-summary-mapper.js",
    "domains/magazine-domain/src/pilots/direct-magazine-summary-diagnostics.js",
    "domains/youtube-domain/src/index.js",
    "domains/youtube-domain/src/pilots/direct-youtube-summary-entry.js",
    "domains/youtube-domain/src/pilots/direct-youtube-summary-mapper.js",
    "domains/youtube-domain/src/pilots/direct-youtube-summary-diagnostics.js",
    "domains/podcast-domain/src/index.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-entry.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-mapper.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-diagnostics.js"
  ];

  for (const file of domainFiles) {
    const text = read(file);
    addCheck(
      `domains:no-business-migration:${file}`,
      !/Get-ChildItem|uniCloud|pages\/|router\b|components?\//i.test(text),
      "domain skeleton drifted into business migration or page concerns"
    );
  }

  const step05CodeFiles = [
    "packages/attention-core-runtime/src/route-resolver.js",
    "packages/attention-core-runtime/src/registry-consumer.js",
    "packages/attention-core-runtime/src/runtime-surface-map.js",
    "packages/attention-family-runtime/src/normalizers/transcript-first-longform.js",
    "packages/attention-family-runtime/src/normalizers/official-structured-sources.js",
    "packages/attention-family-runtime/src/normalizers/index.js",
    "packages/attention-adapter-runtime/src/pilots/index.js",
    "packages/attention-adapter-runtime/src/registry-entry-builder.js",
    "packages/attention-adapter-runtime/src/resolve-route-type.js",
    "domains/podcast-domain/src/index.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-entry.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-mapper.js",
    "domains/podcast-domain/src/pilots/family-podcast-transcript-diagnostics.js"
  ];

  for (const file of step05CodeFiles) {
    const text = read(file).toLowerCase();
    for (const term of podcastOutOfScopeTerms) {
      addCheck(
        `podcast-intelligence:not-in-code:${file}:${term}`,
        !text.includes(term.toLowerCase()),
        `out-of-scope podcast intelligence leaked into Step 05 code: ${term}`
      );
    }
  }

  for (const term of podcastOutOfScopeTerms) {
    addCheck(
      `podcast-intelligence:documented:${term}`,
      podcastPositionDoc.includes(`\`${term}\``) && decisionsDoc.includes("podcast product intelligence"),
      `podcast positioning/decisions docs must explicitly keep ${term} out of scope`
    );
  }

  const pilotReports = adapterPilots.integratedPilotRegistry.map((entry) =>
    pilotRegistryReportModule.createPilotRegistryReport({
      adapter_id: entry.adapter_id,
      route_type: entry.route_type,
      family_kind: entry.family_kind,
      selected_path:
        entry.route_type === "family"
          ? ["source_adapter", "family_normalizer", "shared_core"]
          : ["source_adapter", "shared_core"],
      normalized_shape_name: entry.family_kind ? `${entry.family_kind}_normalized_shape` : null,
      shared_projection_name: entry.output_shape_name,
      retained_extras: entry.retained_extras || [],
      warnings: []
    })
  );

  const routeReports = adapterPilots.integratedPilotRegistry.map((entry) => {
    const resolved = coreResolver.resolveAdapterRoute({
      adapter_id: entry.adapter_id,
      route_type: entry.route_type,
      family_kind: entry.family_kind,
      source_kind: entry.source_kind,
      registry_entry: entry
    });
    return routeResolutionReportModule.createRouteResolutionReport({
      adapter_id: entry.adapter_id,
      route_type: entry.route_type,
      family_kind: entry.family_kind,
      selected_path: resolved.resolved_path,
      normalized_shape_name: resolved.expected_intermediate_shape,
      shared_projection_name: resolved.expected_shared_projection,
      retained_extras: entry.retained_extras || [],
      warnings: resolved.diagnostics_hooks.warnings
    });
  });

  const report = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? "ok" : "failed",
    step: "shared-step-05",
    checked_docs: requiredDocs.length,
    checked_runtime_files: 11,
    checked_pilots: adapterPilots.integratedPilotRegistry.length,
    checked_domains: 3,
    route_coverage: consumedRegistry.route_coverage,
    pilot_registry_reports: pilotReports,
    route_resolution_reports: routeReports,
    checks,
    warnings,
    errors
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
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
    step: "shared-step-05",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
