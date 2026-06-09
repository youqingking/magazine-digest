import {
  buildScenarioProvenanceSnapshot,
  defaultTargetScenarioId,
  ops3Paths,
  parseArgs
} from "./lib/ops3-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const label = args.label || "pre-publish";
const scenarioId = args.scenario || defaultTargetScenarioId();
const snapshot = buildScenarioProvenanceSnapshot({
  label,
  targetScenarioId: scenarioId,
  operatorAction: args.action || label,
  gateResult: args["gate-result"] || null,
  promotionDecision: args["promotion-decision"] || null,
  publishTimestamp: args["publish-timestamp"] || null,
  notes: args.note ? [args.note] : []
});

const pathByLabel = {
  "pre-publish": ops3Paths.prePublishSnapshot,
  "post-publish": ops3Paths.postPublishSnapshot,
  "post-rollback": ops3Paths.postRollbackSnapshot
};

console.log(JSON.stringify({
  status: "ok",
  snapshot: {
    path: pathByLabel[label] || ops3Paths.prePublishSnapshot,
    ...snapshot
  }
}, null, 2));
