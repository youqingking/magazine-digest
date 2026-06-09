import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-04");
const reportPath = path.join(outputDir, "validation-report.json");

const protectedStep0203Files = [
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
  "packages/attention-core-contracts/package.json",
  "packages/attention-core-contracts/README.md",
  "packages/attention-core-contracts/src/index.js",
  "packages/attention-core-runtime/package.json",
  "packages/attention-core-runtime/README.md",
  "packages/attention-core-runtime/src/index.js",
  "packages/attention-core-harness/package.json",
  "packages/attention-core-harness/README.md",
  "packages/attention-core-harness/src/index.js",
  "packages/attention-family-contracts/package.json",
  "packages/attention-family-contracts/README.md",
  "packages/attention-family-contracts/src/index.js",
  "packages/attention-family-runtime/package.json",
  "packages/attention-family-runtime/README.md",
  "packages/attention-family-runtime/src/index.js",
  "packages/attention-family-harness/package.json",
  "packages/attention-family-harness/README.md",
  "packages/attention-family-harness/src/index.js",
  "scripts/contracts/validate-shared-step-02.mjs",
  "scripts/contracts/validate-shared-step-02.ps1",
  "scripts/contracts/validate-shared-step-03.mjs",
  "scripts/contracts/validate-shared-step-03.ps1"
];

const requiredStep04Docs = [
  "docs/ADAPTER_LAYER.md",
  "docs/ADAPTER_ROUTING_RULES.md",
  "docs/ADAPTER_REGISTRY.md",
  "docs/ADAPTER_DIAGNOSTICS.md",
  "docs/PILOT_ADAPTER_SELECTION.md",
  "docs/PILOT_MAPPING_EXAMPLES.md",
  "docs/STAGE_SHARED_STEP04_DECISIONS.md",
  "docs/STEP_04_ACCEPTANCE.md"
];

const requiredStep04Files = [
  ...requiredStep04Docs,
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
  "scripts/contracts/validate-shared-step-04.mjs",
  "scripts/contracts/validate-shared-step-04.ps1"
];

const requiredPilotIds = [
  "direct-magazine-summary",
  "direct-youtube-summary",
  "family-podcast-transcript",
  "family-sec-filing"
];

const requiredRegistryFields = [
  "adapter_id",
  "adapter_route_type",
  "source_kind",
  "family_kind",
  "input_shape_name",
  "output_shape_name",
  "diagnostics_shape_name",
  "supported_capabilities",
  "unsupported_capabilities",
  "status",
  "version"
];

const requiredDiagnosticsFields = [
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

const bannedPromotedSharedNames = [
  "ArticleRef",
  "VideoRef",
  "PublicationRef",
  "ChannelRef",
  "IssueRef",
  "FilingRef"
];

const secretPattern = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|SECRET_ACCESS_KEY|PRIVATE_KEY=|TOKEN=)/;

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

function changedProtectedFiles() {
  const output = execSync("git diff --name-only -- docs packages scripts", {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
  const changed = output ? output.split(/\r?\n/).filter(Boolean) : [];
  return changed.filter((file) => protectedStep0203Files.includes(file));
}

function countMentions(text, values) {
  return values.filter((value) => text.includes(value)).length;
}

async function validatePackages() {
  const runtimeConfig = {
    dir: "packages/attention-adapter-runtime",
    name: "attention-adapter-runtime",
    requiredExports: [
      "packageBoundary",
      "routeContractNames",
      "adapterRouteTypes",
      "adapterRegistryShapeName",
      "adapterRegistryFieldNames",
      "mappingDiagnosticsShapeName",
      "mappingDiagnosticsFieldNames",
      "pilotAdapterNames",
      "pilotAdapterRegistry",
      "listAdapterRegistryEntries",
      "findAdapterRegistryEntry",
      "publicApi"
    ]
  };

  const harnessConfig = {
    dir: "packages/attention-adapter-harness",
    name: "attention-adapter-harness",
    requiredExports: [
      "packageBoundary",
      "validationEntryNames",
      "reportShapeNames",
      "adapterConsistencyRuleNames",
      "adapterReportShapeName",
      "adapterReportFieldNames",
      "createAdapterReport",
      "publicApi"
    ]
  };

  const packageResults = [];

  for (const pkg of [runtimeConfig, harnessConfig]) {
    const packageJsonPath = `${pkg.dir}/package.json`;
    const readmePath = `${pkg.dir}/README.md`;
    const entryPath = `${pkg.dir}/src/index.js`;

    addCheck(`exists:${packageJsonPath}`, exists(packageJsonPath), "missing package.json");
    addCheck(`exists:${readmePath}`, exists(readmePath), "missing README.md");
    addCheck(`exists:${entryPath}`, exists(entryPath), "missing src/index.js");

    if (!exists(packageJsonPath) || !exists(readmePath) || !exists(entryPath)) {
      continue;
    }

    const packageJson = JSON.parse(read(packageJsonPath));
    const readme = read(readmePath);
    const mod = await import(pathToFileURL(repoPath(entryPath)).href);

    addCheck(`package-name:${pkg.name}`, packageJson.name === pkg.name, `expected ${pkg.name}`);
    addCheck(`package-main:${pkg.name}`, packageJson.main === "./src/index.js", "main must target src/index.js");
    addCheck(`readme-public-api:${pkg.name}`, readme.includes("## Public API"), "README missing Public API section");
    addCheck(`readme-boundary:${pkg.name}`, readme.includes("## Does Not Include"), "README missing Does Not Include section");
    addCheck(`module-packageName:${pkg.name}`, mod.packageName === pkg.name, "module packageName mismatch");
    addCheck(`module-publicApi:${pkg.name}`, Array.isArray(mod.publicApi) && mod.publicApi.length > 0, "missing publicApi");
    addCheck(`module-boundary:${pkg.name}`, Boolean(mod.packageBoundary), "missing packageBoundary");

    for (const exportName of pkg.requiredExports) {
      addCheck(`module-export:${pkg.name}:${exportName}`, exportName in mod, `missing export ${exportName}`);
      addCheck(`readme-export:${pkg.name}:${exportName}`, readme.includes(`\`${exportName}\``), `README missing ${exportName}`);
    }

    packageResults.push({
      name: pkg.name,
      public_api_count: mod.publicApi.length,
      depends_on: mod.packageBoundary?.dependsOn || []
    });
  }

  return packageResults;
}

async function main() {
  ensureOutputDir();

  for (const file of requiredStep04Files) {
    addCheck(`exists:${file}`, exists(file), "missing required Step 04 file");
  }

  const protectedChanges = changedProtectedFiles();
  addCheck(
    "step02-step03-unchanged",
    protectedChanges.length === 0,
    protectedChanges.length ? protectedChanges.join(", ") : "no protected Step 02/03 files changed"
  );

  const layerDoc = exists("docs/ADAPTER_LAYER.md") ? read("docs/ADAPTER_LAYER.md") : "";
  const routingDoc = exists("docs/ADAPTER_ROUTING_RULES.md") ? read("docs/ADAPTER_ROUTING_RULES.md") : "";
  const registryDoc = exists("docs/ADAPTER_REGISTRY.md") ? read("docs/ADAPTER_REGISTRY.md") : "";
  const diagnosticsDoc = exists("docs/ADAPTER_DIAGNOSTICS.md") ? read("docs/ADAPTER_DIAGNOSTICS.md") : "";
  const selectionDoc = exists("docs/PILOT_ADAPTER_SELECTION.md") ? read("docs/PILOT_ADAPTER_SELECTION.md") : "";
  const examplesDoc = exists("docs/PILOT_MAPPING_EXAMPLES.md") ? read("docs/PILOT_MAPPING_EXAMPLES.md") : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP04_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP04_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_04_ACCEPTANCE.md") ? read("docs/STEP_04_ACCEPTANCE.md") : "";

  addCheck(
    "layer:three-layers",
    layerDoc.includes("Layer 1: Shared Core") &&
      layerDoc.includes("Layer 2: Source Family") &&
      layerDoc.includes("Layer 3: Source Adapter"),
    "three-layer boundary missing"
  );
  addCheck(
    "layer:two-paths",
    layerDoc.includes("source adapter -> shared core") &&
      layerDoc.includes("source adapter -> source family -> shared core"),
    "two legal routes missing"
  );
  addCheck(
    "layer:family-optional",
    layerDoc.includes("not every source must pass through family layer") &&
      layerDoc.includes("family layer is optional"),
    "family optional rule missing"
  );
  addCheck(
    "layer:adapter-responsibility",
    layerDoc.includes("mapping and diagnostics") && layerDoc.includes("not for"),
    "adapter responsibility rule missing"
  );

  addCheck("routing:magazine-direct", routingDoc.includes("Why Magazine Remains Direct Path First"), "magazine direct rule missing");
  addCheck("routing:youtube-direct", routingDoc.includes("Why YouTube Remains Direct Path First"), "YouTube direct rule missing");
  addCheck(
    "routing:family-cases",
    routingDoc.includes("Transcript-First Longform Fits Family Path Better") &&
      routingDoc.includes("Official Structured Sources Fit Family Path Better"),
    "family path justification missing"
  );
  addCheck(
    "routing:counterexamples",
    countMentions(routingDoc, ["issue_id", "watch_or_skip", "input_quality_tier", "parser trace ids"]) >= 3,
    "not enough non-promotable counterexamples"
  );

  for (const field of requiredRegistryFields) {
    addCheck(`registry-doc-field:${field}`, registryDoc.includes(`\`${field}\``), `registry doc missing ${field}`);
  }

  for (const field of requiredDiagnosticsFields) {
    addCheck(`diagnostics-doc-field:${field}`, diagnosticsDoc.includes(`\`${field}\``), `diagnostics doc missing ${field}`);
  }

  addCheck("diagnostics:not-end-user", diagnosticsDoc.includes("not for final end users"), "diagnostics audience rule missing");

  for (const pilotId of requiredPilotIds) {
    addCheck(`selection:${pilotId}`, selectionDoc.includes(`\`${pilotId}\``), `selection doc missing ${pilotId}`);
    addCheck(`examples:${pilotId}`, examplesDoc.includes(`\`${pilotId}\``), `examples doc missing ${pilotId}`);
  }

  addCheck("examples:compatibility", examplesDoc.includes("Compatibility Notes"), "compatibility section missing from pilot examples");
  addCheck("decisions:checkpoint", decisionsDoc.includes("dc6a697"), "pre-step checkpoint missing");
  addCheck(
    "acceptance:validators",
    acceptanceDoc.includes("validate-shared-step-04.mjs") && acceptanceDoc.includes("validate-shared-step-04.ps1"),
    "acceptance missing validator commands"
  );

  const runtime = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/index.js")).href);
  const harness = await import(pathToFileURL(repoPath("packages/attention-adapter-harness/src/index.js")).href);

  addCheck(
    "runtime:route-types",
    JSON.stringify(runtime.adapterRouteTypes) === JSON.stringify(["direct", "family"]),
    "runtime route types must freeze direct and family"
  );
  addCheck(
    "runtime:pilot-count",
    runtime.pilotAdapterNames.length === 4 && runtime.pilotAdapterRegistry.length === 4,
    "runtime must expose four pilots"
  );
  addCheck(
    "harness:validation-entry",
    harness.validationEntryNames.includes("validate_shared_step_04"),
    "harness missing validate_shared_step_04 entry"
  );

  for (const field of requiredRegistryFields) {
    addCheck(
      `registry-export-field:${field}`,
      runtime.adapterRegistryFieldNames.includes(field),
      `runtime registry field list missing ${field}`
    );
  }

  for (const field of requiredDiagnosticsFields) {
    addCheck(
      `diagnostics-export-field:${field}`,
      runtime.mappingDiagnosticsFieldNames.includes(field),
      `runtime diagnostics field list missing ${field}`
    );
  }

  const routeCoverage = { direct: 0, family: 0 };
  for (const entry of runtime.pilotAdapterRegistry) {
    addCheck(`registry:pilot-id:${entry.adapter_id}`, requiredPilotIds.includes(entry.adapter_id), "unexpected pilot id");
    addCheck(
      `registry:diagnostics-shape:${entry.adapter_id}`,
      entry.diagnostics_shape_name === runtime.mappingDiagnosticsShapeName,
      "registry diagnostics shape mismatch"
    );
    addCheck(
      `registry:route-type:${entry.adapter_id}`,
      runtime.adapterRouteTypes.includes(entry.adapter_route_type),
      "invalid adapter route type"
    );
    addCheck(`registry:status:${entry.adapter_id}`, entry.status === "pilot", "pilot entry must have pilot status");

    if (entry.adapter_route_type === "direct") {
      routeCoverage.direct += 1;
      addCheck(`registry:family-null:${entry.adapter_id}`, entry.family_kind === null, "direct route must have null family_kind");
    }

    if (entry.adapter_route_type === "family") {
      routeCoverage.family += 1;
      addCheck(`registry:family-present:${entry.adapter_id}`, Boolean(entry.family_kind), "family route must have family_kind");
    }
  }

  addCheck("coverage:direct", routeCoverage.direct > 0, "direct route coverage missing");
  addCheck("coverage:family", routeCoverage.family > 0, "family route coverage missing");

  const pilotModules = [
    runtime.directMagazineSummaryPilot,
    runtime.directYoutubeSummaryPilot,
    runtime.familyPodcastTranscriptPilot,
    runtime.familySecFilingPilot
  ];

  for (const pilot of pilotModules) {
    addCheck(`pilot:id:${pilot.adapter_id}`, requiredPilotIds.includes(pilot.adapter_id), "pilot id not frozen");
    addCheck(`pilot:shared-outputs:${pilot.adapter_id}`, Array.isArray(pilot.shared_outputs?.models), "pilot missing shared outputs");
    addCheck(
      `pilot:diagnostics:${pilot.adapter_id}`,
      pilot.diagnostics_example?.adapter_id === pilot.adapter_id,
      "pilot diagnostics must match adapter id"
    );
    addCheck(
      `pilot:route:${pilot.adapter_id}`,
      pilot.diagnostics_example?.route_type === pilot.route_type,
      "pilot diagnostics route type mismatch"
    );
    if (pilot.route_type === "direct") {
      addCheck(
        `pilot:path:${pilot.adapter_id}`,
        JSON.stringify(pilot.mapping_path) === JSON.stringify(["source_adapter", "shared_core"]),
        "direct pilot path must be source_adapter -> shared_core"
      );
    }
    if (pilot.route_type === "family") {
      addCheck(
        `pilot:path:${pilot.adapter_id}`,
        JSON.stringify(pilot.mapping_path) === JSON.stringify(["source_adapter", "source_family", "shared_core"]),
        "family pilot path must be source_adapter -> source_family -> shared_core"
      );
      addCheck(
        `pilot:family-shape:${pilot.adapter_id}`,
        Boolean(pilot.family_normalized_shape?.family_name),
        "family pilot must expose family_normalized_shape"
      );
    }
  }

  const step04ScanFiles = requiredStep04Files.filter((file) => file !== "scripts/contracts/validate-shared-step-04.mjs");
  for (const file of step04ScanFiles) {
    if (!exists(file)) {
      continue;
    }
    const text = read(file);
    addCheck(`no-secrets:${file}`, !secretPattern.test(text), "suspicious secret-like token found");
    for (const bannedName of bannedPromotedSharedNames) {
      addCheck(
        `no-promoted-shared-name:${file}:${bannedName}`,
        !text.includes(bannedName),
        `unexpected promoted shared-core candidate ${bannedName}`
      );
    }
  }

  addCheck(
    "cross-doc:pilot-ids-match-runtime",
    runtime.pilotAdapterNames.every((pilotId) => selectionDoc.includes(`\`${pilotId}\``) && examplesDoc.includes(`\`${pilotId}\``)),
    "pilot ids diverge between runtime and docs"
  );
  addCheck(
    "cross-doc:registry-shape-name",
    registryDoc.includes("shape name") || registryDoc.includes("shape"),
    "registry doc missing shape narrative"
  );
  addCheck(
    "cross-doc:diagnostics-shape-name",
    diagnosticsDoc.includes("shape"),
    "diagnostics doc missing shape narrative"
  );

  const packageResults = await validatePackages();

  const { createAdapterReport } = await import(
    pathToFileURL(repoPath("packages/attention-adapter-harness/src/adapter-report-shape.js")).href
  );

  const report = createAdapterReport({
    status: errors.length === 0 ? "ok" : "failed",
    checked_docs: requiredStep04Docs.length,
    checked_packages: packageResults.length,
    checked_pilots: runtime.pilotAdapterRegistry.length,
    route_coverage: routeCoverage,
    checks,
    warnings,
    errors,
    packages: packageResults
  });

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
    step: "shared-step-04",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
