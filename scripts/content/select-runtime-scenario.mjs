import { selectRuntimeScenario } from "./synthetic-test-pack-lib.mjs";

function getScenarioId(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--scenario-id" || argv[index] === "--scenarioId") {
      return argv[index + 1] || null;
    }
  }
  return null;
}

try {
  const result = selectRuntimeScenario(getScenarioId(process.argv.slice(2)));
  console.log(JSON.stringify({ status: "ok", scenario_id: result.scenario_id }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "error", message: error.message }, null, 2));
  process.exit(1);
}
