import { buildOperatorCatalog, evaluateGate, parseArgs, recordAction } from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const catalog = buildOperatorCatalog();
const scenarioId = args.scenario || catalog.selected_scenario_id;
if (!scenarioId) {
  throw new Error("OPS1_GATE_SCENARIO_REQUIRED");
}

const report = evaluateGate({
  scenarioId,
  refresh: !args["use-existing-reports"]
});
recordAction({
  action: "gate",
  scenarioId,
  result: report.status === "blocked" ? "blocked" : "ok",
  gateStatus: report.status,
  warnings: report.warnings,
  blockers: report.blockers
});
buildOperatorCatalog();

console.log(JSON.stringify({ status: "ok", gate: report }, null, 2));
