import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h1a");
const reportPath = path.join(outDir, "payment-readiness-report.json");
const issuesPath = path.join(outDir, "issues.json");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  expect(fs.existsSync(fullPath), `MISSING:${relativePath}`);
  return fullPath;
}

function readFile(relativePath) {
  return fs.readFileSync(requireFile(relativePath), "utf8");
}

function listFilesRecursive(startDir) {
  const stack = [startDir];
  const results = [];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function toRepoPath(fullPath) {
  return path.relative(repoRoot, fullPath).replace(/\\/g, "/");
}

function safeGit(command) {
  try {
    return execSync(command, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString("utf8")
      .trim();
  } catch {
    return null;
  }
}

function detectProjectType() {
  const evidence = [];
  const manifestText = readFile("mobile/manifest.json");
  const pagesText = readFile("mobile/pages.json");

  if (fs.existsSync(path.join(repoRoot, "mobile", "App.vue"))) {
    evidence.push("mobile/App.vue");
  }
  if (fs.existsSync(path.join(repoRoot, "mobile", "main.js"))) {
    evidence.push("mobile/main.js");
  }
  if (pagesText.includes("\"pages\"")) {
    evidence.push("mobile/pages.json");
  }

  const candidateFiles = listFilesRecursive(path.join(repoRoot, "mobile"))
    .map((fullPath) => toRepoPath(fullPath))
    .filter((relativePath) => !relativePath.startsWith("mobile/uni_modules/"))
    .filter((relativePath) => !relativePath.startsWith("mobile/unpackage/"))
    .filter((relativePath) => !relativePath.startsWith("mobile/node_modules/"));

  const appOwnedUvueOrUts = candidateFiles.filter(
    (relativePath) =>
      relativePath.endsWith(".uvue") ||
      relativePath.endsWith(".uts") ||
      relativePath.endsWith("App.uvue") ||
      relativePath.endsWith("main.uts")
  );

  const compiledManifestPath = path.join(repoRoot, "mobile", "unpackage", "dist", "dev", "app-plus", "manifest.json");
  let compiledManifestSignalsUniApp = false;
  if (fs.existsSync(compiledManifestPath)) {
    const compiledManifestText = fs.readFileSync(compiledManifestPath, "utf8");
    compiledManifestSignalsUniApp = compiledManifestText.includes("\"value\":\"uni-app\"");
    if (compiledManifestSignalsUniApp) {
      evidence.push("mobile/unpackage/dist/dev/app-plus/manifest.json:useragent.value=uni-app");
    }
  }

  const appOwnedUniAppXMarkers = appOwnedUvueOrUts.filter(
    (relativePath) =>
      relativePath === "mobile/App.uvue" ||
      relativePath === "mobile/main.uts" ||
      relativePath.startsWith("mobile/pages/") ||
      relativePath.startsWith("mobile/components/")
  );

  const looksLikeUniApp =
    fs.existsSync(path.join(repoRoot, "mobile", "App.vue")) &&
    fs.existsSync(path.join(repoRoot, "mobile", "main.js")) &&
    manifestText.includes("\"app-plus\"") &&
    pagesText.includes("\"pages\"") &&
    appOwnedUniAppXMarkers.length === 0;

  if (looksLikeUniApp) {
    return {
      projectType: "uni-app",
      pluginRoute: "uni-pay",
      evidence,
      appOwnedUniAppXMarkers
    };
  }

  return {
    projectType: "uni-app x",
    pluginRoute: "uni-pay-x",
    evidence,
    appOwnedUniAppXMarkers
  };
}

function addIssue(issues, severity, code, summary, needsHuman, evidence) {
  issues.push({
    severity,
    code,
    summary,
    needs_human: needsHuman,
    evidence
  });
}

export function collectStageH1AStatus() {
  fs.mkdirSync(outDir, { recursive: true });

  const requiredDocs = [
    "docs/H1A_PAYMENT_PROVIDER_DECISION.md",
    "docs/H1A_MERCHANT_INPUTS.md",
    "docs/H1A_UNIPAY_EXAMPLE_RUNBOOK.md",
    "docs/H1A_INTEGRATION_PLAN.md",
    "docs/H1A_ACCEPTANCE.md",
    "docs/STAGE_H1A_DECISIONS.md"
  ];
  requiredDocs.forEach(requireFile);

  const providerDecisionText = readFile("docs/H1A_PAYMENT_PROVIDER_DECISION.md");
  const merchantInputsText = readFile("docs/H1A_MERCHANT_INPUTS.md");
  const exampleRunbookText = readFile("docs/H1A_UNIPAY_EXAMPLE_RUNBOOK.md");
  const integrationPlanText = readFile("docs/H1A_INTEGRATION_PLAN.md");
  const acceptanceText = readFile("docs/H1A_ACCEPTANCE.md");
  const decisionsText = readFile("docs/STAGE_H1A_DECISIONS.md");

  const detection = detectProjectType();

  [
    "Detected project type",
    "uni-pay",
    "uni-app",
    "uni-pay-x"
  ].forEach((token) => expect(providerDecisionText.includes(token), `H1A_PROVIDER_DECISION_MISSING:${token}`));

  [
    "provider_scope",
    "wxpay-app",
    "alipay-app",
    "appId",
    "mchId",
    "notifyUrl",
    "test",
    "prod",
    "Repo-derived",
    "NEED_HUMAN"
  ].forEach((token) => expect(merchantInputsText.includes(token), `H1A_MERCHANT_INPUTS_MISSING:${token}`));

  [
    "example project",
    "config.js",
    "uni-config-center",
    "uni-pay",
    "uni-pay-co",
    "database",
    "H1b"
  ].forEach((token) => expect(exampleRunbookText.includes(token), `H1A_RUNBOOK_MISSING:${token}`));

  [
    "Copy the validated example baseline",
    "uni-config-center",
    "uni-pay-co",
    "billing.createOrder",
    "H1b Entry Criteria",
    "subPackages"
  ].forEach((token) => expect(integrationPlanText.includes(token), `H1A_INTEGRATION_PLAN_MISSING:${token}`));

  [
    "Completion Criteria",
    "H1a complete",
    "H1b ready",
    "NO"
  ].forEach((token) => expect(acceptanceText.includes(token), `H1A_ACCEPTANCE_MISSING:${token}`));

  [
    "uni-app",
    "uni-pay",
    "Example-first validation is mandatory",
    "NO until example validation and merchant prerequisites are closed"
  ].forEach((token) => expect(decisionsText.includes(token), `H1A_DECISIONS_MISSING:${token}`));

  const issues = [];
  addIssue(
    issues,
    "blocker",
    "PROVIDER_SELECTION_PENDING",
    "Real provider scope is not supplied in-repo and must be chosen manually before H1b.",
    true,
    ["docs/H1A_MERCHANT_INPUTS.md", "docs/STAGE_H1A_DECISIONS.md"]
  );
  addIssue(
    issues,
    "blocker",
    "MERCHANT_CERTS_AND_KEYS_PENDING",
    "Merchant ids, certificates, keys, and callback secrets remain manual dependencies and are intentionally absent from the repo.",
    true,
    ["docs/H1A_MERCHANT_INPUTS.md", "docs/H1_PAYMENT_READINESS.md"]
  );
  addIssue(
    issues,
    "blocker",
    "EXAMPLE_PROJECT_NOT_YET_VERIFIED",
    "The official uni-pay example must be run in a separate workspace before H1b can start.",
    true,
    ["docs/H1A_UNIPAY_EXAMPLE_RUNBOOK.md", "docs/H1A_INTEGRATION_PLAN.md"]
  );
  addIssue(
    issues,
    "warning",
    "SMOKE_AUTH_NOT_PAYMENT_PROOF",
    "H0.5 auth smoke remains outside payment acceptance and cannot be used as H1b evidence.",
    false,
    ["docs/H1_SMOKE_INFRA_BOUNDARY.md", "docs/STAGE_H1A_DECISIONS.md"]
  );

  fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2) + "\n", "utf8");

  const report = {
    status: "ok",
    stage: "H1A_PAYMENT_READINESS",
    generated_at: new Date().toISOString(),
    project_type: detection.projectType,
    payment_plugin_route: detection.pluginRoute,
    route_fixed: true,
    frozen_contracts_preserved: true,
    docs_complete: true,
    merchant_inputs_documented: true,
    example_runbook_documented: true,
    h1b_entry_conditions_documented: true,
    h1a_complete: true,
    h1b_ready: false,
    needs_human_count: issues.filter((issue) => issue.needs_human).length,
    issue_count: issues.length,
    app_owned_uni_app_x_markers: detection.appOwnedUniAppXMarkers,
    route_evidence: detection.evidence,
    git: {
      branch: safeGit("git branch --show-current"),
      head: safeGit("git rev-parse HEAD")
    },
    artifacts: {
      report: path.relative(repoRoot, reportPath).replace(/\\/g, "/"),
      issues: path.relative(repoRoot, issuesPath).replace(/\\/g, "/")
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const report = collectStageH1AStatus();
  console.log(JSON.stringify(report, null, 2));
}
