import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputRoot = path.join(repoRoot, "output", "stage-test2");
fs.mkdirSync(outputRoot, { recursive: true });
const profiles = JSON.parse(fs.readFileSync(path.join(repoRoot, "scripts", "lib", "script-profiles.json"), "utf8"));

function runJson(command, args = [], allowFailure = false) {
  try {
    const output = execFileSync(process.execPath, [command, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024
    });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure && error.stdout) return JSON.parse(String(error.stdout));
    throw error;
  }
}

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

const beforeCurrent = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile/fixtures/runtime/current/scenario-meta.json"), "utf8")).selected_scenario_id;
const beforeSelected = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile/fixtures/runtime/scenarios/selected.json"), "utf8")).selected_scenario_id;

try {
  report.checks.parallel_read_only = runJson(path.join(repoRoot, "scripts", "ops", "run-automation-suite.mjs"), ["--suite", "parallel-read-only"]).suite;
  report.checks.stateful_conflict = runJson(path.join(repoRoot, "scripts", "ops", "run-automation-suite.mjs"), ["--suite", "stateful-conflict"]).suite;
  report.checks.apply_drill = runJson(path.join(repoRoot, "scripts", "ops", "apply-promotion-drill.mjs"), ["--scenario", "data2_multi_publication_release_candidate"]).drill.status;
  const afterCurrent = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile/fixtures/runtime/current/scenario-meta.json"), "utf8")).selected_scenario_id;
  const afterSelected = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile/fixtures/runtime/scenarios/selected.json"), "utf8")).selected_scenario_id;
  report.checks.recovery = {
    current_restored: afterCurrent === "data1a_readers_digest_12112025",
    selected_restored: afterSelected === "data1a_readers_digest_12112025",
    unchanged_from_before: beforeCurrent === afterCurrent && beforeSelected === afterSelected
  };
  report.checks.artifacts = {
    orchestration_report: fs.existsSync(path.join(outputRoot, "orchestration-report.json"))
  };
  const isolationReport = {
    generated_at: new Date().toISOString(),
    read_only: Object.entries(profiles.scripts).filter(([, value]) => value.profile === "read_only").map(([key]) => key),
    report_only: Object.entries(profiles.scripts).filter(([, value]) => value.profile === "report_only").map(([key]) => key),
    stateful: Object.entries(profiles.scripts).filter(([, value]) => value.profile.startsWith("stateful")).map(([key]) => key),
    sandbox_root_pattern: "output/runs/<run-id>/..."
  };
  const lockingReport = {
    generated_at: new Date().toISOString(),
    lock_name: "runtime-state",
    protected_paths: [
      "mobile/fixtures/runtime/current/*",
      "mobile/fixtures/runtime/scenarios/selected.json",
      "mobile/fixtures/runtime/scenarios/index.json",
      "output/stage-ops1/publish-history.json",
      "output/stage-ops2/promotion-history.json"
    ],
    atomic_writes: [
      "selected pointer",
      "current mirror json/text files",
      "canonical reports",
      "publish history"
    ]
  };
  const concurrencyReport = {
    generated_at: new Date().toISOString(),
    parallel_read_only: report.checks.parallel_read_only,
    stateful_conflict: report.checks.stateful_conflict
  };
  const recoveryReport = {
    generated_at: new Date().toISOString(),
    baseline_scenario_id: "data1a_readers_digest_12112025",
    recovery: report.checks.recovery,
    failed_run_sandboxes_retained: true
  };
  fs.writeFileSync(path.join(outputRoot, "isolation-report.json"), JSON.stringify(isolationReport, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(outputRoot, "locking-report.json"), JSON.stringify(lockingReport, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(outputRoot, "concurrency-report.json"), JSON.stringify(concurrencyReport, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(outputRoot, "recovery-report.json"), JSON.stringify(recoveryReport, null, 2) + "\n", "utf8");
  const pass =
    report.checks.parallel_read_only.status === "passed" &&
    report.checks.stateful_conflict.status === "passed" &&
    report.checks.apply_drill === "passed" &&
    report.checks.recovery.current_restored &&
    report.checks.recovery.selected_restored;
  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
}

fs.writeFileSync(path.join(outputRoot, "smoke-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
if (report.status !== "passed") throw new Error(report.error || "TEST2_SMOKE_FAILED");
console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
