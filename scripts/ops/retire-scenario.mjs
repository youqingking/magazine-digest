import { parseArgs, recordAction, buildOperatorCatalog } from "./lib/ops-lib.mjs";
import { retireScenario } from "../import/lib/content-pipeline.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS1_SCENARIO_REQUIRED");
}

const result = retireScenario({
  scenarioId,
  reason: args.reason || "ops_retire_script"
});
recordAction({
  action: "retire",
  scenarioId,
  result: "ok"
});
buildOperatorCatalog();
console.log(JSON.stringify({ status: "ok", retire: result }, null, 2));
