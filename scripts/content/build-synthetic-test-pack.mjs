import { buildSyntheticTestPack } from "./synthetic-test-pack-lib.mjs";

try {
  const result = buildSyntheticTestPack();
  console.log(JSON.stringify({ status: "ok", summary: result.validation.summary, scenario_ids: result.scenarioSummaries.map((item) => item.scenario_id) }, null, 2));
} catch (error) {
  console.error(JSON.stringify(error.validation || { status: "error", message: error.message }, null, 2));
  process.exit(1);
}
