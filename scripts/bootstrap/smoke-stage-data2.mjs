import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { pipelinePaths } from "../import/lib/content-pipeline.mjs";
import { opsPaths, readCurrentMeta, readJsonOr, readSelected } from "../ops/lib/ops-lib.mjs";
import { qualityPaths, writeQualityReport } from "../ops/lib/quality-budget-lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function runNode(scriptPath, args = []) {
  const output = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(output);
}

function snapshot(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}

function restore(filePath, content) {
  if (content === null) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const selectedPath = pipelinePaths.runtimeScenarioSelected;
const currentMetaPath = path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json");
const currentBundlePath = path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json");
const before = {
  selected: snapshot(selectedPath),
  currentMeta: snapshot(currentMetaPath),
  currentBundle: snapshot(currentBundlePath)
};

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

try {
  const beforeSelected = readSelected().selected_scenario_id || null;
  const beforeCurrent = readCurrentMeta().selected_scenario_id || null;

  report.checks.quality_drift = runNode(path.join(repoRoot, "scripts", "ops", "show-quality-drift.mjs")).status;
  report.checks.release_candidate = runNode(path.join(repoRoot, "scripts", "ops", "build-release-candidate.mjs")).status;
  report.checks.warning_budget = runNode(path.join(repoRoot, "scripts", "ops", "show-warning-budget.mjs")).status;

  const mixedEvaluation = runNode(path.join(repoRoot, "scripts", "ops", "evaluate-promotion.mjs"), [
    "--scenario", "data1c_three_release_mixed_preview",
    "--use-existing-reports"
  ]);
  const rcEvaluation = runNode(path.join(repoRoot, "scripts", "ops", "evaluate-promotion.mjs"), [
    "--scenario", "data2_multi_publication_release_candidate",
    "--use-existing-reports"
  ]);
  const rcDryRun = runNode(path.join(repoRoot, "scripts", "ops", "promote-scenario.mjs"), [
    "--scenario", "data2_multi_publication_release_candidate",
    "--dry-run",
    "--use-existing-reports"
  ]);

  report.checks.mixed_preview = {
    decision: mixedEvaluation.evaluation.decision,
    warnings: mixedEvaluation.evaluation.warnings
  };
  report.checks.release_candidate_eval = {
    decision: rcEvaluation.evaluation.decision,
    warnings: rcEvaluation.evaluation.warnings
  };
  report.checks.release_candidate_dry_run = {
    status: rcDryRun.status,
    selected_unchanged: (readSelected().selected_scenario_id || null) === beforeSelected,
    current_unchanged: (readCurrentMeta().selected_scenario_id || null) === beforeCurrent
  };

  const readinessReport = {
    generated_at: new Date().toISOString(),
    mixed_preview: mixedEvaluation.evaluation,
    release_candidate: rcEvaluation.evaluation
  };
  writeQualityReport(qualityPaths.promotionReadinessReport, readinessReport);

  const pass =
    report.checks.quality_drift === "ok" &&
    report.checks.warning_budget === "ok" &&
    report.checks.release_candidate === "ok" &&
    report.checks.mixed_preview.decision === "hold_warning" &&
    report.checks.release_candidate_eval.decision === "promotable" &&
    report.checks.release_candidate_dry_run.status === "ok" &&
    report.checks.release_candidate_dry_run.selected_unchanged &&
    report.checks.release_candidate_dry_run.current_unchanged;

  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
} finally {
  restore(selectedPath, before.selected);
  restore(currentMetaPath, before.currentMeta);
  restore(currentBundlePath, before.currentBundle);
}

writeQualityReport(qualityPaths.smokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "DATA2_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
