import { publishScenarioToCurrent } from "../import/lib/content-pipeline.mjs";

const scenarioId = process.argv[2];
if (!scenarioId) {
  console.error(JSON.stringify({ status: "error", message: "SCENARIO_ID_REQUIRED" }, null, 2));
  process.exit(1);
}

const result = publishScenarioToCurrent({
  scenarioId,
  selectionSource: "runtime_rollback_script"
});
console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
