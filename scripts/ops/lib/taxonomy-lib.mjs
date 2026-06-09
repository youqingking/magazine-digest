import fs from "node:fs";
import path from "node:path";

import { defaultIssuesRegistry, pipelinePaths, readJson, repoRoot, writeJson } from "../../import/lib/content-pipeline.mjs";
import {
  createTaxonomyContext,
  loadNormalizedRecordsForIssue,
  resolvePublicationDataDir
} from "../../import/lib/taxonomy-normalizer.mjs";
import { compareIssueMetaDescending, getIssueMeta } from "../../../shared/utils/issue-meta.js";

export const data3Paths = {
  outputRoot: path.join(repoRoot, "output", "stage-data3"),
  taxonomyCoverageReport: path.join(repoRoot, "output", "stage-data3", "taxonomy-coverage-report.json"),
  discoveryQualityReport: path.join(repoRoot, "output", "stage-data3", "discovery-quality-report.json"),
  unmappedSectionsReport: path.join(repoRoot, "output", "stage-data3", "unmapped-sections-report.json"),
  taxonomyDriftReport: path.join(repoRoot, "output", "stage-data3", "taxonomy-drift-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-data3", "smoke-report.json")
};

function ensureData3Dirs() {
  fs.mkdirSync(data3Paths.outputRoot, { recursive: true });
}

export function writeData3Json(filePath, value) {
  ensureData3Dirs();
  writeJson(filePath, value);
}

export function readData3Json(filePath, fallback = null) {
  return readJson(filePath, fallback);
}

function issuePath(publicationKey, issueLabel) {
  return path.join(resolvePublicationDataDir(publicationKey), issueLabel);
}

function readScenarioIndex() {
  return readJson(pipelinePaths.runtimeScenarioIndex, { items: [] });
}

function readIssuesRegistry() {
  return readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
}

function normalizePublicationKey(value) {
  return String(value || "").replace(/-/g, "_");
}

function issueSummary(issueRecord) {
  const publicationKey = issueRecord.publication_id;
  const issueLabel = issueRecord.issue_label;
  const issueMeta = getIssueMeta(issueRecord);
  const normalizedRecords = loadNormalizedRecordsForIssue(publicationKey, issueLabel).map((item) => item.record);
  const rawLabelCounts = {};
  const canonicalCounts = {};
  const bucketCounts = {};
  const unmapped = [];
  const publicationSpecificFallbacks = [];

  for (const record of normalizedRecords) {
    const rawLabel = record.raw_section_label || record.section_label || "(missing)";
    rawLabelCounts[rawLabel] = (rawLabelCounts[rawLabel] || 0) + 1;
    if (record.canonical_section_key) {
      canonicalCounts[record.canonical_section_key] = (canonicalCounts[record.canonical_section_key] || 0) + 1;
    } else {
      unmapped.push({
        article_id: record.article_id,
        raw_label: rawLabel
      });
    }
    if (record.discovery_bucket) {
      bucketCounts[record.discovery_bucket] = (bucketCounts[record.discovery_bucket] || 0) + 1;
    }
    if ((record.taxonomy_warnings || []).includes("taxonomy_publication_specific_fallback")) {
      publicationSpecificFallbacks.push({
        article_id: record.article_id,
        raw_label: rawLabel
      });
    }
  }

  const rawLabels = Object.keys(rawLabelCounts).sort();
  return {
    publication_key: normalizePublicationKey(publicationKey),
    issue_id: issueMeta.issue_id || `${normalizePublicationKey(publicationKey)}__${issueLabel}`,
    issue_label: issueMeta.issue_label || issueLabel,
    issue_sort_key: issueMeta.issue_sort_key || null,
    issue_display_label: issueMeta.issue_display_label || issueLabel,
    issue_status: issueRecord.status || issueRecord.import_status || "active",
    issue_enabled: issueRecord.enabled !== false,
    issue_path: path.relative(repoRoot, issuePath(publicationKey, issueLabel)).replace(/\\/g, "/"),
    article_count: normalizedRecords.length,
    raw_section_count: rawLabels.length,
    raw_labels: rawLabels,
    raw_label_counts: rawLabelCounts,
    canonical_section_counts: canonicalCounts,
    discovery_bucket_counts: bucketCounts,
    mapped_article_count: normalizedRecords.filter((record) => Boolean(record.canonical_section_key)).length,
    mapped_ratio: normalizedRecords.length > 0
      ? normalizedRecords.filter((record) => Boolean(record.canonical_section_key)).length / normalizedRecords.length
      : 0,
    unmapped,
    publication_specific_fallbacks: publicationSpecificFallbacks
  };
}

function publicationSummary(publicationKey, issueRecords) {
  const issueSummaries = issueRecords
    .map((issueRecord) => issueSummary(issueRecord))
    .sort(compareIssueMetaDescending);
  const rawLabelSet = new Set(issueSummaries.flatMap((item) => item.raw_labels));
  const totalArticles = issueSummaries.reduce((sum, item) => sum + item.article_count, 0);
  const mappedArticles = issueSummaries.reduce((sum, item) => sum + item.mapped_article_count, 0);
  const latestIssue = issueSummaries[0] || null;
  return {
    publication_key: normalizePublicationKey(publicationKey),
    issue_count: issueSummaries.length,
    active_issue_count: issueSummaries.filter((item) => item.issue_status !== "archived" && item.issue_enabled !== false).length,
    archived_issue_count: issueSummaries.filter((item) => item.issue_status === "archived" || item.issue_enabled === false).length,
    article_count: totalArticles,
    raw_section_count: rawLabelSet.size,
    mapped_ratio: totalArticles > 0 ? mappedArticles / totalArticles : 0,
    latest_issue_id: latestIssue?.issue_id || null,
    latest_issue_label: latestIssue?.issue_label || null,
    latest_issue_sort_key: latestIssue?.issue_sort_key || null,
    latest_issue_display_label: latestIssue?.issue_display_label || null,
    issue_summaries: issueSummaries
  };
}

function buildScenarioCoverage(scenarioRecord, publicationLookup) {
  const issueIds = (scenarioRecord.included_issues || []).map((item) => `${item.publication_id}__${item.issue_label}`);
  const issueSummaries = issueIds
    .map((issueId) => {
      const [publicationKey, issueLabel] = issueId.split("__");
      return publicationLookup.get(`${publicationKey}__${issueLabel}`) || null;
    })
    .filter(Boolean);
  const articleCount = issueSummaries.reduce((sum, item) => sum + item.article_count, 0);
  const mappedArticleCount = issueSummaries.reduce((sum, item) => sum + item.mapped_article_count, 0);
  const unmapped = issueSummaries.flatMap((item) => item.unmapped.map((entry) => ({
    issue_id: item.issue_id,
    ...entry
  })));
  return {
    scenario_id: scenarioRecord.scenario_id,
    status: scenarioRecord.status || null,
    source_kind: scenarioRecord.source_kind || null,
    publication_count: (scenarioRecord.included_publications || []).length,
    issue_count: issueSummaries.length,
    article_count: articleCount,
    mapped_article_count: mappedArticleCount,
    mapped_ratio: articleCount > 0 ? mappedArticleCount / articleCount : 0,
    unmapped_count: unmapped.length,
    unmapped,
    publication_specific_fallback_count: issueSummaries.reduce((sum, item) => sum + item.publication_specific_fallbacks.length, 0),
    discovery_bucket_distribution: issueSummaries.reduce((acc, item) => {
      for (const [bucket, count] of Object.entries(item.discovery_bucket_counts || {})) {
        acc[bucket] = (acc[bucket] || 0) + count;
      }
      return acc;
    }, {})
  };
}

export function buildData3Reports() {
  ensureData3Dirs();
  createTaxonomyContext();
  const publicationSummaries = buildPublicationCoverage();
  const issueLookup = new Map(
    publicationSummaries.flatMap((publication) => publication.issue_summaries.map((issue) => [issue.issue_id, issue]))
  );
  const scenarios = (readScenarioIndex().items || []).map((item) => buildScenarioCoverage(item, issueLookup));
  const coverageReport = {
    generated_at: new Date().toISOString(),
    publications: publicationSummaries,
    scenarios
  };
  const unmappedSectionsReport = {
    generated_at: coverageReport.generated_at,
    publications: publicationSummaries.map((publication) => ({
      publication_key: publication.publication_key,
      unmapped: publication.issue_summaries.flatMap((issue) => issue.unmapped.map((entry) => ({
        issue_id: issue.issue_id,
        ...entry
      })))
    }))
  };
  const candidateCoverage = scenarios.find((item) => item.scenario_id === "data2_multi_publication_release_candidate") || null;
  const mixedPreviewCoverage = scenarios.find((item) => item.scenario_id === "data1c_three_release_mixed_preview") || null;
  const discoveryQualityReport = {
    generated_at: coverageReport.generated_at,
    candidate_scenario_id: "data2_multi_publication_release_candidate",
    candidate_coverage: candidateCoverage,
    mixed_preview_coverage: mixedPreviewCoverage,
    stable_filter_axes: ["publication", "issue_id", "canonical_section_key", "discovery_bucket", "reading_mode"],
    resolved_gaps: [
      "Cross-publication browsing can now use canonical section and discovery bucket instead of only raw tag noise.",
      "Issue history is now registry-driven, so the same publication can accumulate multiple issue snapshots without dropping out of DATA3 coverage.",
      "Barron's title-like raw sections are preserved but collapsed into stable canonical discovery groups.",
      "Atlantic and Economist raw labels remain visible while gaining shared cross-publication axes."
    ]
  };
  const taxonomyDriftReport = {
    generated_at: coverageReport.generated_at,
    publication_specific_fallbacks: publicationSummaries.map((publication) => ({
      publication_key: publication.publication_key,
      items: publication.issue_summaries.flatMap((issue) => issue.publication_specific_fallbacks.map((entry) => ({
        issue_id: issue.issue_id,
        ...entry
      })))
    })),
    taxonomy_regression: scenarios.some((scenario) => scenario.unmapped_count > 0)
  };

  writeData3Json(data3Paths.taxonomyCoverageReport, coverageReport);
  writeData3Json(data3Paths.unmappedSectionsReport, unmappedSectionsReport);
  writeData3Json(data3Paths.discoveryQualityReport, discoveryQualityReport);
  writeData3Json(data3Paths.taxonomyDriftReport, taxonomyDriftReport);

  return {
    coverageReport,
    unmappedSectionsReport,
    discoveryQualityReport,
    taxonomyDriftReport
  };
}

export function readScenarioTaxonomySummary(scenarioId) {
  const report = readData3Json(data3Paths.taxonomyCoverageReport, { scenarios: [] });
  return (report.scenarios || []).find((item) => item.scenario_id === scenarioId) || null;
}

export function buildPublicationCoverage() {
  const groupedIssues = new Map();
  for (const issueRecord of readIssuesRegistry().items || []) {
    if (!issueRecord?.publication_id || !issueRecord?.issue_label) {
      continue;
    }
    const publicationKey = normalizePublicationKey(issueRecord.publication_id);
    if (!groupedIssues.has(publicationKey)) {
      groupedIssues.set(publicationKey, []);
    }
    groupedIssues.get(publicationKey).push(issueRecord);
  }

  return Array.from(groupedIssues.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([publicationKey, issueRecords]) =>
      publicationSummary(
        publicationKey,
        [...issueRecords].sort(compareIssueMetaDescending)
      )
    );
}
