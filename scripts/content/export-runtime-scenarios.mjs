import { exportRuntimeScenarios } from "./synthetic-test-pack-lib.mjs";

try {
  const bundles = exportRuntimeScenarios();
  console.log(JSON.stringify({ status: "ok", bundle_count: bundles.length, scenario_ids: bundles.map((item) => item.metadata.scenario_id) }, null, 2));
} catch (error) {
  console.error(JSON.stringify(error.validation || { status: "error", message: error.message }, null, 2));
  process.exit(1);
}
