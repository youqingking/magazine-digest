import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h1-gate");
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

function addIssue(issues, severity, code, summary, blockingGate, evidence) {
  issues.push({
    severity,
    code,
    summary,
    blocking_gate: blockingGate,
    evidence
  });
}

export function collectStageH1GateStatus() {
  fs.mkdirSync(outDir, { recursive: true });

  const requiredDocs = [
    "docs/H1_SCOPE.md",
    "docs/H1_ACCEPTANCE.md",
    "docs/H1_NON_GOALS.md",
    "docs/H1_RISKS.md",
    "docs/STAGE_H1_GATE_DECISIONS.md",
    "docs/H1_PAYMENT_READINESS.md",
    "docs/H1_SMOKE_INFRA_BOUNDARY.md"
  ];

  requiredDocs.forEach(requireFile);

  const scopeText = readFile("docs/H1_SCOPE.md");
  const acceptanceText = readFile("docs/H1_ACCEPTANCE.md");
  const nonGoalsText = readFile("docs/H1_NON_GOALS.md");
  const risksText = readFile("docs/H1_RISKS.md");
  const decisionsText = readFile("docs/STAGE_H1_GATE_DECISIONS.md");
  const readinessText = readFile("docs/H1_PAYMENT_READINESS.md");
  const boundaryText = readFile("docs/H1_SMOKE_INFRA_BOUNDARY.md");
  const authTestText = readFile("mobile/pages/auth-test/index.vue");
  const authServiceText = readFile("mobile/services/auth.service.js");
  const deviceServiceText = readFile("mobile/services/device.service.js");
  const smokeFunctionText = readFile("mobile/uniCloud-aliyun/cloudfunctions/h0_5-web-auth-smoke/index.js");
  const deviceSyncText = readFile("mobile/uniCloud-aliyun/cloudfunctions/device-sync-co/index.obj.js");

  [
    "real payment",
    "subscription activation",
    "gate prep"
  ].forEach((token) => expect(scopeText.toLowerCase().includes(token.toLowerCase()), `H1_SCOPE_MISSING:${token}`));

  [
    "planning gate",
    "implementation gate",
    "idempotency",
    "entitlements"
  ].forEach((token) => expect(acceptanceText.toLowerCase().includes(token.toLowerCase()), `H1_ACCEPTANCE_MISSING:${token}`));

  [
    "no real push operations",
    "no complex finance, revenue, or subscription dashboard",
    "no final release polish",
    "no real growth closed loop completion"
  ].forEach((token) => expect(nonGoalsText.toLowerCase().includes(token.toLowerCase()), `H1_NON_GOALS_MISSING:${token}`));

  [
    "certificate",
    "webhook",
    "idempotency",
    "smoke_only",
    "not_production_path"
  ].forEach((token) => expect(risksText.toLowerCase().includes(token.toLowerCase()), `H1_RISKS_MISSING:${token}`));

  [
    "merchant",
    "certificate",
    "placeholder",
    "implementation gate readiness: not satisfied"
  ].forEach((token) => expect(readinessText.toLowerCase().includes(token.toLowerCase()), `H1_PAYMENT_READINESS_MISSING:${token}`));

  [
    "smoke_only",
    "not_production_path",
    "future production path",
    "auth-test"
  ].forEach((token) => expect(boundaryText.toLowerCase().includes(token.toLowerCase()), `H1_BOUNDARY_MISSING:${token}`));

  [
    "AUTH_TEST_PAGE_READY",
    "AUTH_TEST_PRIMARY_ACTIONS",
    "AUTH_TEST_SUMMARY",
    "AUTH_TEST_ADVANCED_DEBUG",
    "Auto login",
    "Open password login",
    "Verify device records",
    "smoke_only",
    "not_production_path"
  ].forEach((token) => expect(authTestText.includes(token), `AUTH_TEST_LAYOUT_MISSING:${token}`));

  [
    "runWebPasswordAutomation",
    "smoke_only",
    "not_production_path"
  ].forEach((token) => expect(authServiceText.includes(token), `AUTH_SERVICE_BOUNDARY_MISSING:${token}`));

  [
    "precheck_blocked",
    "uni-id-co.setPushCid",
    "device-sync-co.registerDevice"
  ].forEach((token) => expect(deviceServiceText.includes(token), `DEVICE_SERVICE_FOUNDATION_MISSING:${token}`));

  [
    "smoke_only",
    "not_production_path",
    "h0_5-web-auth-smoke"
  ].forEach((token) => expect(smokeFunctionText.includes(token), `H0_5_WEB_AUTH_BOUNDARY_MISSING:${token}`));

  [
    "smoke_only",
    "verifyCurrentDeviceRecords",
    "device-sync-co.registerDevice"
  ].forEach((token) => expect(deviceSyncText.includes(token), `DEVICE_SYNC_BOUNDARY_MISSING:${token}`));

  const issues = [];
  addIssue(
    issues,
    "blocker",
    "PAYMENT_PROVIDER_CREDENTIALS_MISSING",
    "Merchant identifiers, certificates, and webhook secrets are still placeholder or manual-only.",
    "implementation",
    [
      "docs/H1_PAYMENT_READINESS.md",
      "backend/config/remote-runtime-config.mjs",
      ".env.example",
      "mobile/.env.example"
    ]
  );
  addIssue(
    issues,
    "blocker",
    "REAL_BILLING_PATH_NOT_IMPLEMENTED",
    "Real create-order, confirmation, webhook handling, and entitlement activation remain intentionally absent in Gate Prep.",
    "implementation",
    [
      "docs/H1_SCOPE.md",
      "docs/H1_ACCEPTANCE.md",
      "docs/H1_PAYMENT_READINESS.md"
    ]
  );
  addIssue(
    issues,
    "warning",
    "SMOKE_AUTH_NOT_PRODUCTION",
    "H0.5 auth automation proves smoke coverage only and must stay outside the H1 production-path definition.",
    "none",
    [
      "docs/H1_SMOKE_INFRA_BOUNDARY.md",
      "mobile/pages/auth-test/index.vue",
      "mobile/services/auth.service.js",
      "mobile/uniCloud-aliyun/cloudfunctions/h0_5-web-auth-smoke/index.js"
    ]
  );

  fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2) + "\n", "utf8");

  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length;
  const planningGatePass = true;
  const implementationGatePass = blockerCount === 0;

  return {
    status: "ok",
    stage: "H1_GATE_PREP",
    generated_at: new Date().toISOString(),
    required_docs: requiredDocs.length,
    auth_test_layout_ready: true,
    smoke_boundary_documented: true,
    planning_gate_pass: planningGatePass,
    implementation_gate_pass: implementationGatePass,
    issue_count: issues.length,
    blocker_count: blockerCount,
    issues_path: path.relative(repoRoot, issuesPath).replace(/\\/g, "/"),
    output_dir: path.relative(repoRoot, outDir).replace(/\\/g, "/")
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const report = collectStageH1GateStatus();
  console.log(JSON.stringify(report, null, 2));
}
