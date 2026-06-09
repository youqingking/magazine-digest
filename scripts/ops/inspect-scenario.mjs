import { inspectScenario, parseArgs } from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS2_SCENARIO_REQUIRED");
}

const report = inspectScenario(scenarioId);
console.log(JSON.stringify({ status: report.snapshot.exists ? "ok" : "missing", inspect: report }, null, 2));
