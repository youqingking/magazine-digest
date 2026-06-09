import { buildReleaseArtifact, parseArgs } from "./lib/release-channel-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario || "data2_multi_publication_release_candidate";

const result = buildReleaseArtifact({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

console.log(JSON.stringify(result, null, 2));
if (result.status !== "ok") {
  process.exit(2);
}
