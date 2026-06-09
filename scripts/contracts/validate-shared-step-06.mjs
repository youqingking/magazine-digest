import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-06");
const validationReportPath = path.join(outputDir, "validation-report.json");
const adoptionReportPath = path.join(outputDir, "domain-adoption-report.json");
const secReportPath = path.join(outputDir, "family-sec-filing.report.json");

const requiredDocs = [
  "docs/SELECTED_DOMAIN_ADOPTION.md",
  "docs/DOMAIN_PROJECTION_FIXTURES.md",
  "docs/SHARED_RUNTIME_ADOPTION_RULES.md",
  "docs/FAMILY_ONLY_PILOT_HANDLING.md",
  "docs/STAGE_SHARED_STEP06_DECISIONS.md",
  "docs/STEP_06_ACCEPTANCE.md"
];

const requiredFiles = [
  ...requiredDocs,
  "packages/attention-core-runtime/src/adopt-pilot-entry.js",
  "packages/attention-core-runtime/src/project-to-shared-envelope.js",
  "packages/attention-core-runtime/src/run-route-resolution.js",
  "packages/attention-family-runtime/src/run-family-normalizer.js",
  "packages/attention-family-runtime/src/normalized-shape-guards.js",
  "packages/attention-adapter-runtime/src/execute-pilot-mapping.js",
  "packages/attention-adapter-runtime/src/build-pilot-diagnostics.js",
  "packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js",
  "packages/attention-adapter-harness/src/adoption-report-shape.js",
  "packages/attention-adapter-harness/src/domain-pilot-report-shape.js",
  "domains/magazine-domain/src/adoption/run-direct-magazine-summary.js",
  "domains/magazine-domain/src/adoption/project-direct-magazine-summary.js",
  "domains/magazine-domain/fixtures/direct-magazine-summary.input.json",
  "domains/magazine-domain/fixtures/direct-magazine-summary.shared.json",
  "domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json",
  "domains/youtube-domain/src/adoption/run-direct-youtube-summary.js",
  "domains/youtube-domain/src/adoption/project-direct-youtube-summary.js",
  "domains/youtube-domain/fixtures/direct-youtube-summary.input.json",
  "domains/youtube-domain/fixtures/direct-youtube-summary.shared.json",
  "domains/youtube-domain/fixtures/direct-youtube-summary.diagnostics.json",
  "domains/podcast-domain/src/adoption/run-family-podcast-transcript.js",
  "domains/podcast-domain/src/adoption/project-family-podcast-transcript.js",
  "domains/podcast-domain/fixtures/family-podcast-transcript.input.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.family.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.shared.json",
  "domains/podcast-domain/fixtures/family-podcast-transcript.diagnostics.json",
  "scripts/contracts/validate-shared-step-06.mjs",
  "scripts/contracts/validate-shared-step-06.ps1"
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
  "docs/PILOT_REGISTRY_INTEGRATION.md",
  "docs/ROUTE_RESOLUTION_FLOW.md",
  "docs/DOMAIN_SKELETON_MIGRATION.md",
  "docs/DOMAIN_PILOT_SELECTION.md",
  "docs/PODCAST_DOMAIN_POSITIONING.md",
  "docs/STAGE_SHARED_STEP05_DECISIONS.md",
  "docs/STEP_05_ACCEPTANCE.md",
  "packages/attention-core-runtime/src/route-resolver.js",
  "packages/attention-core-runtime/src/registry-consumer.js",
  "packages/attention-core-runtime/src/runtime-surface-map.js",
  "packages/attention-family-runtime/src/normalizers/transcript-first-longform.js",
  "packages/attention-family-runtime/src/normalizers/official-structured-sources.js",
  "packages/attention-family-runtime/src/normalizers/index.js",
  "packages/attention-adapter-runtime/src/pilots/index.js",
  "packages/attention-adapter-runtime/src/registry-entry-builder.js",
  "packages/attention-adapter-runtime/src/resolve-route-type.js",
  "packages/attention-adapter-runtime/src/pilots/direct-magazine-summary.js",
  "packages/attention-adapter-runtime/src/pilots/direct-youtube-summary.js",
  "packages/attention-adapter-runtime/src/pilots/family-podcast-transcript.js",
  "packages/attention-adapter-runtime/src/pilots/family-sec-filing.js",
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
  "scripts/contracts/validate-shared-step-02.mjs",
  "scripts/contracts/validate-shared-step-02.ps1",
  "scripts/contracts/validate-shared-step-03.mjs",
  "scripts/contracts/validate-shared-step-03.ps1",
  "scripts/contracts/validate-shared-step-04.mjs",
  "scripts/contracts/validate-shared-step-04.ps1",
  "scripts/contracts/validate-shared-step-05.mjs",
  "scripts/contracts/validate-shared-step-05.ps1"
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

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

async function main() {
  ensureOutputDir();

  for (const file of requiredFiles) {
    addCheck(`exists:${file}`, exists(file), "missing required Step 06 file");
  }

  const protectedChanges = changedProtectedTrackedFiles();
  addCheck(
    "protected-files-unchanged",
    protectedChanges.length === 0,
    protectedChanges.length ? protectedChanges.join(", ") : "no tracked protected files changed"
  );

  const step04Step05Tracked = protectedTrackedFiles
    .filter((file) => file.includes("ADAPTER_") || file.includes("STEP_04") || file.includes("STEP_05") || file.includes("PILOT_REGISTRY_INTEGRATION") || file.includes("ROUTE_RESOLUTION_FLOW") || file.includes("PODCAST_DOMAIN_POSITIONING") || file.includes("attention-adapter") || file.includes("validate-shared-step-04") || file.includes("validate-shared-step-05"))
    .filter(isTracked);
  if (step04Step05Tracked.length === 0) {
    warnings.push("step04_step05_protected_files_untracked:Step 04 and Step 05 protected files are present locally but not tracked, so immutability is validated by non-touch policy rather than git diff.");
  }

  const selectedDomainDoc = exists("docs/SELECTED_DOMAIN_ADOPTION.md") ? read("docs/SELECTED_DOMAIN_ADOPTION.md") : "";
  const fixtureDoc = exists("docs/DOMAIN_PROJECTION_FIXTURES.md") ? read("docs/DOMAIN_PROJECTION_FIXTURES.md") : "";
  const adoptionRulesDoc = exists("docs/SHARED_RUNTIME_ADOPTION_RULES.md") ? read("docs/SHARED_RUNTIME_ADOPTION_RULES.md") : "";
  const familyOnlyDoc = exists("docs/FAMILY_ONLY_PILOT_HANDLING.md") ? read("docs/FAMILY_ONLY_PILOT_HANDLING.md") : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP06_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP06_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_06_ACCEPTANCE.md") ? read("docs/STEP_06_ACCEPTANCE.md") : "";

  addCheck(
    "docs:selected-domain-adoption",
    selectedDomainDoc.includes("first shared runtime adoption") &&
      selectedDomainDoc.includes("input fixture") &&
      selectedDomainDoc.includes("family normalization"),
    "selected domain adoption doc missing first adoption closure"
  );
  addCheck(
    "docs:fixture-rules",
    fixtureDoc.includes("shared projection fixture") &&
      fixtureDoc.includes("diagnostics fixture") &&
      fixtureDoc.includes("family-normalized fixture"),
    "fixture doc missing required fixture matrix"
  );
  addCheck(
    "docs:adoption-rules",
    adoptionRulesDoc.includes("execute-pilot-mapping.js") &&
      adoptionRulesDoc.includes("run-family-normalizer.js") &&
      adoptionRulesDoc.includes("run-route-resolution.js"),
    "shared runtime adoption rules doc missing explicit entry file guidance"
  );
  addCheck(
    "docs:family-only",
    familyOnlyDoc.includes("family-sec-filing") &&
      familyOnlyDoc.includes("no_domain_upgrade = true"),
    "family-only handling doc missing SEC rule"
  );
  addCheck(
    "docs:acceptance",
    acceptanceDoc.includes("Step 05 registry integration is explicitly unchanged") &&
      acceptanceDoc.includes("validate-shared-step-06.mjs"),
    "acceptance doc missing Step 05 guard or validation command"
  );

  for (const term of podcastOutOfScopeTerms) {
    addCheck(
      `docs:podcast-out-of-scope:${term}`,
      selectedDomainDoc.includes(`\`${term}\``) && decisionsDoc.includes(`\`${term}\``),
      `Step 06 docs must explicitly keep ${term} out of scope`
    );
  }

  const runRouteResolutionModule = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/run-route-resolution.js")).href);
  const projectToSharedEnvelopeModule = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/project-to-shared-envelope.js")).href);
  const adoptPilotEntryModule = await import(pathToFileURL(repoPath("packages/attention-core-runtime/src/adopt-pilot-entry.js")).href);
  const familyRunnerModule = await import(pathToFileURL(repoPath("packages/attention-family-runtime/src/run-family-normalizer.js")).href);
  const shapeGuardModule = await import(pathToFileURL(repoPath("packages/attention-family-runtime/src/normalized-shape-guards.js")).href);
  const executePilotMappingModule = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/execute-pilot-mapping.js")).href);
  const buildDiagnosticsModule = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/build-pilot-diagnostics.js")).href);
  const secPilotModule = await import(pathToFileURL(repoPath("packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js")).href);
  const adoptionReportModule = await import(pathToFileURL(repoPath("packages/attention-adapter-harness/src/adoption-report-shape.js")).href);
  const domainPilotReportModule = await import(pathToFileURL(repoPath("packages/attention-adapter-harness/src/domain-pilot-report-shape.js")).href);
  const runMagazineModule = await import(pathToFileURL(repoPath("domains/magazine-domain/src/adoption/run-direct-magazine-summary.js")).href);
  const runYoutubeModule = await import(pathToFileURL(repoPath("domains/youtube-domain/src/adoption/run-direct-youtube-summary.js")).href);
  const runPodcastModule = await import(pathToFileURL(repoPath("domains/podcast-domain/src/adoption/run-family-podcast-transcript.js")).href);

  addCheck(
    "runtime:core-exports",
    typeof runRouteResolutionModule.runRouteResolution === "function" &&
      typeof projectToSharedEnvelopeModule.projectToSharedEnvelope === "function" &&
      typeof adoptPilotEntryModule.adoptPilotEntry === "function",
    "missing Step 06 core runtime adoption exports"
  );
  addCheck(
    "runtime:family-exports",
    typeof familyRunnerModule.runFamilyNormalizer === "function" &&
      typeof shapeGuardModule.assertFamilyNormalizedShape === "function",
    "missing Step 06 family runtime exports"
  );
  addCheck(
    "runtime:adapter-exports",
    typeof executePilotMappingModule.executePilotMapping === "function" &&
      typeof buildDiagnosticsModule.buildPilotDiagnostics === "function" &&
      typeof secPilotModule.runFamilySecFiling === "function",
    "missing Step 06 adapter runtime exports"
  );
  addCheck(
    "runtime:harness-exports",
    typeof adoptionReportModule.createAdoptionReport === "function" &&
      typeof domainPilotReportModule.createDomainPilotReport === "function",
    "missing Step 06 harness exports"
  );

  const magazineInput = readJson("domains/magazine-domain/fixtures/direct-magazine-summary.input.json");
  const magazineExpectedShared = readJson("domains/magazine-domain/fixtures/direct-magazine-summary.shared.json");
  const magazineExpectedDiagnostics = readJson("domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json");
  const youtubeInput = readJson("domains/youtube-domain/fixtures/direct-youtube-summary.input.json");
  const youtubeExpectedShared = readJson("domains/youtube-domain/fixtures/direct-youtube-summary.shared.json");
  const youtubeExpectedDiagnostics = readJson("domains/youtube-domain/fixtures/direct-youtube-summary.diagnostics.json");
  const podcastInput = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.input.json");
  const podcastExpectedFamily = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.family.json");
  const podcastExpectedShared = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.shared.json");
  const podcastExpectedDiagnostics = readJson("domains/podcast-domain/fixtures/family-podcast-transcript.diagnostics.json");

  const magazineReport = runMagazineModule.runDirectMagazineSummary(magazineInput);
  const youtubeReport = runYoutubeModule.runDirectYoutubeSummary(youtubeInput);
  const podcastReport = runPodcastModule.runFamilyPodcastTranscript(podcastInput);
  const secReport = secPilotModule.runFamilySecFiling();

  addCheck(
    "domain:magazine-shared-fixture",
    sameJson(magazineReport.shared_projection_fixture, magazineExpectedShared),
    "magazine shared projection fixture mismatch"
  );
  addCheck(
    "domain:magazine-diagnostics-fixture",
    sameJson(magazineReport.diagnostics_fixture, magazineExpectedDiagnostics),
    "magazine diagnostics fixture mismatch"
  );
  addCheck(
    "domain:youtube-shared-fixture",
    sameJson(youtubeReport.shared_projection_fixture, youtubeExpectedShared),
    "youtube shared projection fixture mismatch"
  );
  addCheck(
    "domain:youtube-diagnostics-fixture",
    sameJson(youtubeReport.diagnostics_fixture, youtubeExpectedDiagnostics),
    "youtube diagnostics fixture mismatch"
  );
  addCheck(
    "domain:podcast-family-fixture",
    sameJson(podcastReport.family_normalized_fixture, podcastExpectedFamily),
    "podcast family-normalized fixture mismatch"
  );
  addCheck(
    "domain:podcast-shared-fixture",
    sameJson(podcastReport.shared_projection_fixture, podcastExpectedShared),
    "podcast shared projection fixture mismatch"
  );
  addCheck(
    "domain:podcast-diagnostics-fixture",
    sameJson(podcastReport.diagnostics_fixture, podcastExpectedDiagnostics),
    "podcast diagnostics fixture mismatch"
  );

  addCheck(
    "domain:podcast-family-path",
    JSON.stringify(podcastReport.selected_path) === JSON.stringify(["source_adapter", "family_normalizer", "shared_core"]),
    "podcast adoption must use family path"
  );
  addCheck(
    "family-only:sec-report-flag",
    secReport.no_domain_upgrade === true &&
      secReport.family_kind === "official_structured_sources" &&
      JSON.stringify(secReport.selected_path) === JSON.stringify(["source_adapter", "family_normalizer", "shared_core"]),
    "SEC family-only pilot must stay family-only with no domain upgrade"
  );

  const adoptionReport = adoptionReportModule.createAdoptionReport({
    domain_reports: [magazineReport, youtubeReport, podcastReport],
    family_only_reports: [secReport],
    coverage: {
      direct_domains: [magazineReport, youtubeReport].filter((report) => report.route_type === "direct").length,
      family_backed_domains: [podcastReport].filter((report) => report.route_type === "family").length,
      family_only_pilots: [secReport].filter((report) => report.no_domain_upgrade).length
    },
    warnings
  });

  writeJson(adoptionReportPath, adoptionReport);
  writeJson(secReportPath, secReport);

  addCheck(
    "coverage:direct-domains",
    adoptionReport.coverage.direct_domains >= 2,
    "direct domain adoption coverage must be >= 2"
  );
  addCheck(
    "coverage:family-backed-domains",
    adoptionReport.coverage.family_backed_domains >= 1,
    "family-backed domain adoption coverage must be >= 1"
  );
  addCheck(
    "coverage:family-only-pilots",
    adoptionReport.coverage.family_only_pilots >= 1,
    "family-only pilot coverage must be >= 1"
  );
  addCheck("output:adoption-report", exists("output/shared-step-06/domain-adoption-report.json"), "missing Step 06 adoption report");
  addCheck("output:sec-family-only-report", exists("output/shared-step-06/family-sec-filing.report.json"), "missing SEC family-only report");

  addCheck("output:no-sec-domain", !exists("domains/sec-domain/package.json"), "SEC must not become a product domain");

  const domainAdoptionFiles = [
    "domains/magazine-domain/src/adoption/run-direct-magazine-summary.js",
    "domains/magazine-domain/src/adoption/project-direct-magazine-summary.js",
    "domains/youtube-domain/src/adoption/run-direct-youtube-summary.js",
    "domains/youtube-domain/src/adoption/project-direct-youtube-summary.js",
    "domains/podcast-domain/src/adoption/run-family-podcast-transcript.js",
    "domains/podcast-domain/src/adoption/project-family-podcast-transcript.js"
  ];

  for (const file of domainAdoptionFiles) {
    const text = read(file);
    addCheck(
      `domain-adoption:no-business-migration:${file}`,
      !/uniCloud|pages\/|router\b|components?\/|createPage|onLoad|onShow/i.test(text),
      "domain adoption file drifted into page or business migration code"
    );
    addCheck(
      `domain-adoption:public-entry-imports:${file}`,
      !/route-resolver\.js|registry-consumer\.js|normalizers\/transcript-first-longform\.js|normalizers\/official-structured-sources\.js/.test(text),
      "domain adoption file deep-imports a non-Step-06 package internal"
    );
  }

  const step06CodeFiles = [
    "packages/attention-core-runtime/src/adopt-pilot-entry.js",
    "packages/attention-core-runtime/src/project-to-shared-envelope.js",
    "packages/attention-core-runtime/src/run-route-resolution.js",
    "packages/attention-family-runtime/src/run-family-normalizer.js",
    "packages/attention-family-runtime/src/normalized-shape-guards.js",
    "packages/attention-adapter-runtime/src/execute-pilot-mapping.js",
    "packages/attention-adapter-runtime/src/build-pilot-diagnostics.js",
    "packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js",
    "domains/podcast-domain/src/adoption/run-family-podcast-transcript.js",
    "domains/podcast-domain/src/adoption/project-family-podcast-transcript.js"
  ];

  for (const file of step06CodeFiles) {
    const text = read(file).toLowerCase();
    for (const term of podcastOutOfScopeTerms) {
      addCheck(
        `podcast-intelligence:not-in-code:${file}:${term}`,
        !text.includes(term.toLowerCase()),
        `out-of-scope podcast intelligence leaked into Step 06 code: ${term}`
      );
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? "ok" : "failed",
    step: "shared-step-06",
    checked_docs: requiredDocs.length,
    checked_adoption_files: requiredFiles.length - requiredDocs.length - 2,
    checked_domains: 3,
    coverage: adoptionReport.coverage,
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
    step: "shared-step-06",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  writeJson(validationReportPath, report);
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
