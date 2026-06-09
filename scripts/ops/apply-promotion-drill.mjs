import { readCurrentMeta, readSelected, resolveBaselineScenarioId } from "./lib/ops-lib.mjs";
import {
  buildOps3Dashboard,
  buildOps3DrillReport,
  buildOps3PublishHistory,
  buildReleaseManifest,
  buildScenarioProvenanceSnapshot,
  defaultRejectScenarioId,
  defaultTargetScenarioId,
  ops3Paths,
  parseArgs,
  runNodeJson,
  runNodeJsonAllowFailure
} from "./lib/ops3-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario || defaultTargetScenarioId();
const rejectScenarioId = args.reject || defaultRejectScenarioId();
const baselineScenarioId = args.baseline || resolveBaselineScenarioId();
const drillHistory = [];

function record(action, result, payload = {}) {
  drillHistory.push({
    timestamp: new Date().toISOString(),
    action,
    result,
    ...payload
  });
}

function fail(message, extra = {}) {
  const report = buildOps3DrillReport({
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    baseline_scenario_id: baselineScenarioId,
    status: "failed",
    error: message,
    history: drillHistory,
    ...extra
  });
  console.log(JSON.stringify({ status: "failed", drill: report }, null, 2));
  process.exit(2);
}

const initialState = {
  selected_scenario_id: readSelected().selected_scenario_id || null,
  current_scenario_id: readCurrentMeta().selected_scenario_id || null
};

try {
  const inspect = runNodeJson(new URL("./inspect-scenario.mjs", import.meta.url), ["--scenario", scenarioId]);
  record("inspect", inspect.status, { scenario_id: scenarioId });

  const compare = runNodeJson(new URL("./compare-scenarios.mjs", import.meta.url), ["--from", baselineScenarioId, "--to", scenarioId]);
  record("compare", compare.status, {
    scenario_id: scenarioId,
    comparison_warnings: compare.diff.comparisons?.[0]?.warnings?.map((item) => item.code) || []
  });

  const gate = runNodeJson(new URL("./run-gate.mjs", import.meta.url), ["--scenario", scenarioId]);
  record("gate", gate.status, {
    scenario_id: scenarioId,
    gate_status: gate.gate?.status || null
  });

  const evaluation = runNodeJson(new URL("./evaluate-promotion.mjs", import.meta.url), [
    "--scenario", scenarioId,
    "--use-existing-reports"
  ]);
  record("evaluate", evaluation.status, {
    scenario_id: scenarioId,
    decision: evaluation.evaluation?.decision || null
  });

  if (evaluation.evaluation?.decision !== "promotable") {
    fail("OPS3_CANDIDATE_NOT_PROMOTABLE", { evaluation: evaluation.evaluation });
  }

  const manifestResult = runNodeJson(new URL("./show-release-manifest.mjs", import.meta.url), [
    "--scenario", scenarioId,
    "--baseline", baselineScenarioId,
    "--use-existing-reports"
  ]);
  const manifest = manifestResult.release_manifest || buildReleaseManifest({
    scenarioId,
    baselineScenarioId,
    refresh: false
  });
  record("manifest", manifestResult.status, { scenario_id: scenarioId });

  const releaseNotes = runNodeJson(new URL("./generate-release-notes.mjs", import.meta.url), [
    "--scenario", scenarioId,
    "--baseline", baselineScenarioId,
    "--use-existing-reports"
  ]);
  record("release_notes", releaseNotes.status, { scenario_id: scenarioId });

  const prePublishSnapshot = buildScenarioProvenanceSnapshot({
    label: "pre-publish",
    targetScenarioId: scenarioId,
    baselineScenarioId,
    operatorAction: "ops3_pre_publish_snapshot",
    gateResult: evaluation.evaluation.gate?.status || null,
    promotionDecision: evaluation.evaluation.decision,
    notes: ["Pre-apply snapshot for OPS3 drill."]
  });
  record("snapshot_pre_publish", "ok", {
    current_scenario_id: prePublishSnapshot.current_mirror_scenario_id
  });

  const apply = runNodeJson(new URL("./promote-scenario.mjs", import.meta.url), [
    "--scenario", scenarioId,
    "--apply",
    "--use-existing-reports"
  ]);
  record("promote_apply", apply.status, {
    scenario_id: scenarioId,
    decision: apply.promotion?.decision || null
  });

  const afterApplySelected = readSelected().selected_scenario_id || null;
  const afterApplyCurrent = readCurrentMeta().selected_scenario_id || null;
  if (afterApplySelected !== scenarioId || afterApplyCurrent !== scenarioId) {
    fail("OPS3_APPLY_STATE_MISMATCH", {
      expected_scenario_id: scenarioId,
      after_apply_selected: afterApplySelected,
      after_apply_current: afterApplyCurrent
    });
  }

  const postPublishSnapshot = buildScenarioProvenanceSnapshot({
    label: "post-publish",
    targetScenarioId: scenarioId,
    baselineScenarioId,
    operatorAction: "ops3_publish_apply",
    gateResult: apply.promotion?.gate?.status || evaluation.evaluation.gate?.status || null,
    promotionDecision: apply.promotion?.decision || evaluation.evaluation.decision,
    publishTimestamp: readCurrentMeta().published_to_current_at || null,
    notes: ["Post-apply snapshot for OPS3 drill."]
  });
  record("snapshot_post_publish", "ok", {
    current_scenario_id: postPublishSnapshot.current_mirror_scenario_id
  });

  const rollback = runNodeJson(new URL("./rollback-scenario.mjs", import.meta.url), [
    "--scenario", baselineScenarioId
  ]);
  record("rollback", rollback.status, { scenario_id: baselineScenarioId });

  const afterRollbackSelected = readSelected().selected_scenario_id || null;
  const afterRollbackCurrent = readCurrentMeta().selected_scenario_id || null;
  if (afterRollbackSelected !== baselineScenarioId || afterRollbackCurrent !== baselineScenarioId) {
    fail("OPS3_ROLLBACK_STATE_MISMATCH", {
      expected_scenario_id: baselineScenarioId,
      after_rollback_selected: afterRollbackSelected,
      after_rollback_current: afterRollbackCurrent
    });
  }

  const postRollbackSnapshot = buildScenarioProvenanceSnapshot({
    label: "post-rollback",
    targetScenarioId: baselineScenarioId,
    baselineScenarioId,
    operatorAction: "ops3_publish_rollback",
    gateResult: "not_applicable",
    promotionDecision: "rolled_back",
    publishTimestamp: readCurrentMeta().published_to_current_at || null,
    notes: ["Baseline restored after OPS3 drill."]
  });
  record("snapshot_post_rollback", "ok", {
    current_scenario_id: postRollbackSnapshot.current_mirror_scenario_id
  });

  const reject = runNodeJsonAllowFailure(new URL("./promote-scenario.mjs", import.meta.url), [
    "--scenario", rejectScenarioId,
    "--apply",
    "--use-existing-reports"
  ]);
  record("preview_only_apply_reject", reject.status, {
    scenario_id: rejectScenarioId,
    decision: reject.promotion?.decision || null
  });

  const publishHistory = buildOps3PublishHistory(drillHistory);
  const dashboard = buildOps3Dashboard({
    candidateScenarioId: scenarioId,
    baselineScenarioId,
    prePublishSnapshot,
    postPublishSnapshot,
    postRollbackSnapshot,
    manifest,
    rejectResult: {
      scenario_id: rejectScenarioId,
      status: reject.status,
      decision: reject.promotion?.decision || null,
      warnings: reject.promotion?.warnings || []
    },
    drillHistory
  });

  const report = buildOps3DrillReport({
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    baseline_scenario_id: baselineScenarioId,
    status: "passed",
    initial_state: initialState,
    final_state: {
      selected_scenario_id: readSelected().selected_scenario_id || null,
      current_scenario_id: readCurrentMeta().selected_scenario_id || null
    },
    release_notes_path: ops3Paths.releaseNotes,
    release_manifest_path: ops3Paths.releaseManifest,
    snapshots: {
      pre_publish: ops3Paths.prePublishSnapshot,
      post_publish: ops3Paths.postPublishSnapshot,
      post_rollback: ops3Paths.postRollbackSnapshot
    },
    preview_only_reject: {
      scenario_id: rejectScenarioId,
      status: reject.status,
      decision: reject.promotion?.decision || null
    },
    history: publishHistory.items,
    dashboard
  });

  console.log(JSON.stringify({ status: "ok", drill: report }, null, 2));
} catch (error) {
  try {
    const currentScenarioId = readCurrentMeta().selected_scenario_id || null;
    if (currentScenarioId && currentScenarioId !== baselineScenarioId) {
      const recovery = runNodeJsonAllowFailure(new URL("./rollback-scenario.mjs", import.meta.url), [
        "--scenario", baselineScenarioId
      ]);
      record("rollback_recovery", recovery.status, { scenario_id: baselineScenarioId });
    }
  } catch {
    record("rollback_recovery", "failed", { scenario_id: baselineScenarioId });
  }
  fail(error.message || String(error));
}
