import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";
import { data3Paths, readData3Json, writeData3Json } from "../ops/lib/taxonomy-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runJson(scriptPath, args = []) {
  const output = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024
  });
  return JSON.parse(output);
}

const beforeSelected = readSelected().selected_scenario_id || null;
const beforeCurrent = readCurrentMeta().selected_scenario_id || null;
const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

try {
  report.checks.apply_taxonomy = runJson(path.join(repoRoot, "scripts", "ops", "apply-taxonomy-normalization.mjs")).status;
  report.checks.coverage = runJson(path.join(repoRoot, "scripts", "ops", "report-taxonomy-coverage.mjs"));
  report.checks.promotion = runJson(path.join(repoRoot, "scripts", "ops", "evaluate-promotion.mjs"), [
    "--scenario", "data2_multi_publication_release_candidate",
    "--use-existing-reports"
  ]);

  const coverageReport = readData3Json(data3Paths.taxonomyCoverageReport, { scenarios: [] });
  const candidateCoverage = (coverageReport.scenarios || []).find((item) => item.scenario_id === "data2_multi_publication_release_candidate") || null;
  const mixedCoverage = (coverageReport.scenarios || []).find((item) => item.scenario_id === "data1c_three_release_mixed_preview") || null;

  report.checks.candidate = {
    mapped_ratio: candidateCoverage?.mapped_ratio ?? 0,
    unmapped_count: candidateCoverage?.unmapped_count ?? null,
    decision: report.checks.promotion.evaluation?.decision || null
  };
  report.checks.mixed_preview = {
    mapped_ratio: mixedCoverage?.mapped_ratio ?? 0,
    unmapped_count: mixedCoverage?.unmapped_count ?? null
  };
  report.checks.runtime_state = {
    selected_unchanged: (readSelected().selected_scenario_id || null) === beforeSelected,
    current_unchanged: (readCurrentMeta().selected_scenario_id || null) === beforeCurrent
  };
  report.checks.artifacts = {
    coverage: fs.existsSync(data3Paths.taxonomyCoverageReport),
    discovery_quality: fs.existsSync(data3Paths.discoveryQualityReport),
    unmapped: fs.existsSync(data3Paths.unmappedSectionsReport),
    drift: fs.existsSync(data3Paths.taxonomyDriftReport)
  };

  const pass =
    report.checks.apply_taxonomy === "ok" &&
    report.checks.candidate.decision === "promotable" &&
    report.checks.candidate.unmapped_count === 0 &&
    report.checks.runtime_state.selected_unchanged &&
    report.checks.runtime_state.current_unchanged &&
    Object.values(report.checks.artifacts).every(Boolean);

  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
}

writeData3Json(data3Paths.smokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "DATA3_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
