import { publishScenarioToCurrent, setSelectedScenario } from "../import/lib/content-pipeline.mjs";
import { acquireStateLock, releaseStateLock } from "../lib/state-lock.mjs";
import { recordObservabilityEvent } from "./lib/observability-lib.mjs";
import {
  buildPromotionDashboard,
  evaluatePromotionDecision,
  parseArgs,
  recordAction,
  recordPromotionAction,
  scenarioExists
} from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
let stateLock = null;
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS2_SCENARIO_REQUIRED");
}

if (!scenarioExists(scenarioId)) {
  recordObservabilityEvent({
    event_type: "scenario_resolution_failed",
    scenario_id: scenarioId,
    details: {
      reason: "scenario_missing"
    }
  });
  recordPromotionAction({
    action: "promote",
    scenarioId,
    result: "blocked",
    decision: "blocked",
    blockers: ["scenario_missing"],
    warnings: [],
    info: []
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({
    status: "blocked",
    promotion: {
      scenario_id: scenarioId,
      dry_run: !args.apply,
      decision: "blocked",
      blockers: ["scenario_missing"],
      warnings: [],
      info: []
    }
  }, null, 2));
  process.exit(2);
}

const evaluation = evaluatePromotionDecision({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

if (evaluation.decision === "blocked") {
  recordObservabilityEvent({
    event_type: "publish_failed",
    scenario_id: scenarioId,
    details: {
      reason: "promotion_blocked",
      blockers: evaluation.blockers,
      warnings: evaluation.warnings
    }
  });
  recordPromotionAction({
    action: "promote",
    scenarioId,
    result: "blocked",
    decision: evaluation.decision,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    info: evaluation.info
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "blocked", promotion: { scenario_id: scenarioId, dry_run: !args.apply, ...evaluation } }, null, 2));
  process.exit(2);
}

if (evaluation.decision === "hold_warning" && !args["force-with-warning"]) {
  recordObservabilityEvent({
    event_type: "publish_failed",
    severity: "warning",
    scenario_id: scenarioId,
    details: {
      reason: "warning_requires_override",
      warnings: evaluation.warnings
    }
  });
  recordPromotionAction({
    action: "promote",
    scenarioId,
    result: "warning_requires_override",
    decision: evaluation.decision,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    info: evaluation.info
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "warning_requires_override", promotion: { scenario_id: scenarioId, dry_run: !args.apply, ...evaluation } }, null, 2));
  process.exit(3);
}

if (!args.apply) {
  recordPromotionAction({
    action: "promote_dry_run",
    scenarioId,
    result: "ok",
    decision: evaluation.decision,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    info: evaluation.info
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "ok", promotion: { scenario_id: scenarioId, dry_run: true, ...evaluation } }, null, 2));
  process.exit(0);
}

try {
  stateLock = await acquireStateLock("runtime-state", {
    runId: process.env.RUN_ID || "promote-scenario",
    script: "scripts/ops/promote-scenario.mjs"
  });

  setSelectedScenario({
    scenarioId,
    selectionSource: args["force-with-warning"] ? "ops2_promote_force_with_warning" : "ops2_promote_apply"
  });
  const publish = publishScenarioToCurrent({
    scenarioId,
    selectionSource: args["force-with-warning"] ? "ops2_promote_force_with_warning" : "ops2_promote_apply"
  });

  recordAction({
    action: "publish",
    scenarioId,
    result: "ok",
    gateStatus: evaluation.gate.status,
    warnings: evaluation.warnings,
    blockers: evaluation.blockers
  });
  recordPromotionAction({
    action: "promote_apply",
    scenarioId,
    result: "ok",
    decision: evaluation.decision,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    info: evaluation.info
  });
  recordObservabilityEvent({
    event_type: "channel_publish_succeeded",
    source_surface: "release",
    scenario_id: scenarioId,
    details: {
      action: "promote_apply_to_current_mirror",
      gate_status: evaluation.gate.status
    }
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "ok", promotion: { scenario_id: scenarioId, dry_run: false, ...evaluation, publish } }, null, 2));
} finally {
  releaseStateLock(stateLock);
}
