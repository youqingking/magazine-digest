import path from "node:path";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  loadStageGFallbackBundle,
  pipelinePaths,
  readJson,
  toRepoRelative,
  upsertBy,
  writeJson
} from "../import/lib/content-pipeline.mjs";
import { buildRuntimeBundleFromNormalizedRecords } from "../import/lib/runtime-bundle-builder.mjs";
import {
  loadNormalizedIssueRecords,
  loadWarningBudgets,
  qualityPaths,
  writeQualityReport
} from "./lib/quality-budget-lib.mjs";

const budgets = loadWarningBudgets();
const candidateScenarioId = "data2_multi_publication_release_candidate";
const includedIssues = Object.entries(budgets.issue_budgets || {})
  .filter(([, value]) => value.release_candidate_allowed === true)
  .map(([issueId]) => issueId);
const excludedIssues = Object.entries(budgets.issue_budgets || {})
  .filter(([, value]) => value.release_candidate_allowed !== true)
  .map(([issueId, value]) => ({ issue_id: issueId, reason: value.note || "excluded_by_budget" }));

const records = includedIssues.flatMap((issueId) => loadNormalizedIssueRecords(issueId));
const includedPublications = Array.from(new Set(includedIssues.map((issueId) => issueId.split("__")[0]))).sort();
const issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
const publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
const issueRegistryMap = new Map((issuesRegistry.items || []).map((item) => [item.issue_id, item]));
const publicationDisplayMap = new Map((publicationsRegistry.items || []).map((item) => [item.id, item.display_name || item.id]));
const parserProfiles = Array.from(new Set(
  includedIssues
    .map((issueId) => issueRegistryMap.get(issueId)?.parser_profile || null)
    .filter(Boolean)
)).sort();
const includedPublicationLabels = includedPublications.map((publicationId) => publicationDisplayMap.get(publicationId) || publicationId);
const includedIssueRefs = includedIssues.map((issueId) => {
  const [publication_id, issue_label] = issueId.split("__");
  return { publication_id, issue_label };
});

const bundle = buildRuntimeBundleFromNormalizedRecords({
  records,
  scenarioId: candidateScenarioId,
  sourceKind: "real_content_release_candidate",
  canonicalSource: "DATA2 multi-publication release candidate",
  buildLabel: "data2_multi_publication_release_candidate",
  freeQuotaLimit: 8,
  baseRuntimeFixtures: loadStageGFallbackBundle(),
  runtimeNow: new Date().toISOString(),
  description: `${includedPublicationLabels.join(" + ")} release candidate`
});
const bundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${candidateScenarioId}.bundle.json`);
writeJson(bundlePath, bundle);

const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
scenarioRegistry.generated_at = new Date().toISOString();
scenarioRegistry.items = upsertBy(scenarioRegistry.items || [], "scenario_id", {
  scenario_id: candidateScenarioId,
  scenario_type: "real_content_multi_publication_release_candidate",
  source_kind: "real_content_release_candidate",
  bundle_path: toRepoRelative(bundlePath),
  included_publications: includedPublications,
  included_issues: includedIssueRefs,
  paywall_test_rule: {
    rule_key: "global_free_quota_limit",
    free_quota_limit: 8
  },
  parser_profiles: parserProfiles,
  build_label: "data2_multi_publication_release_candidate",
  enabled_at: new Date().toISOString(),
  status: "active",
  imported_article_count: records.length,
  is_selected_for_current: false,
  data2_candidate: true
});
writeJson(pipelinePaths.runtimeScenarioIndex, scenarioRegistry);

const manifest = {
  generated_at: new Date().toISOString(),
  scenario_id: candidateScenarioId,
  included_issues: includedIssues,
  included_publications: includedPublications,
  article_count: records.length,
  rationale: [
    "Included issues must have release_candidate_allowed = true in warning-budgets.json.",
    "Accepted warnings and override drifts must remain explicitly registered in accepted-warnings.json.",
    "Excluded issues remain outside DATA2 RC only when their warning budget is not release-eligible."
  ]
};
const report = {
  generated_at: new Date().toISOString(),
  scenario_id: candidateScenarioId,
  bundle_path: toRepoRelative(bundlePath),
  included: includedIssues.map((issueId) => ({
    issue_id: issueId,
    reason: budgets.issue_budgets[issueId]?.note || "included_by_budget"
  })),
  excluded: excludedIssues,
  article_count: records.length,
  publication_count: includedPublications.length
};

writeQualityReport(qualityPaths.releaseCandidateManifest, manifest);
writeQualityReport(qualityPaths.releaseCandidateReport, report);
console.log(JSON.stringify({ status: "ok", release_candidate: report }, null, 2));
