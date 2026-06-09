import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-02");
const reportPath = path.join(outputDir, "validation-report.json");

const requiredDocs = [
  "docs/SHARED_CANONICAL_MODELS.md",
  "docs/SHARED_ENUMS_AND_KEYS.md",
  "docs/SHARED_PACKAGE_APIS.md",
  "docs/SHARED_MODEL_EXAMPLES.md",
  "docs/SHARED_CHANGE_POLICY.md",
  "docs/SHARED_MIGRATION_WAVES.md",
  "docs/STEP_02_ACCEPTANCE.md",
  "docs/STAGE_SHARED_STEP02_DECISIONS.md"
];

const requiredModelNames = [
  "ProductContext",
  "ContentRef",
  "ContentVariantKey",
  "ContentListItem",
  "ContentDetailEnvelope",
  "DiscoverySection",
  "FollowTarget",
  "InboxItem",
  "NotificationPreferenceSnapshot",
  "UserContentState",
  "EntitlementSnapshot",
  "QuotaSnapshot",
  "PricingPreview",
  "CampaignPreview",
  "ExperimentAssignment",
  "PublishBatchSummary",
  "RuntimeMode"
];

const requiredEnumNames = [
  "reading_mode",
  "audience_segment",
  "publish_status",
  "update_type",
  "update_priority",
  "notify_level",
  "runtime_mode",
  "entitlement_status",
  "quota_status",
  "notification_type",
  "discovery_section_type",
  "follow_target_type",
  "campaign_status",
  "experiment_bucket_shape",
  "state_panel_type"
];

const packageConfigs = [
  {
    dir: "packages/attention-core-contracts",
    name: "attention-core-contracts",
    requiredExports: [
      "packageBoundary",
      "canonicalModelNames",
      "enumNames",
      "keyAliasMap",
      "payloadShapeNames",
      "schemaContractNames",
      "publicApi"
    ],
    cleanArrays: ["canonicalModelNames", "enumNames", "payloadShapeNames", "schemaContractNames", "publicApi"]
  },
  {
    dir: "packages/attention-core-runtime",
    name: "attention-core-runtime",
    requiredExports: [
      "packageBoundary",
      "adapterInterfaceNames",
      "runtimeModeNames",
      "serviceSeamNames",
      "registryShapeNames",
      "publicApi"
    ],
    cleanArrays: ["adapterInterfaceNames", "runtimeModeNames", "serviceSeamNames", "registryShapeNames", "publicApi"]
  },
  {
    dir: "packages/attention-core-mobile-ui",
    name: "attention-core-mobile-ui",
    requiredExports: [
      "packageBoundary",
      "primitiveNames",
      "presentationContractNames",
      "statePanelTypes",
      "themeSurfaceNames",
      "publicApi"
    ],
    cleanArrays: ["primitiveNames", "presentationContractNames", "statePanelTypes", "themeSurfaceNames", "publicApi"]
  },
  {
    dir: "packages/attention-core-admin",
    name: "attention-core-admin",
    requiredExports: ["packageBoundary", "generatedRailNames", "manualRailNames", "registryNames", "publicApi"],
    cleanArrays: ["generatedRailNames", "manualRailNames", "registryNames", "publicApi"]
  },
  {
    dir: "packages/attention-core-harness",
    name: "attention-core-harness",
    requiredExports: [
      "packageBoundary",
      "validationEntryNames",
      "reportShapeNames",
      "checkpointConventionNames",
      "publicApi"
    ],
    cleanArrays: ["validationEntryNames", "reportShapeNames", "checkpointConventionNames", "publicApi"]
  }
];

const bannedCorePattern = /\b(article|video|publication|channel|issue|magazine|youtube)\b/i;
const credentialPattern =
  /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|SECRET_ACCESS_KEY|PRIVATE_KEY=|TOKEN=|https?:\/\/[^\s)]+|mongodb\+srv:\/\/|postgres:\/\/)/;

const checks = [];
const errors = [];
const warnings = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) {
    errors.push(`${name}:${detail}`);
  }
}

function warn(name, detail) {
  warnings.push(`${name}:${detail}`);
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

function collectStep02Files() {
  const files = [...requiredDocs];
  for (const pkg of packageConfigs) {
    files.push(`${pkg.dir}/package.json`, `${pkg.dir}/README.md`, `${pkg.dir}/src/index.js`);
  }
  files.push("scripts/contracts/validate-shared-step-02.mjs", "scripts/contracts/validate-shared-step-02.ps1");
  return files;
}

async function validatePackages(sharedPackageApiDoc) {
  const packageResults = [];

  for (const pkg of packageConfigs) {
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

    addCheck(`package-name:${pkg.name}`, packageJson.name === pkg.name, `expected ${pkg.name}`);
    addCheck(`package-exports:${pkg.name}`, Boolean(packageJson.exports?.["."] || packageJson.main), "missing export map");
    addCheck(`readme-public-api:${pkg.name}`, readme.includes("## Public API"), "README missing Public API section");
    addCheck(
      `readme-boundary:${pkg.name}`,
      readme.includes("## Does Not Include"),
      "README missing Does Not Include section"
    );
    addCheck(
      `doc-package-mention:${pkg.name}`,
      sharedPackageApiDoc.includes(pkg.name),
      "package missing from docs/SHARED_PACKAGE_APIS.md"
    );

    const mod = await import(pathToFileURL(repoPath(entryPath)).href);

    addCheck(`module-packageName:${pkg.name}`, mod.packageName === pkg.name, "module packageName mismatch");
    addCheck(`module-publicApi:${pkg.name}`, Array.isArray(mod.publicApi) && mod.publicApi.length > 0, "missing publicApi");
    addCheck(
      `module-boundary:${pkg.name}`,
      mod.packageBoundary && typeof mod.packageBoundary === "object",
      "missing packageBoundary"
    );

    for (const exportName of pkg.requiredExports) {
      addCheck(`module-export:${pkg.name}:${exportName}`, exportName in mod, `missing export ${exportName}`);
      addCheck(`readme-export:${pkg.name}:${exportName}`, readme.includes(`\`${exportName}\``), `README missing ${exportName}`);
    }

    for (const arrayName of pkg.cleanArrays) {
      const values = Array.isArray(mod[arrayName]) ? mod[arrayName] : [];
      for (const value of values) {
        addCheck(
          `clean-core-name:${pkg.name}:${arrayName}:${value}`,
          !bannedCorePattern.test(value),
          `shared core naming polluted by ${value}`
        );
      }
    }

    packageResults.push({
      name: pkg.name,
      public_api_count: Array.isArray(mod.publicApi) ? mod.publicApi.length : 0,
      depends_on: mod.packageBoundary?.dependsOn || []
    });
  }

  return packageResults;
}

async function main() {
  ensureOutputDir();

  for (const doc of requiredDocs) {
    addCheck(`exists:${doc}`, exists(doc), "missing required doc");
  }

  const sharedCanonicalModels = exists("docs/SHARED_CANONICAL_MODELS.md") ? read("docs/SHARED_CANONICAL_MODELS.md") : "";
  const sharedEnums = exists("docs/SHARED_ENUMS_AND_KEYS.md") ? read("docs/SHARED_ENUMS_AND_KEYS.md") : "";
  const sharedPackageApis = exists("docs/SHARED_PACKAGE_APIS.md") ? read("docs/SHARED_PACKAGE_APIS.md") : "";
  const sharedExamples = exists("docs/SHARED_MODEL_EXAMPLES.md") ? read("docs/SHARED_MODEL_EXAMPLES.md") : "";
  const sharedChangePolicy = exists("docs/SHARED_CHANGE_POLICY.md") ? read("docs/SHARED_CHANGE_POLICY.md") : "";
  const sharedWaves = exists("docs/SHARED_MIGRATION_WAVES.md") ? read("docs/SHARED_MIGRATION_WAVES.md") : "";
  const sharedAcceptance = exists("docs/STEP_02_ACCEPTANCE.md") ? read("docs/STEP_02_ACCEPTANCE.md") : "";
  const sharedDecisions = exists("docs/STAGE_SHARED_STEP02_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP02_DECISIONS.md") : "";

  for (const modelName of requiredModelNames) {
    addCheck(`model:${modelName}`, sharedCanonicalModels.includes(modelName), `missing model ${modelName}`);
  }

  for (const enumName of requiredEnumNames) {
    addCheck(`enum:${enumName}`, sharedEnums.includes(enumName), `missing enum ${enumName}`);
  }

  addCheck("canonical-doc:adapter-rule", /adapter/i.test(sharedCanonicalModels), "adapter rule missing");
  addCheck(
    "examples:magazine-youtube",
    sharedExamples.includes("Magazine Domain -> Shared") && sharedExamples.includes("YouTube Domain -> Shared"),
    "domain examples missing"
  );
  addCheck(
    "examples:holdbacks",
    sharedExamples.includes("timestamp anchors") &&
      sharedExamples.includes("watch-or-skip") &&
      sharedExamples.includes("input quality tier"),
    "YouTube holdbacks missing"
  );
  addCheck(
    "change-policy:definitions",
    sharedChangePolicy.includes("premature sharing") && sharedChangePolicy.includes("domain leakage"),
    "policy definitions missing"
  );
  addCheck(
    "migration-waves:count",
    sharedWaves.includes("Wave 1") &&
      sharedWaves.includes("Wave 2") &&
      sharedWaves.includes("Wave 3") &&
      sharedWaves.includes("Wave 4"),
    "wave sections missing"
  );
  addCheck(
    "migration-waves:limit",
    sharedWaves.includes("partial Wave 2") && sharedWaves.includes("Step 02 stops at"),
    "Step 02 wave limit missing"
  );
  addCheck(
    "acceptance:validator",
    sharedAcceptance.includes("validate-shared-step-02.mjs") &&
      sharedAcceptance.includes("validate-shared-step-02.ps1"),
    "acceptance validator commands missing"
  );
  addCheck("decisions:checkpoint", sharedDecisions.includes("07ca433"), "checkpoint reference missing");
  addCheck(
    "package-apis:js-first",
    sharedPackageApis.includes("JS-first") && sharedPackageApis.includes("src/index.js"),
    "JS-first package note missing"
  );

  const packageResults = await validatePackages(sharedPackageApis);

  const step02Files = collectStep02Files().filter((file) => file !== "scripts/contracts/validate-shared-step-02.mjs");
  for (const file of step02Files) {
    if (!exists(file)) {
      continue;
    }
    const text = read(file);
    if (credentialPattern.test(text)) {
      addCheck(`no-credentials:${file}`, false, "suspicious credential or remote URL found");
    }
  }

  const contractsModule = await import(
    pathToFileURL(repoPath("packages/attention-core-contracts/src/index.js")).href
  );
  addCheck(
    "cross-doc:examples-core-models",
    ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"].every((name) =>
      sharedExamples.includes(name)
    ),
    "example doc missing core shared models"
  );
  addCheck(
    "cross-doc:contracts-vocabulary",
    contractsModule.enumNames.every((name) => sharedEnums.includes(name)),
    "contracts package enum list diverges from docs"
  );

  for (const pkg of packageResults) {
    if (pkg.depends_on.includes("attention-core-harness")) {
      warn(pkg.name, "shared packages should not depend on harness");
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? "ok" : "failed",
    step: "shared-step-02",
    checked_docs: requiredDocs.length,
    checked_packages: packageResults.length,
    checks,
    warnings,
    errors,
    packages: packageResults
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
    step: "shared-step-02",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
