import { evaluatePromotionDecision, parseArgs, recordPromotionAction } from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS2_SCENARIO_REQUIRED");
}

const report = evaluatePromotionDecision({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

recordPromotionAction({
  action: "preview",
  scenarioId,
  result: report.decision === "blocked" ? "blocked" : "ok",
  decision: report.decision,
  blockers: report.blockers,
  warnings: report.warnings,
  info: report.info
});

console.log(JSON.stringify({ status: "ok", preview: { dry_run: true, ...report } }, null, 2));
