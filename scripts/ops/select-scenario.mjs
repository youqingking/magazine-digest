import { parseArgs, recordAction, scenarioExists, buildOperatorCatalog } from "./lib/ops-lib.mjs";
import { setSelectedScenario } from "../import/lib/content-pipeline.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS1_SCENARIO_REQUIRED");
}
if (!scenarioExists(scenarioId)) {
  throw new Error(`OPS1_SCENARIO_NOT_FOUND:${scenarioId}`);
}

const result = setSelectedScenario({
  scenarioId,
  selectionSource: "ops_select_script"
});
recordAction({
  action: "select",
  scenarioId,
  result: "ok"
});
buildOperatorCatalog();
console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
