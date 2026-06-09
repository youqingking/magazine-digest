import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-03");
const reportPath = path.join(outputDir, "validation-report.json");

const requiredStep02Files = [
  "docs/SHARED_CANONICAL_MODELS.md",
  "docs/SHARED_ENUMS_AND_KEYS.md",
  "docs/SHARED_PACKAGE_APIS.md",
  "docs/SHARED_MODEL_EXAMPLES.md",
  "docs/SHARED_CHANGE_POLICY.md",
  "docs/SHARED_MIGRATION_WAVES.md",
  "docs/STAGE_SHARED_STEP02_DECISIONS.md",
  "docs/STEP_02_ACCEPTANCE.md",
  "packages/attention-core-contracts/src/index.js",
  "packages/attention-core-runtime/src/index.js",
  "packages/attention-core-harness/src/index.js"
];

const requiredStep03Docs = [
  "docs/SOURCE_FAMILY_LAYER.md",
  "docs/SOURCE_FAMILY_MODELS.md",
  "docs/SOURCE_FAMILY_ENUMS_AND_KEYS.md",
  "docs/SOURCE_FAMILY_PROMOTION_RULES.md",
  "docs/SOURCE_FAMILY_EXAMPLES.md",
  "docs/SOURCE_FAMILY_COMPATIBILITY.md",
  "docs/STAGE_SHARED_STEP03_DECISIONS.md",
  "docs/STEP_03_ACCEPTANCE.md"
];

const packageConfigs = [
  {
    dir: "packages/attention-family-contracts",
    name: "attention-family-contracts",
    requiredExports: [
      "packageBoundary",
      "familyNames",
      "layeringRuleNames",
      "familyModelNames",
      "familyEnumNames",
      "familyKeyNames",
      "promotionRuleNames",
      "compatibilityGuardrails",
      "publicApi"
    ],
    cleanArrays: [
      "familyNames",
      "layeringRuleNames",
      "familyModelNames",
      "familyEnumNames",
      "familyKeyNames",
      "promotionRuleNames",
      "compatibilityGuardrails",
      "publicApi"
    ]
  },
  {
    dir: "packages/attention-family-runtime",
    name: "attention-family-runtime",
    requiredExports: [
      "packageBoundary",
      "familyRegistryNames",
      "familyProjectionNames",
      "familySeamNames",
      "adapterBridgeNames",
      "publicApi"
    ],
    cleanArrays: ["familyRegistryNames", "familyProjectionNames", "familySeamNames", "adapterBridgeNames", "publicApi"]
  },
  {
    dir: "packages/attention-family-harness",
    name: "attention-family-harness",
    requiredExports: [
      "packageBoundary",
      "validationEntryNames",
      "reportShapeNames",
      "familyConsistencyRuleNames",
      "publicApi"
    ],
    cleanArrays: ["validationEntryNames", "reportShapeNames", "familyConsistencyRuleNames", "publicApi"]
  }
];

const requiredFamilyNames = [
  "transcript_first_longform",
  "official_structured_sources",
  "knowledge_community_qa",
  "open_social_expert_stream",
  "visual_inspiration_curated_asset"
];

const bannedAdapterLeakPattern = /\b(magazine|youtube|article|publication|channel|video)\b/i;
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

function changedStep02Files() {
  const output = execSync("git diff --name-only -- docs packages scripts", {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();

  const changed = output ? output.split(/\r?\n/).filter(Boolean) : [];
  return changed.filter((file) => requiredStep02Files.includes(file));
}

async function validatePackages(step03PackageDoc) {
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
    addCheck(`readme-boundary:${pkg.name}`, readme.includes("## Does Not Include"), "README missing Does Not Include section");
    addCheck(`doc-package-mention:${pkg.name}`, step03PackageDoc.includes(pkg.name), "package missing from family docs");

    const mod = await import(pathToFileURL(repoPath(entryPath)).href);

    addCheck(`module-packageName:${pkg.name}`, mod.packageName === pkg.name, "module packageName mismatch");
    addCheck(`module-publicApi:${pkg.name}`, Array.isArray(mod.publicApi) && mod.publicApi.length > 0, "missing publicApi");
    addCheck(`module-boundary:${pkg.name}`, mod.packageBoundary && typeof mod.packageBoundary === "object", "missing packageBoundary");

    for (const exportName of pkg.requiredExports) {
      addCheck(`module-export:${pkg.name}:${exportName}`, exportName in mod, `missing export ${exportName}`);
      addCheck(`readme-export:${pkg.name}:${exportName}`, readme.includes(`\`${exportName}\``), `README missing ${exportName}`);
    }

    for (const arrayName of pkg.cleanArrays) {
      const values = Array.isArray(mod[arrayName]) ? mod[arrayName] : [];
      for (const value of values) {
        addCheck(
          `clean-family-name:${pkg.name}:${arrayName}:${value}`,
          !bannedAdapterLeakPattern.test(value),
          `family package polluted by domain-specific shared term ${value}`
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

  for (const file of [...requiredStep02Files, ...requiredStep03Docs]) {
    addCheck(`exists:${file}`, exists(file), "missing required file");
  }

  const changed = changedStep02Files();
  addCheck("step02-unchanged", changed.length === 0, changed.length ? changed.join(", ") : "no Step 02 files changed");

  const layerDoc = exists("docs/SOURCE_FAMILY_LAYER.md") ? read("docs/SOURCE_FAMILY_LAYER.md") : "";
  const modelsDoc = exists("docs/SOURCE_FAMILY_MODELS.md") ? read("docs/SOURCE_FAMILY_MODELS.md") : "";
  const enumsDoc = exists("docs/SOURCE_FAMILY_ENUMS_AND_KEYS.md") ? read("docs/SOURCE_FAMILY_ENUMS_AND_KEYS.md") : "";
  const rulesDoc = exists("docs/SOURCE_FAMILY_PROMOTION_RULES.md") ? read("docs/SOURCE_FAMILY_PROMOTION_RULES.md") : "";
  const examplesDoc = exists("docs/SOURCE_FAMILY_EXAMPLES.md") ? read("docs/SOURCE_FAMILY_EXAMPLES.md") : "";
  const compatibilityDoc = exists("docs/SOURCE_FAMILY_COMPATIBILITY.md") ? read("docs/SOURCE_FAMILY_COMPATIBILITY.md") : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP03_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP03_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_03_ACCEPTANCE.md") ? read("docs/STEP_03_ACCEPTANCE.md") : "";

  addCheck("layering:shared-core-unchanged", layerDoc.includes("Step 02 shared core remains unchanged"), "layer doc missing unchanged rule");
  addCheck("layering:three-layers", layerDoc.includes("Layer 1: Shared Core") && layerDoc.includes("Layer 2: Source Family Layer") && layerDoc.includes("Layer 3: Source Adapter Layer"), "three-layer boundary missing");

  for (const familyName of requiredFamilyNames) {
    addCheck(`family:${familyName}:layer`, layerDoc.includes(familyName), `missing family ${familyName} in layer doc`);
    addCheck(`family:${familyName}:models`, modelsDoc.includes(familyName), `missing family ${familyName} in models doc`);
    addCheck(`family:${familyName}:enums`, enumsDoc.includes(familyName), `missing family ${familyName} in enums doc`);
  }

  addCheck("rules:adapter-to-family", rulesDoc.includes("Adapter -> Family"), "adapter -> family rule missing");
  addCheck("rules:family-to-shared", rulesDoc.includes("Family -> Shared"), "family -> shared rule missing");
  addCheck("rules:counterexamples", rulesDoc.includes("Non-Promotable Counterexamples"), "counterexamples missing");

  addCheck("examples:podcast", examplesDoc.includes("Podcast Transcript"), "podcast transcript example missing");
  addCheck("examples:official", examplesDoc.includes("SEC Filing"), "official structured source example missing");
  addCheck("examples:qa", examplesDoc.includes("Stack Exchange Thread"), "Q&A example missing");
  addCheck("examples:social", examplesDoc.includes("Bluesky Thread"), "open social example missing");
  addCheck("examples:visual", examplesDoc.includes("Are.na Board Asset"), "visual inspiration example missing");

  addCheck("compatibility:magazine", compatibilityDoc.includes("Magazine Compatibility"), "magazine compatibility missing");
  addCheck("compatibility:youtube", compatibilityDoc.includes("YouTube Compatibility"), "YouTube compatibility missing");
  addCheck("compatibility:retrofit", compatibilityDoc.includes("retro-fit"), "retro-fit guidance missing");

  addCheck("decisions:checkpoint", decisionsDoc.includes("f23ef9e"), "pre-step checkpoint missing");
  addCheck("decisions:shared-core", decisionsDoc.includes("shared core is not modified"), "shared-core unchanged decision missing");

  addCheck("acceptance:shared-core", acceptanceDoc.includes("Step 02 shared core is explicitly unchanged"), "acceptance missing shared-core unchanged");
  addCheck("acceptance:validator", acceptanceDoc.includes("validate-shared-step-03.mjs") && acceptanceDoc.includes("validate-shared-step-03.ps1"), "acceptance missing validator commands");

  const packageDocIndex = `${layerDoc}\n${decisionsDoc}\n${acceptanceDoc}`;
  const packageResults = await validatePackages(packageDocIndex);

  const familyContracts = await import(pathToFileURL(repoPath("packages/attention-family-contracts/src/index.js")).href);
  addCheck(
    "cross-doc:family-names",
    familyContracts.familyNames.every((name) => layerDoc.includes(name) && modelsDoc.includes(name)),
    "family package names diverge from docs"
  );

  const step03FilesToScan = [
    ...requiredStep03Docs,
    "packages/attention-family-contracts/package.json",
    "packages/attention-family-contracts/README.md",
    "packages/attention-family-contracts/src/index.js",
    "packages/attention-family-runtime/package.json",
    "packages/attention-family-runtime/README.md",
    "packages/attention-family-runtime/src/index.js",
    "packages/attention-family-harness/package.json",
    "packages/attention-family-harness/README.md",
    "packages/attention-family-harness/src/index.js",
    "scripts/contracts/validate-shared-step-03.ps1"
  ];

  for (const file of step03FilesToScan) {
    if (exists(file) && secretPattern.test(read(file))) {
      addCheck(`no-secrets:${file}`, false, "suspicious secret-like token found");
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? "ok" : "failed",
    step: "shared-step-03",
    checked_step02_files: requiredStep02Files.length,
    checked_step03_docs: requiredStep03Docs.length,
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
    step: "shared-step-03",
    checks,
    warnings,
    errors: [...errors, `exception:${error.message}`]
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
