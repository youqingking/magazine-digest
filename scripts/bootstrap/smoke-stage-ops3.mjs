import fs from "node:fs";

import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";
import {
  defaultTargetScenarioId,
  ops3Paths,
  restoreRuntimeFiles,
  runNodeJson,
  runNodeJsonAllowFailure,
  snapshotRuntimeFiles,
  writeOps3Json
} from "../ops/lib/ops3-lib.mjs";

const before = snapshotRuntimeFiles();
const baselineScenarioId = "data1a_readers_digest_12112025";
const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

try {
  const drill = runNodeJson(new URL("../ops/apply-promotion-drill.mjs", import.meta.url), [
    "--scenario", defaultTargetScenarioId(),
    "--baseline", baselineScenarioId
  ]);
  report.checks.apply_drill = {
    status: drill.status,
    final_current: readCurrentMeta().selected_scenario_id || null,
    final_selected: readSelected().selected_scenario_id || null
  };

  const mixedReject = runNodeJsonAllowFailure(new URL("../ops/promote-scenario.mjs", import.meta.url), [
    "--scenario", "data1c_three_release_mixed_preview",
    "--apply",
    "--use-existing-reports"
  ]);
  report.checks.preview_only_reject = {
    status: mixedReject.status,
    decision: mixedReject.promotion?.decision || null,
    current_unchanged: (readCurrentMeta().selected_scenario_id || null) === baselineScenarioId,
    selected_unchanged: (readSelected().selected_scenario_id || null) === baselineScenarioId
  };

  report.checks.artifacts = {
    release_notes: fs.existsSync(ops3Paths.releaseNotes),
    release_manifest: fs.existsSync(ops3Paths.releaseManifest),
    pre_publish_snapshot: fs.existsSync(ops3Paths.prePublishSnapshot),
    post_publish_snapshot: fs.existsSync(ops3Paths.postPublishSnapshot),
    post_rollback_snapshot: fs.existsSync(ops3Paths.postRollbackSnapshot),
    drill_report: fs.existsSync(ops3Paths.drillReport),
    publish_history: fs.existsSync(ops3Paths.publishHistory),
    dashboard: fs.existsSync(ops3Paths.dashboard)
  };

  const pass =
    report.checks.apply_drill.status === "ok" &&
    report.checks.apply_drill.final_current === baselineScenarioId &&
    report.checks.apply_drill.final_selected === baselineScenarioId &&
    report.checks.preview_only_reject.status === "warning_requires_override" &&
    report.checks.preview_only_reject.current_unchanged &&
    report.checks.preview_only_reject.selected_unchanged &&
    Object.values(report.checks.artifacts).every(Boolean);

  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
} finally {
  restoreRuntimeFiles(before);
}

writeOps3Json(ops3Paths.smokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "OPS3_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
