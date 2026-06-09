import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { opsPaths, readCurrentMeta, readJsonOr, readSelected, writeJson } from "../ops/lib/ops-lib.mjs";
import { pipelinePaths } from "../import/lib/content-pipeline.mjs";

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

function runNodeAllowFailure(scriptPath, args = []) {
  try {
    return runNode(scriptPath, args);
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
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
const scenarioIndexPath = pipelinePaths.runtimeScenarioIndex;
const currentMetaPath = path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json");
const currentBundlePath = path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json");
const before = {
  selected: snapshot(selectedPath),
  index: snapshot(scenarioIndexPath),
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

  const compare = runNode(path.join(repoRoot, "scripts", "ops", "compare-scenarios.mjs"), [
    "--from", "data1a_readers_digest_12112025",
    "--to", "data1c_three_release_mixed_preview"
  ]);
  report.checks.compare_baseline_vs_mixed = {
    status: compare.status,
    article_delta: compare.diff.comparisons[0].counts.article_count.delta,
    warning_count: compare.diff.comparisons[0].warnings.length
  };

  const evaluatePromotable = runNode(path.join(repoRoot, "scripts", "ops", "evaluate-promotion.mjs"), [
    "--scenario", "data1c_barrons_09022026",
    "--use-existing-reports"
  ]);
  const evaluateMixed = runNode(path.join(repoRoot, "scripts", "ops", "evaluate-promotion.mjs"), [
    "--scenario", "data1c_three_release_mixed_preview",
    "--use-existing-reports"
  ]);
  report.checks.evaluate_decisions = {
    promotable_single: evaluatePromotable.evaluation.decision,
    mixed: evaluateMixed.evaluation.decision
  };

  const dryRun = runNodeAllowFailure(path.join(repoRoot, "scripts", "ops", "promote-scenario.mjs"), [
    "--scenario", "data1c_three_release_mixed_preview",
    "--dry-run",
    "--use-existing-reports"
  ]);
  const afterDryRunSelected = readSelected().selected_scenario_id || null;
  const afterDryRunCurrent = readCurrentMeta().selected_scenario_id || null;
  report.checks.dry_run_hold = {
    status: dryRun.status,
    selected_unchanged: afterDryRunSelected === beforeSelected,
    current_unchanged: afterDryRunCurrent === beforeCurrent
  };

  const missing = runNodeAllowFailure(path.join(repoRoot, "scripts", "ops", "promote-scenario.mjs"), [
    "--scenario", "does_not_exist",
    "--dry-run",
    "--use-existing-reports"
  ]);
  const missingBlocked = missing.status === "blocked";
  report.checks.missing_scenario_blocked = { blocked: missingBlocked };

  const rollback = runNode(path.join(repoRoot, "scripts", "ops", "rollback-scenario.mjs"), [
    "--scenario", "data1a_readers_digest_12112025"
  ]);
  report.checks.rollback_to_baseline = {
    status: rollback.status,
    current_after_rollback: readCurrentMeta().selected_scenario_id || null
  };

  const dashboard = readJsonOr(opsPaths.ops2PromotionDashboard, null);
  const history = readJsonOr(opsPaths.ops2PromotionHistory, { items: [] });
  report.checks.dashboard_outputs = {
    dashboard_present: Boolean(dashboard),
    history_items: (history.items || []).length
  };

  const pass =
    report.checks.compare_baseline_vs_mixed.status === "ok" &&
    report.checks.evaluate_decisions.promotable_single === "promotable" &&
    report.checks.evaluate_decisions.mixed === "hold_warning" &&
    report.checks.dry_run_hold.status === "warning_requires_override" &&
    report.checks.dry_run_hold.selected_unchanged &&
    report.checks.dry_run_hold.current_unchanged &&
    report.checks.missing_scenario_blocked.blocked &&
    report.checks.rollback_to_baseline.current_after_rollback === "data1a_readers_digest_12112025";

  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
} finally {
  restore(selectedPath, before.selected);
  restore(scenarioIndexPath, before.index);
  restore(currentMetaPath, before.currentMeta);
  restore(currentBundlePath, before.currentBundle);
}

writeJson(opsPaths.ops2SmokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "OPS2_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
