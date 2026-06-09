import { buildReleaseManifest, defaultTargetScenarioId, parseArgs } from "./lib/ops3-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario || defaultTargetScenarioId();
const manifest = buildReleaseManifest({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

console.log(JSON.stringify({ status: "ok", release_manifest: manifest }, null, 2));
