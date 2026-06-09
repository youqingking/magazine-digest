import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectStageH1GateStatus } from "../contracts/validate-stage-h1-gate.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h1-gate");
const reportPath = path.join(outDir, "h1-gate-report.json");
const issuesPath = path.join(outDir, "issues.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function runStageH1GateSmoke() {
  fs.mkdirSync(outDir, { recursive: true });

  const validation = collectStageH1GateStatus();
  const issues = fs.existsSync(issuesPath) ? readJson(issuesPath) : [];
  const blockerIssues = issues.filter((issue) => issue.severity === "blocker");

  const report = {
    status: "ok",
    stage: "H1_GATE_PREP",
    generated_at: new Date().toISOString(),
    gate_docs_complete: true,
    harness_structure_pass: validation.auth_test_layout_ready,
    smoke_boundary_documented: validation.smoke_boundary_documented,
    readiness: {
      planning_gate: validation.planning_gate_pass ? "YES" : "NO",
      implementation_gate: validation.implementation_gate_pass ? "YES" : "NO"
    },
    issues_summary: {
      total: issues.length,
      blockers: blockerIssues.length,
      warnings: issues.filter((issue) => issue.severity === "warning").length
    },
    referenced_artifacts: {
      h0_5_automation_report: fs.existsSync(path.join(repoRoot, "output", "stage-h0_5", "automation-report.json")),
      h0_5_readiness_report: fs.existsSync(path.join(repoRoot, "output", "stage-h0_5-readiness", "device-readiness.json")),
      h0_5_h5_report: fs.existsSync(path.join(repoRoot, "output", "stage-h0_5-h5", "device-diagnostics-report.json"))
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
  return report;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  runStageH1GateSmoke();
}
