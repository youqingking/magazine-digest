import { parseArgs, recordAction, buildOperatorCatalog, buildPromotionDashboard, recordPromotionAction, scenarioExists } from "./lib/ops-lib.mjs";
import { publishScenarioToCurrent } from "../import/lib/content-pipeline.mjs";
import { acquireStateLock, releaseStateLock } from "../lib/state-lock.mjs";

const args = parseArgs(process.argv.slice(2));
let stateLock = null;
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS1_SCENARIO_REQUIRED");
}

if (!scenarioExists(scenarioId)) {
  recordPromotionAction({
    action: "rollback",
    scenarioId,
    result: "blocked",
    decision: "blocked",
    blockers: ["scenario_missing"]
  });
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "blocked", rollback: { scenario_id: scenarioId, blockers: ["scenario_missing"] } }, null, 2));
  process.exit(2);
}

try {
  stateLock = await acquireStateLock("runtime-state", {
    runId: process.env.RUN_ID || "rollback-scenario",
    script: "scripts/ops/rollback-scenario.mjs"
  });

  const result = publishScenarioToCurrent({
    scenarioId,
    selectionSource: "ops_rollback_script"
  });
  recordAction({
    action: "rollback",
    scenarioId,
    result: "ok"
  });
  recordPromotionAction({
    action: "rollback",
    scenarioId,
    result: "ok",
    decision: "promotable"
  });
  buildOperatorCatalog();
  buildPromotionDashboard();
  console.log(JSON.stringify({ status: "ok", rollback: result }, null, 2));
} finally {
  releaseStateLock(stateLock);
}
