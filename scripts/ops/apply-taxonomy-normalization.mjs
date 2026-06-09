import path from "node:path";

import {
  defaultScenarioRegistry,
  loadBaseRuntimeFixtures,
  loadStageGFallbackBundle,
  pipelinePaths,
  readJson,
  writeJson
} from "../import/lib/content-pipeline.mjs";
import {
  createTaxonomyContext,
  loadNormalizedRecordsForIssue,
  normalizeTaxonomyRecord
} from "../import/lib/taxonomy-normalizer.mjs";
import { buildRuntimeBundleFromNormalizedRecords } from "../import/lib/runtime-bundle-builder.mjs";
import { buildData3Reports } from "./lib/taxonomy-lib.mjs";

function normalizeIssue(publicationKey, issueLabel, context) {
  const entries = loadNormalizedRecordsForIssue(publicationKey, issueLabel);
  let changed = 0;
  for (const entry of entries) {
    const nextRecord = normalizeTaxonomyRecord(entry.record, context);
    const before = JSON.stringify(entry.record);
    const after = JSON.stringify(nextRecord);
    if (before !== after) {
      changed += 1;
      writeJson(entry.filePath, nextRecord);
    }
  }
  return {
    publication_key: publicationKey,
    issue_label: issueLabel,
    article_count: entries.length,
    changed_records: changed
  };
}

function rebuildScenarioBundle(scenarioRecord, baseRuntimeFixtures) {
  const bundlePath = path.join(pipelinePaths.repoRoot, scenarioRecord.bundle_path);
  const existingBundle = readJson(bundlePath, null);
  const records = (scenarioRecord.included_issues || []).flatMap((issue) => loadNormalizedRecordsForIssue(issue.publication_id, issue.issue_label).map((entry) => entry.record));
  const bundle = buildRuntimeBundleFromNormalizedRecords({
    records,
    scenarioId: scenarioRecord.scenario_id,
    sourceKind: scenarioRecord.source_kind || existingBundle?.metadata?.source_kind || "real_content_taxonomy_refresh",
    canonicalSource: existingBundle?.metadata?.canonical_source || scenarioRecord.bundle_path,
    buildLabel: scenarioRecord.build_label || existingBundle?.metadata?.build_label || scenarioRecord.scenario_id,
    freeQuotaLimit: scenarioRecord.paywall_test_rule?.free_quota_limit ?? existingBundle?.metadata?.free_quota_limit ?? 8,
    baseRuntimeFixtures,
    runtimeNow: existingBundle?.metadata?.runtime_now || new Date().toISOString(),
    description:
      existingBundle?.stageG?.commercialOffer?.response?.audience_context_hint ||
      existingBundle?.stageG?.campaignLanding?.response?.subtitle ||
      existingBundle?.stageG?.profileBenefits?.response?.benefit_summary?.[0] ||
      scenarioRecord.scenario_id
  });
  writeJson(bundlePath, bundle);
  return {
    scenario_id: scenarioRecord.scenario_id,
    bundle_path: scenarioRecord.bundle_path,
    article_count: records.length
  };
}

const context = createTaxonomyContext();
const issueResults = [
  normalizeIssue("barrons", "09022026", context),
  normalizeIssue("the_atlantic", "012026", context),
  normalizeIssue("the_economist", "20260314", context),
  normalizeIssue("readers_digest", "12112025", context)
];

const baseRuntimeFixtures = loadStageGFallbackBundle() || await loadBaseRuntimeFixtures();
const scenarioIndex = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
const rebuiltScenarios = (scenarioIndex.items || []).map((scenario) => rebuildScenarioBundle(scenario, baseRuntimeFixtures));
const reports = buildData3Reports();

console.log(JSON.stringify({
  status: "ok",
  normalized_issues: issueResults,
  rebuilt_scenarios: rebuiltScenarios.map((item) => item.scenario_id),
  coverage_report: path.relative(pipelinePaths.repoRoot, reports.coverageReport ? path.join(pipelinePaths.repoRoot, "output", "stage-data3", "taxonomy-coverage-report.json") : "").replace(/\\/g, "/")
}, null, 2));
