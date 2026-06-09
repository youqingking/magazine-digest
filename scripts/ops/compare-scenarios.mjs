import { compareScenarioSet, parseArgs, recordPromotionAction } from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const report = compareScenarioSet({
  candidateScenarioId: args.scenario || null,
  fromScenarioId: args.from || null,
  toScenarioId: args.to || null,
  baselineScenarioId: args.baseline || null
});

recordPromotionAction({
  action: "compare",
  scenarioId: report.candidate_scenario_id || args.scenario || args.to || null,
  result: "ok",
  blockers: (report.comparisons || []).flatMap((item) => (item.blockers || []).map((entry) => `${item.from_state_role}:${entry.code}`)),
  warnings: (report.comparisons || []).flatMap((item) => (item.warnings || []).map((entry) => `${item.from_state_role}:${entry.code}`)),
  info: (report.comparisons || []).flatMap((item) => (item.info || []).map((entry) => `${item.from_state_role}:${entry.code}`))
});

console.log(JSON.stringify({ status: "ok", diff: report }, null, 2));
