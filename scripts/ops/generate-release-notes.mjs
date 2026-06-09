import { buildReleaseManifest, buildReleaseNotes, defaultTargetScenarioId, ops3Paths, parseArgs } from "./lib/ops3-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario || defaultTargetScenarioId();
const manifest = buildReleaseManifest({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

const lines = [
  "# Release Notes",
  "",
  `- scenario id: ${manifest.scenario_id}`,
  `- baseline: ${manifest.baseline_scenario_id}`,
  `- build label: ${manifest.build_label || "unknown"}`,
  `- promotion decision: ${manifest.promotion_decision}`,
  `- gate status: ${manifest.gate_status}`,
  "",
  "## Inventory",
  `- publications: ${manifest.publication_list.join(", ") || "none"}`,
  `- issues: ${manifest.issue_list.join(", ") || "none"}`,
  `- article count: ${manifest.article_count}`,
  `- baseline article delta: ${manifest.compared_against_baseline?.article_delta ?? 0}`,
  "",
  "## Warnings",
  `- gate warnings: ${(manifest.warning_summary.gate_warnings || []).length}`,
  `- decision warnings: ${(manifest.warning_summary.decision_warnings || []).length}`,
  `- accepted anomalies: ${(manifest.warning_summary.accepted_anomalies || []).length}`,
  "",
  "## Overrides",
  `- total override count: ${manifest.override_summary.total_override_count}`,
  `- accepted override groups: ${(manifest.override_summary.accepted_overrides || []).length}`,
  "",
  "## Why Promotable",
  ...(manifest.promotable_reason || []).map((item) => `- ${item}`),
  "",
  "## Why Mixed Preview Was Not Chosen",
  ...(manifest.mixed_preview_not_chosen || []).map((item) => `- ${item}`),
  "",
  "## Accepted Anomalies",
  ...((manifest.warning_summary.accepted_anomalies || []).length > 0
    ? manifest.warning_summary.accepted_anomalies.map((item) => `- ${item.issue_id}: ${item.warning_type} x${item.count} (${item.classification})`)
    : ["- none carried into this release candidate"]),
  "",
  "## Accepted Overrides",
  ...((manifest.override_summary.accepted_overrides || []).length > 0
    ? manifest.override_summary.accepted_overrides.map((item) => `- ${item.issue_id}: ${item.count} (${item.classification})`)
    : ["- none"]),
  ""
];

buildReleaseNotes(lines.join("\n"));
console.log(JSON.stringify({
  status: "ok",
  release_notes: {
    scenario_id: scenarioId,
    path: ops3Paths.releaseNotes
  }
}, null, 2));
