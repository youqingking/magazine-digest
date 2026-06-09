import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { atomicWriteText } from "../../lib/atomic-json.mjs";
import { resolveSandboxPath } from "../../lib/sandbox-paths.mjs";
import { compareIssueMetaDescending, getIssueMeta } from "../../../shared/utils/issue-meta.js";

import { pipelinePaths, readJson, repoRoot, writeJson } from "../../import/lib/content-pipeline.mjs";
import { evaluateScenarioBudget } from "./quality-budget-lib.mjs";
import { data3Paths, readScenarioTaxonomySummary } from "./taxonomy-lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const knownWarningPolicy = {
  readers_digest__12112025: ["best_effort_ordinal_missing"],
  the_economist__20260314: ["economist_section_context_fallback", "economist_filename_anomaly"]
};

export { writeJson };

export const opsPaths = {
  root: path.resolve(__dirname, "..", "..", ".."),
  intakeInbox: path.join(repoRoot, "ops", "intake", "inbox"),
  intakeArchive: path.join(repoRoot, "ops", "intake", "archive"),
  intakeReplacements: path.join(repoRoot, "ops", "intake", "replacements"),
  intakeManifests: path.join(repoRoot, "ops", "intake", "manifests"),
  outputRoot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1")),
  publishHistory: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1", "publish-history.json")),
  publishGate: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1", "publish-gate-report.json")),
  operatorCatalogJson: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1", "operator-catalog.json")),
  operatorCatalogMd: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1", "operator-catalog.md")),
  scenarioDashboard: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops1", "scenario-dashboard.json")),
  ops2OutputRoot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2")),
  ops2InspectReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "inspect-report.json")),
  ops2DiffReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "scenario-diff-report.json")),
  ops2DiffSummary: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "scenario-diff-summary.md")),
  ops2PromotionEvaluation: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "promotion-evaluation-report.json")),
  ops2PromotionDashboard: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "promotion-dashboard.json")),
  ops2PromotionSummary: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "promotion-summary.md")),
  ops2PromotionHistory: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "promotion-history.json")),
  ops2SmokeReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops2", "smoke-report.json"))
};

export function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function writeText(filePath, value) {
  atomicWriteText(filePath, value, "utf8");
}

export function readJsonOr(filePath, fallback) {
  return readJson(filePath, fallback);
}

export function ensureOpsDirs() {
  ensureDir(opsPaths.intakeInbox);
  ensureDir(opsPaths.intakeArchive);
  ensureDir(opsPaths.intakeReplacements);
  ensureDir(opsPaths.intakeManifests);
  ensureDir(opsPaths.outputRoot);
}

export function ensureOps2Dirs() {
  ensureDir(opsPaths.ops2OutputRoot);
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = nextValue;
    index += 1;
  }
  return args;
}

export function findInboxZips() {
  ensureOpsDirs();
  return fs.readdirSync(opsPaths.intakeInbox)
    .filter((name) => name.toLowerCase().endsWith(".zip"))
    .sort()
    .map((name) => path.join(opsPaths.intakeInbox, name));
}

export function pickDefaultInboxZip() {
  const zips = findInboxZips();
  if (zips.length === 0) throw new Error("OPS1_INBOX_EMPTY");
  return zips[0];
}

export function readPublications() {
  return readJsonOr(pipelinePaths.publicationsRegistry, { items: [] });
}

export function readIssues() {
  return readJsonOr(pipelinePaths.issuesRegistry, { items: [] });
}

export function readScenarios() {
  return readJsonOr(pipelinePaths.runtimeScenarioIndex, { items: [], selected_scenario_id: null });
}

export function readSelected() {
  return readJsonOr(pipelinePaths.runtimeScenarioSelected, { selected_scenario_id: null });
}

export function readCurrentMeta() {
  return readJsonOr(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json"), {});
}

export function loadLatestReport(filePath) {
  return readJsonOr(filePath, null);
}

export function issueKeyFromParts(publicationId, issueLabel) {
  return publicationId && issueLabel ? `${publicationId}__${issueLabel}` : null;
}

function scenarioItems() {
  return readScenarios().items || [];
}

export function findScenarioRecord(scenarioId) {
  return scenarioItems().find((item) => item.scenario_id === scenarioId) || null;
}

export function scenarioExists(scenarioId) {
  return Boolean(findScenarioRecord(scenarioId));
}

export function loadScenarioBundle(scenarioId) {
  const record = findScenarioRecord(scenarioId);
  if (!record) return null;
  const bundlePath = path.join(repoRoot, record.bundle_path);
  const bundle = readJsonOr(bundlePath, null);
  return bundle ? { record, bundle, bundlePath } : null;
}

export function resolveBaselineScenarioId(explicitScenarioId = null) {
  if (explicitScenarioId) return explicitScenarioId;
  const scenarios = scenarioItems();
  const selectedScenarioId = readSelected().selected_scenario_id || null;
  const currentScenarioId = readCurrentMeta().selected_scenario_id || null;
  const preferred = [
    currentScenarioId,
    selectedScenarioId,
    ...scenarios.filter((item) => item.source_kind === "real_content_pilot" && item.status !== "retired").map((item) => item.scenario_id),
    ...scenarios.filter((item) => item.scenario_id.startsWith("data1a_") && item.status !== "retired").map((item) => item.scenario_id)
  ].filter(Boolean);

  for (const scenarioId of preferred) {
    const record = findScenarioRecord(scenarioId);
    if (record && (record.source_kind === "real_content_pilot" || record.scenario_id.startsWith("data1a_"))) {
      return scenarioId;
    }
  }
  return preferred[0] || null;
}

function aggregateCounts(items, fieldName) {
  return (items || []).reduce((total, item) => total + (Number(item?.[fieldName]) || 0), 0);
}

function buildIssueQualityMaps() {
  const metadataQuality = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"));
  const warningReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"));
  const overrideReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "override-report.json"));
  const qualityMap = new Map((metadataQuality?.items || []).map((item) => [item.issue_id, item]));
  const warningMap = new Map((warningReport?.items || []).map((item) => [item.issue_id, item]));
  const overrideMap = new Map();

  for (const entry of overrideReport?.entries || []) {
    const issueId = issueKeyFromParts(entry.publication_id, entry.issue_label);
    if (!issueId) continue;
    const existing = overrideMap.get(issueId) || [];
    existing.push(entry);
    overrideMap.set(issueId, existing);
  }

  return { metadataQuality, warningReport, overrideReport, qualityMap, warningMap, overrideMap };
}

function getArticleItems(bundle) {
  return (bundle?.contentSyncDelta?.response?.items || []).filter((item) => item?.entity_type === "article");
}

function buildAudienceCoverage(bundle) {
  const responses = bundle?.contentDetail?.responses || {};
  const audiences = new Set();
  const readingModes = new Set();
  const responseCountByAudience = {};

  for (const key of Object.keys(responses)) {
    const [, , audience, mode] = key.split("|");
    if (audience) {
      audiences.add(audience);
      responseCountByAudience[audience] = (responseCountByAudience[audience] || 0) + 1;
    }
    if (mode) readingModes.add(mode);
  }

  return {
    audiences: Array.from(audiences).sort(),
    reading_modes: Array.from(readingModes).sort(),
    response_count_by_audience: responseCountByAudience
  };
}

function buildWarningSummary(issueIds, warningMap) {
  const importCounts = {};
  const unresolvedCounts = {};
  const issueBreakdown = [];

  for (const issueId of issueIds) {
    const warningItem = warningMap.get(issueId);
    if (!warningItem) continue;
    issueBreakdown.push({
      issue_id: issueId,
      import_warning_counts: warningItem.import_warning_counts || {},
      unresolved_warning_counts: warningItem.unresolved_warning_counts || {}
    });
    for (const [warningType, count] of Object.entries(warningItem.import_warning_counts || {})) {
      importCounts[warningType] = (importCounts[warningType] || 0) + count;
    }
    for (const [warningType, count] of Object.entries(warningItem.unresolved_warning_counts || {})) {
      unresolvedCounts[warningType] = (unresolvedCounts[warningType] || 0) + count;
    }
  }

  return {
    import_counts: importCounts,
    unresolved_counts: unresolvedCounts,
    issue_breakdown: issueBreakdown,
    import_total: Object.values(importCounts).reduce((total, value) => total + value, 0),
    unresolved_total: Object.values(unresolvedCounts).reduce((total, value) => total + value, 0)
  };
}

function buildMetadataSummary(issueIds, qualityMap) {
  const items = issueIds.map((issueId) => qualityMap.get(issueId)).filter(Boolean);
  const safeAverage = (fieldName) => (
    items.length > 0
      ? items.reduce((total, item) => total + (Number(item[fieldName]) || 0), 0) / items.length
      : null
  );

  return {
    issues: items.map((item) => ({
      issue_id: item.issue_id,
      article_count: item.article_count || 0,
      title_complete_rate: item.title_complete_rate ?? null,
      section_label_complete_rate: item.section_label_complete_rate ?? null,
      ordinal_complete_rate: item.ordinal_complete_rate ?? null,
      overrides_count: item.overrides_count || 0,
      warnings_count: item.warnings_count || 0,
      unresolved_warnings_count: item.unresolved_warnings_count || 0
    })),
    total_article_count: aggregateCounts(items, "article_count"),
    overrides_count: aggregateCounts(items, "overrides_count"),
    warnings_count: aggregateCounts(items, "warnings_count"),
    unresolved_warnings_count: aggregateCounts(items, "unresolved_warnings_count"),
    average_title_complete_rate: safeAverage("title_complete_rate"),
    average_section_label_complete_rate: safeAverage("section_label_complete_rate"),
    average_ordinal_complete_rate: safeAverage("ordinal_complete_rate")
  };
}

function buildOverrideSummary(issueIds, overrideMap) {
  const byIssue = {};
  let count = 0;
  for (const issueId of issueIds) {
    const entries = overrideMap.get(issueId) || [];
    byIssue[issueId] = entries.length;
    count += entries.length;
  }
  return { count, by_issue: byIssue };
}

export function buildScenarioSnapshot(scenarioId, role = "candidate") {
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const scenarioRecord = findScenarioRecord(scenarioId);
  const bundleInfo = scenarioRecord ? loadScenarioBundle(scenarioId) : null;
  const { qualityMap, warningMap, overrideMap } = buildIssueQualityMaps();

  if (!scenarioRecord || !bundleInfo?.bundle) {
    return { role, scenario_id: scenarioId, exists: false };
  }

  const bundle = bundleInfo.bundle;
  const issueIds = (scenarioRecord.included_issues || [])
    .map((item) => issueKeyFromParts(item.publication_id, item.issue_label))
    .filter(Boolean);
  const articleIds = getArticleItems(bundle).map((item) => item.article_id).filter(Boolean).sort();
  const paywallRule = scenarioRecord.paywall_test_rule || {};

  return {
    role,
    exists: true,
    scenario_id: scenarioRecord.scenario_id,
    scenario_type: scenarioRecord.scenario_type || null,
    source_kind: scenarioRecord.source_kind || null,
    status: scenarioRecord.status || null,
    bundle_path: scenarioRecord.bundle_path,
    build_label: scenarioRecord.build_label || bundle.metadata?.build_label || null,
    product_key: bundle.metadata?.product_key || bundle.bootstrapConfig?.response?.product_key || null,
    publication_count: (scenarioRecord.included_publications || []).length,
    issue_count: (scenarioRecord.included_issues || []).length,
    article_count: articleIds.length,
    publication_list: [...(scenarioRecord.included_publications || [])].sort(),
    issue_list: issueIds.sort(),
    article_ids: articleIds,
    parser_profiles: [...(scenarioRecord.parser_profiles || [])].sort(),
    audience_coverage: buildAudienceCoverage(bundle),
    paywall_test_rule: {
      rule_key: paywallRule.rule_key || null,
      free_quota_limit: paywallRule.free_quota_limit ?? bundle.metadata?.free_quota_limit ?? null
    },
    metadata_quality_summary: buildMetadataSummary(issueIds, qualityMap),
    warning_summary: buildWarningSummary(issueIds, warningMap),
    override_summary: buildOverrideSummary(issueIds, overrideMap),
    lifecycle_state: {
      retired: scenarioRecord.status === "retired",
      selected_pointer: selected.selected_scenario_id === scenarioRecord.scenario_id,
      current_published: currentMeta.selected_scenario_id === scenarioRecord.scenario_id,
      is_selected_for_current: scenarioRecord.is_selected_for_current === true,
      selected_for_current_at: scenarioRecord.selected_for_current_at || null,
      selected_at: selected.selected_scenario_id === scenarioRecord.scenario_id ? selected.selected_at || null : null,
      published_at: currentMeta.selected_scenario_id === scenarioRecord.scenario_id ? currentMeta.published_to_current_at || null : null
    }
  };
}

function difference(nextList, previousList) {
  const previousSet = new Set(previousList || []);
  return [...(nextList || [])].filter((item) => !previousSet.has(item)).sort();
}

function countsDelta(fromValue, toValue) {
  return { from: fromValue || 0, to: toValue || 0, delta: (toValue || 0) - (fromValue || 0) };
}

function buildMapDelta(fromMap, toMap) {
  const keys = new Set([...Object.keys(fromMap || {}), ...Object.keys(toMap || {})]);
  const delta = {};
  for (const key of Array.from(keys).sort()) {
    delta[key] = {
      from: fromMap?.[key] || 0,
      to: toMap?.[key] || 0,
      delta: (toMap?.[key] || 0) - (fromMap?.[key] || 0)
    };
  }
  return delta;
}

function buildLifecycleStateDelta(fromSnapshot, toSnapshot) {
  return {
    status: { from: fromSnapshot?.status || null, to: toSnapshot?.status || null },
    selected_pointer: {
      from: Boolean(fromSnapshot?.lifecycle_state?.selected_pointer),
      to: Boolean(toSnapshot?.lifecycle_state?.selected_pointer)
    },
    current_published: {
      from: Boolean(fromSnapshot?.lifecycle_state?.current_published),
      to: Boolean(toSnapshot?.lifecycle_state?.current_published)
    },
    retired: {
      from: Boolean(fromSnapshot?.lifecycle_state?.retired),
      to: Boolean(toSnapshot?.lifecycle_state?.retired)
    }
  };
}

function addSeverity(list, code, details = {}) {
  list.push({ code, ...details });
}

function compareTwoSnapshots({ fromSnapshot, toSnapshot, fromRole, toRole }) {
  const blockers = [];
  const warnings = [];
  const info = [];

  if (!fromSnapshot?.exists) addSeverity(blockers, "from_scenario_missing", { scenario_id: fromSnapshot?.scenario_id || null });
  if (!toSnapshot?.exists) addSeverity(blockers, "to_scenario_missing", { scenario_id: toSnapshot?.scenario_id || null });

  if (fromSnapshot?.exists && toSnapshot?.exists) {
    if (toSnapshot.status === "retired") addSeverity(blockers, "candidate_retired", { scenario_id: toSnapshot.scenario_id });
    if (fromSnapshot.product_key && toSnapshot.product_key && fromSnapshot.product_key !== toSnapshot.product_key) {
      addSeverity(blockers, "product_key_mismatch", { from: fromSnapshot.product_key, to: toSnapshot.product_key });
    }
    if (
      fromSnapshot.paywall_test_rule?.rule_key !== toSnapshot.paywall_test_rule?.rule_key ||
      fromSnapshot.paywall_test_rule?.free_quota_limit !== toSnapshot.paywall_test_rule?.free_quota_limit
    ) {
      addSeverity(blockers, "paywall_semantics_changed", {
        from: fromSnapshot.paywall_test_rule,
        to: toSnapshot.paywall_test_rule
      });
    }
    if (Boolean(toSnapshot.lifecycle_state?.current_published) && toSnapshot.lifecycle_state?.selected_pointer === false) {
      addSeverity(blockers, "lifecycle_provenance_mismatch", { scenario_id: toSnapshot.scenario_id });
    }

    const publicationAdded = difference(toSnapshot.publication_list, fromSnapshot.publication_list);
    const publicationRemoved = difference(fromSnapshot.publication_list, toSnapshot.publication_list);
    const issueAdded = difference(toSnapshot.issue_list, fromSnapshot.issue_list);
    const issueRemoved = difference(fromSnapshot.issue_list, toSnapshot.issue_list);
    const articleAdded = difference(toSnapshot.article_ids, fromSnapshot.article_ids);
    const articleRemoved = difference(fromSnapshot.article_ids, toSnapshot.article_ids);
    const parserAdded = difference(toSnapshot.parser_profiles, fromSnapshot.parser_profiles);
    const parserRemoved = difference(fromSnapshot.parser_profiles, toSnapshot.parser_profiles);
    const audienceAdded = difference(toSnapshot.audience_coverage?.audiences, fromSnapshot.audience_coverage?.audiences);
    const audienceRemoved = difference(fromSnapshot.audience_coverage?.audiences, toSnapshot.audience_coverage?.audiences);
    const publicationOverlap = (fromSnapshot.publication_list || []).filter((item) => (toSnapshot.publication_list || []).includes(item));
    const sameLineage = fromSnapshot.source_kind === toSnapshot.source_kind || publicationOverlap.length > 0;

    const removalSeverity = sameLineage ? warnings : info;
    if (publicationRemoved.length > 0) addSeverity(removalSeverity, "publication_removed", { items: publicationRemoved });
    if (issueRemoved.length > 0) addSeverity(removalSeverity, "issue_removed", { items: issueRemoved });
    if (articleRemoved.length > 0) addSeverity(removalSeverity, "article_removed", { count: articleRemoved.length, items: articleRemoved });
    if (parserRemoved.length > 0) addSeverity(removalSeverity, "parser_profile_removed", { items: parserRemoved });
    if (audienceRemoved.length > 0) addSeverity(warnings, "audience_removed", { items: audienceRemoved });

    const warningDelta = buildMapDelta(fromSnapshot.warning_summary?.unresolved_counts || {}, toSnapshot.warning_summary?.unresolved_counts || {});
    const increasedWarningTaxonomy = Object.entries(warningDelta)
      .filter(([, value]) => value.delta > 0)
      .map(([warningType, value]) => ({ warning_type: warningType, ...value }));
    if (increasedWarningTaxonomy.length > 0) addSeverity(warnings, "warning_taxonomy_increase", { items: increasedWarningTaxonomy });
    if ((toSnapshot.override_summary?.count || 0) !== (fromSnapshot.override_summary?.count || 0)) {
      addSeverity(warnings, "override_count_changed", { from: fromSnapshot.override_summary?.count || 0, to: toSnapshot.override_summary?.count || 0 });
    }

    if (publicationAdded.length > 0) addSeverity(info, "publication_added", { items: publicationAdded });
    if (issueAdded.length > 0) addSeverity(info, "issue_added", { items: issueAdded });
    if (articleAdded.length > 0) addSeverity(info, "article_added", { count: articleAdded.length, items: articleAdded });
    if (parserAdded.length > 0) addSeverity(info, "parser_profile_added", { items: parserAdded });
    if (audienceAdded.length > 0) addSeverity(info, "audience_added", { items: audienceAdded });
    if (fromSnapshot.build_label !== toSnapshot.build_label) addSeverity(info, "build_label_changed", { from: fromSnapshot.build_label, to: toSnapshot.build_label });
    if (
      Boolean(fromSnapshot.lifecycle_state?.selected_pointer) !== Boolean(toSnapshot.lifecycle_state?.selected_pointer) ||
      Boolean(fromSnapshot.lifecycle_state?.current_published) !== Boolean(toSnapshot.lifecycle_state?.current_published)
    ) {
      addSeverity(info, "publish_state_changed", { from: fromSnapshot.lifecycle_state, to: toSnapshot.lifecycle_state });
    }
  }

  return {
    generated_at: new Date().toISOString(),
    from_scenario_id: fromSnapshot?.scenario_id || null,
    to_scenario_id: toSnapshot?.scenario_id || null,
    from_state_role: fromRole,
    to_state_role: toRole,
    blockers,
    warnings,
    info,
    counts: {
      publication_count: countsDelta(fromSnapshot?.publication_count, toSnapshot?.publication_count),
      issue_count: countsDelta(fromSnapshot?.issue_count, toSnapshot?.issue_count),
      article_count: countsDelta(fromSnapshot?.article_count, toSnapshot?.article_count),
      overrides_count: countsDelta(fromSnapshot?.override_summary?.count, toSnapshot?.override_summary?.count),
      unresolved_warning_count: countsDelta(fromSnapshot?.metadata_quality_summary?.unresolved_warnings_count, toSnapshot?.metadata_quality_summary?.unresolved_warnings_count)
    },
    inventory: {
      publications_added: fromSnapshot?.exists && toSnapshot?.exists ? difference(toSnapshot.publication_list, fromSnapshot.publication_list) : [],
      publications_removed: fromSnapshot?.exists && toSnapshot?.exists ? difference(fromSnapshot.publication_list, toSnapshot.publication_list) : [],
      issues_added: fromSnapshot?.exists && toSnapshot?.exists ? difference(toSnapshot.issue_list, fromSnapshot.issue_list) : [],
      issues_removed: fromSnapshot?.exists && toSnapshot?.exists ? difference(fromSnapshot.issue_list, toSnapshot.issue_list) : [],
      article_ids_added: fromSnapshot?.exists && toSnapshot?.exists ? difference(toSnapshot.article_ids, fromSnapshot.article_ids) : [],
      article_ids_removed: fromSnapshot?.exists && toSnapshot?.exists ? difference(fromSnapshot.article_ids, toSnapshot.article_ids) : []
    },
    parser_profiles: {
      from: fromSnapshot?.parser_profiles || [],
      to: toSnapshot?.parser_profiles || [],
      added: fromSnapshot?.exists && toSnapshot?.exists ? difference(toSnapshot.parser_profiles, fromSnapshot.parser_profiles) : [],
      removed: fromSnapshot?.exists && toSnapshot?.exists ? difference(fromSnapshot.parser_profiles, toSnapshot.parser_profiles) : []
    },
    audience_coverage: {
      from: fromSnapshot?.audience_coverage || {},
      to: toSnapshot?.audience_coverage || {},
      added: fromSnapshot?.exists && toSnapshot?.exists ? difference(toSnapshot.audience_coverage?.audiences, fromSnapshot.audience_coverage?.audiences) : [],
      removed: fromSnapshot?.exists && toSnapshot?.exists ? difference(fromSnapshot.audience_coverage?.audiences, toSnapshot.audience_coverage?.audiences) : []
    },
    warning_counts_by_taxonomy: {
      import_counts_delta: buildMapDelta(fromSnapshot?.warning_summary?.import_counts || {}, toSnapshot?.warning_summary?.import_counts || {}),
      unresolved_counts_delta: buildMapDelta(fromSnapshot?.warning_summary?.unresolved_counts || {}, toSnapshot?.warning_summary?.unresolved_counts || {})
    },
    metadata_quality_summary: { from: fromSnapshot?.metadata_quality_summary || {}, to: toSnapshot?.metadata_quality_summary || {} },
    paywall_test_rule: { from: fromSnapshot?.paywall_test_rule || {}, to: toSnapshot?.paywall_test_rule || {} },
    lifecycle_state: buildLifecycleStateDelta(fromSnapshot, toSnapshot),
    snapshots: { from: fromSnapshot, to: toSnapshot }
  };
}

function buildDiffSummaryMarkdown(report) {
  const lines = [
    "# Scenario Diff Summary",
    "",
    `- generated_at: ${report.generated_at}`,
    `- candidate_scenario_id: ${report.candidate_scenario_id || "n/a"}`,
    ""
  ];

  for (const comparison of report.comparisons || []) {
    lines.push(`## ${comparison.from_state_role} -> ${comparison.to_state_role}`);
    lines.push(`- from: ${comparison.from_scenario_id}`);
    lines.push(`- to: ${comparison.to_scenario_id}`);
    lines.push(`- blockers: ${comparison.blockers.length}`);
    lines.push(`- warnings: ${comparison.warnings.length}`);
    lines.push(`- info: ${comparison.info.length}`);
    lines.push(`- publication_delta: ${comparison.counts.publication_count.delta}`);
    lines.push(`- issue_delta: ${comparison.counts.issue_count.delta}`);
    lines.push(`- article_delta: ${comparison.counts.article_count.delta}`);
    lines.push(`- added_publications: ${(comparison.inventory.publications_added || []).join(", ") || "none"}`);
    lines.push(`- removed_publications: ${(comparison.inventory.publications_removed || []).join(", ") || "none"}`);
    lines.push(`- added_issues: ${(comparison.inventory.issues_added || []).join(", ") || "none"}`);
    lines.push(`- removed_issues: ${(comparison.inventory.issues_removed || []).join(", ") || "none"}`);
    lines.push(`- added_articles: ${comparison.inventory.article_ids_added?.length || 0}`);
    lines.push(`- removed_articles: ${comparison.inventory.article_ids_removed?.length || 0}`);
    lines.push(`- unresolved_warning_delta_keys: ${Object.keys(comparison.warning_counts_by_taxonomy.unresolved_counts_delta || {}).join(", ") || "none"}`);
    lines.push("");
  }

  return lines.join("\n") + "\n";
}

function writeDiffArtifacts(report) {
  ensureOps2Dirs();
  writeJson(opsPaths.ops2DiffReport, report);
  writeText(opsPaths.ops2DiffSummary, buildDiffSummaryMarkdown(report));
}

export function compareScenarioSet({ candidateScenarioId = null, fromScenarioId = null, toScenarioId = null, baselineScenarioId = null } = {}) {
  ensureOps2Dirs();
  let report;

  if (fromScenarioId && toScenarioId) {
    report = {
      generated_at: new Date().toISOString(),
      candidate_scenario_id: toScenarioId,
      mode: "explicit_pair",
      comparisons: [
        compareTwoSnapshots({
          fromSnapshot: buildScenarioSnapshot(fromScenarioId, "from"),
          toSnapshot: buildScenarioSnapshot(toScenarioId, "to"),
          fromRole: "from",
          toRole: "to"
        })
      ]
    };
  } else {
    const selectedScenarioId = readSelected().selected_scenario_id || null;
    const currentScenarioId = readCurrentMeta().selected_scenario_id || null;
    const baselineId = resolveBaselineScenarioId(baselineScenarioId);
    const candidateId = candidateScenarioId || selectedScenarioId;
    if (!candidateId) throw new Error("OPS2_CANDIDATE_REQUIRED");

    const comparisons = [];
    if (currentScenarioId) {
      comparisons.push(compareTwoSnapshots({
        fromSnapshot: buildScenarioSnapshot(currentScenarioId, "current"),
        toSnapshot: buildScenarioSnapshot(candidateId, "candidate"),
        fromRole: "current",
        toRole: "candidate"
      }));
    }
    if (selectedScenarioId) {
      comparisons.push(compareTwoSnapshots({
        fromSnapshot: buildScenarioSnapshot(selectedScenarioId, "selected"),
        toSnapshot: buildScenarioSnapshot(candidateId, "candidate"),
        fromRole: "selected",
        toRole: "candidate"
      }));
    }
    if (baselineId) {
      comparisons.push(compareTwoSnapshots({
        fromSnapshot: buildScenarioSnapshot(baselineId, "baseline"),
        toSnapshot: buildScenarioSnapshot(candidateId, "candidate"),
        fromRole: "baseline",
        toRole: "candidate"
      }));
    }

    report = {
      generated_at: new Date().toISOString(),
      candidate_scenario_id: candidateId,
      mode: "candidate_context",
      baseline_scenario_id: baselineId,
      selected_scenario_id: selectedScenarioId,
      current_scenario_id: currentScenarioId,
      comparisons
    };
  }

  writeDiffArtifacts(report);
  return report;
}

export function buildOperatorCatalog() {
  ensureOpsDirs();
  const publications = readPublications();
  const issues = readIssues();
  const scenarios = readScenarios();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const metadataQuality = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"));
  const warningReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"));
  const test1Final = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "final-report.json"));
  const publishHistory = loadLatestReport(opsPaths.publishHistory) || { items: [] };
  const issueQualityMap = new Map((metadataQuality?.items || []).map((item) => [item.issue_id, item]));
  const issueWarningMap = new Map((warningReport?.items || []).map((item) => [item.issue_id, item]));
  const latestHistoryByScenario = new Map();

  for (const item of publishHistory.items || []) {
    latestHistoryByScenario.set(item.scenario_id, item);
  }

  const catalog = {
    generated_at: new Date().toISOString(),
    selected_scenario_id: selected.selected_scenario_id || null,
    current_scenario_id: currentMeta.selected_scenario_id || null,
    latest_gate_status: test1Final?.status || "unknown",
    publications: (publications.items || []).map((item) => ({
      id: item.id,
      display_name: item.display_name,
      locale: item.locale,
      status: item.status,
      parser_profiles: item.parser_profiles || []
    })),
    issues: (issues.items || []).map((item) => ({
      ...getIssueMeta(item),
      issue_id: item.issue_id,
      publication_id: item.publication_id,
      issue_label: item.issue_label,
      parser_profile: item.parser_profile,
      article_count: item.article_count || item.article_pair_count || 0,
      warnings_count: issueQualityMap.get(item.issue_id)?.warnings_count ?? item.import_warnings_count ?? item.warnings_count ?? 0,
      unresolved_warnings_count: issueQualityMap.get(item.issue_id)?.unresolved_warnings_count ?? 0,
      overrides_count: issueQualityMap.get(item.issue_id)?.overrides_count ?? 0,
      warning_types: issueWarningMap.get(item.issue_id)?.unresolved_warning_counts || {},
      manifest_path: item.manifest_path
    })).sort(compareIssueMetaDescending),
    scenarios: (scenarios.items || []).map((item) => ({
      scenario_id: item.scenario_id,
      status: item.status,
      selected: item.is_selected_for_current === true,
      selected_pointer: selected.selected_scenario_id === item.scenario_id,
      current_published: currentMeta.selected_scenario_id === item.scenario_id,
      imported_article_count: item.imported_article_count,
      included_publications: item.included_publications || [],
      included_issues: item.included_issues || [],
      latest_history: latestHistoryByScenario.get(item.scenario_id) || null
    }))
  };

  writeJson(opsPaths.operatorCatalogJson, catalog);
  const lines = [
    "# Operator Catalog",
    "",
    `- generated_at: ${catalog.generated_at}`,
    `- selected_scenario_id: ${catalog.selected_scenario_id}`,
    `- current_scenario_id: ${catalog.current_scenario_id}`,
    `- latest_gate_status: ${catalog.latest_gate_status}`,
    "",
    "## Publications",
    ...catalog.publications.map((item) => `- ${item.id}: ${item.display_name} [${item.status}]`),
    "",
    "## Issues",
    ...catalog.issues.map((item) => `- ${item.issue_id}: articles=${item.article_count}, warnings=${item.warnings_count}, unresolved=${item.unresolved_warnings_count}, overrides=${item.overrides_count}`),
    "",
    "## Scenarios",
    ...catalog.scenarios.map((item) => `- ${item.scenario_id}: status=${item.status}, selected_pointer=${item.selected_pointer}, current_published=${item.current_published}`)
  ];
  writeText(opsPaths.operatorCatalogMd, lines.join("\n") + "\n");
  writeJson(opsPaths.scenarioDashboard, {
    generated_at: catalog.generated_at,
    selected_scenario_id: catalog.selected_scenario_id,
    current_scenario_id: catalog.current_scenario_id,
    scenarios: catalog.scenarios
  });
  return catalog;
}

export function appendPublishHistory(entry) {
  ensureOpsDirs();
  const history = readJsonOr(opsPaths.publishHistory, { generated_at: null, items: [] });
  history.generated_at = new Date().toISOString();
  history.items.push(entry);
  writeJson(opsPaths.publishHistory, history);
  return history;
}

export function appendPromotionHistory(entry) {
  ensureOps2Dirs();
  const history = readJsonOr(opsPaths.ops2PromotionHistory, { generated_at: null, items: [] });
  history.generated_at = new Date().toISOString();
  history.items.push(entry);
  writeJson(opsPaths.ops2PromotionHistory, history);
  return history;
}

export function recordPromotionAction({ action, scenarioId, result, decision = null, blockers = [], warnings = [], info = [], notes = [] }) {
  return appendPromotionHistory({
    timestamp: new Date().toISOString(),
    action,
    scenario_id: scenarioId,
    result,
    decision,
    blockers,
    warnings,
    info,
    notes
  });
}

export function runCommand(command, args = []) {
  execFileSync("node", [command, ...args], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024
  });
}

export function evaluateGate({ scenarioId, refresh = true }) {
  ensureOpsDirs();
  const scenarios = readScenarios();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const scenario = (scenarios.items || []).find((item) => item.scenario_id === scenarioId);
  const blockers = [];
  const warnings = [];

  if (!scenario) {
    blockers.push(`scenario_missing:${scenarioId}`);
  } else if (scenario.status === "retired") {
    blockers.push(`scenario_retired:${scenarioId}`);
  }
  if (selected.selected_scenario_id && !((scenarios.items || []).some((item) => item.scenario_id === selected.selected_scenario_id))) {
    blockers.push(`selected_pointer_missing:${selected.selected_scenario_id}`);
  }
  if (currentMeta.selected_scenario_id && !(scenarios.items || []).some((item) => item.scenario_id === currentMeta.selected_scenario_id)) {
    blockers.push(`current_pointer_missing:${currentMeta.selected_scenario_id}`);
  }

  if (refresh) {
    runCommand(path.join(repoRoot, "scripts", "tests", "run-test1.mjs"));
  }

  const test1Final = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "final-report.json"));
  const contentContract = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "content-contract-report.json"));
  const parserGolden = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "parser-golden-report.json"));
  const lifecycle = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "lifecycle-report.json"));
  const appRegression = loadLatestReport(path.join(repoRoot, "output", "stage-test1", "app-regression-report.json"));
  const metadataQuality = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"));
  const warningReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"));
  const overrideReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "override-report.json"));

  if (test1Final?.status !== "passed") blockers.push("test1_final_failed");
  if (contentContract?.status !== "passed") blockers.push("content_contract_failed");
  if (parserGolden?.status !== "passed") blockers.push("parser_golden_failed");
  if (lifecycle?.status !== "passed") blockers.push("lifecycle_failed");
  if (appRegression?.status !== "passed") blockers.push("app_regression_failed");
  if (!metadataQuality) blockers.push("metadata_quality_missing");
  if (!warningReport) blockers.push("warning_report_missing");
  if (!overrideReport) blockers.push("override_report_missing");

  if (scenario) {
    const includedIssues = (scenario.included_issues || []).map((item) => `${item.publication_id}__${item.issue_label}`);
    const contractWarnings = (contentContract?.items || [])
      .filter((item) => includedIssues.includes(item.issue_id))
      .flatMap((item) => (item.warnings || []).map((warning) => ({ issue_id: item.issue_id, type: warning.type })));

    for (const warning of contractWarnings) {
      const allowed = knownWarningPolicy[warning.issue_id] || [];
      if (allowed.includes(warning.type)) warnings.push(`${warning.issue_id}:${warning.type}`);
      else blockers.push(`unexpected_contract_warning:${warning.issue_id}:${warning.type}`);
    }

    const unresolvedWarningItems = (warningReport?.items || []).filter((item) => includedIssues.includes(item.issue_id));
    for (const item of unresolvedWarningItems) {
      for (const warningType of Object.keys(item.unresolved_warning_counts || {})) {
        const allowed = knownWarningPolicy[item.issue_id] || [];
        if (allowed.includes(warningType)) warnings.push(`${item.issue_id}:${warningType}`);
        else blockers.push(`unexpected_unresolved_warning:${item.issue_id}:${warningType}`);
      }
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    refresh_mode: refresh ? "rerun_test1_serial" : "read_existing_reports",
    selected_scenario_id: selected.selected_scenario_id || null,
    current_scenario_id: currentMeta.selected_scenario_id || null,
    blockers,
    warnings: Array.from(new Set(warnings)),
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "passed",
    upstream_reports: {
      metadata_quality: "output/stage-data1d/metadata-quality-report.json",
      warning_report: "output/stage-data1d/warning-report.json",
      override_report: "output/stage-data1d/override-report.json",
      test1_final: "output/stage-test1/final-report.json",
      content_contract: "output/stage-test1/content-contract-report.json",
      parser_golden: "output/stage-test1/parser-golden-report.json",
      lifecycle: "output/stage-test1/lifecycle-report.json",
      app_regression: "output/stage-test1/app-regression-report.json"
    }
  };

  writeJson(opsPaths.publishGate, report);
  buildOperatorCatalog();
  return report;
}

function summarizeReportsForScenario(scenarioId) {
  const scenario = findScenarioRecord(scenarioId);
  const includedIssueIds = (scenario?.included_issues || [])
    .map((item) => issueKeyFromParts(item.publication_id, item.issue_label))
    .filter(Boolean);

  const metadataQuality = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"));
  const warningReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"));
  const overrideReport = loadLatestReport(path.join(repoRoot, "output", "stage-data1d", "override-report.json"));

  return {
    metadata_quality_summary: {
      present: Boolean(metadataQuality),
      items: (metadataQuality?.items || []).filter((item) => includedIssueIds.includes(item.issue_id))
    },
    warning_summary: {
      present: Boolean(warningReport),
      items: (warningReport?.items || []).filter((item) => includedIssueIds.includes(item.issue_id))
    },
    override_summary: {
      present: Boolean(overrideReport),
      entries: (overrideReport?.entries || []).filter((entry) => includedIssueIds.includes(issueKeyFromParts(entry.publication_id, entry.issue_label)))
    },
    test1: {
      final: loadLatestReport(path.join(repoRoot, "output", "stage-test1", "final-report.json")),
      content_contract: loadLatestReport(path.join(repoRoot, "output", "stage-test1", "content-contract-report.json")),
      parser_golden: loadLatestReport(path.join(repoRoot, "output", "stage-test1", "parser-golden-report.json")),
      lifecycle: loadLatestReport(path.join(repoRoot, "output", "stage-test1", "lifecycle-report.json")),
      app_regression: loadLatestReport(path.join(repoRoot, "output", "stage-test1", "app-regression-report.json"))
    }
  };
}

export function buildPromotionDashboard() {
  ensureOps2Dirs();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const baselineScenarioId = resolveBaselineScenarioId();
  const diff = readJsonOr(opsPaths.ops2DiffReport, { comparisons: [] });
  const evaluation = readJsonOr(opsPaths.ops2PromotionEvaluation, null);
  const history = readJsonOr(opsPaths.ops2PromotionHistory, { items: [] });
  const lastAction = (history.items || []).slice(-1)[0] || null;
  const dashboard = {
    generated_at: new Date().toISOString(),
    baseline_scenario_id: baselineScenarioId,
    current_scenario_id: currentMeta.selected_scenario_id || null,
    selected_scenario_id: selected.selected_scenario_id || null,
    candidate_scenario_id: evaluation?.scenario_id || diff?.candidate_scenario_id || null,
    diff_summary: (diff.comparisons || []).map((comparison) => ({
      from_state_role: comparison.from_state_role,
      from_scenario_id: comparison.from_scenario_id,
      to_scenario_id: comparison.to_scenario_id,
      blockers: comparison.blockers.length,
      warnings: comparison.warnings.length,
      info: comparison.info.length,
      article_delta: comparison.counts?.article_count?.delta || 0
    })),
    gate_summary: evaluation?.gate || readJsonOr(opsPaths.publishGate, null),
    promotion_decision: evaluation ? {
      decision: evaluation.decision,
      blockers: evaluation.blockers,
      warnings: evaluation.warnings,
      info: evaluation.info
    } : null,
    last_action: lastAction,
    unresolved_warnings: evaluation?.warnings || []
  };

  writeJson(opsPaths.ops2PromotionDashboard, dashboard);
  const lines = [
    "# Promotion Summary",
    "",
    `- generated_at: ${dashboard.generated_at}`,
    `- baseline scenario: ${dashboard.baseline_scenario_id || "unknown"}`,
    `- current scenario: ${dashboard.current_scenario_id || "unknown"}`,
    `- selected scenario: ${dashboard.selected_scenario_id || "unknown"}`,
    `- candidate scenario: ${dashboard.candidate_scenario_id || "unknown"}`,
    `- decision: ${dashboard.promotion_decision?.decision || "unknown"}`,
    `- last action: ${dashboard.last_action?.action || "none"}`,
    `- unresolved warnings: ${dashboard.unresolved_warnings.length}`,
    ""
  ];

  for (const item of dashboard.diff_summary || []) {
    lines.push(`## ${item.from_state_role} -> candidate`);
    lines.push(`- from: ${item.from_scenario_id}`);
    lines.push(`- to: ${item.to_scenario_id}`);
    lines.push(`- blockers: ${item.blockers}`);
    lines.push(`- warnings: ${item.warnings}`);
    lines.push(`- info: ${item.info}`);
    lines.push(`- article_delta: ${item.article_delta}`);
    lines.push("");
  }

  writeText(opsPaths.ops2PromotionSummary, lines.join("\n") + "\n");
  return dashboard;
}

export function evaluatePromotionDecision({ scenarioId, baselineScenarioId = null, refresh = true }) {
  ensureOps2Dirs();
  if (!scenarioId) throw new Error("OPS2_SCENARIO_REQUIRED");

  const scenario = findScenarioRecord(scenarioId);
  const currentScenarioId = readCurrentMeta().selected_scenario_id || null;
  const selectedScenarioId = readSelected().selected_scenario_id || null;
  const baselineId = resolveBaselineScenarioId(baselineScenarioId);
  const diff = compareScenarioSet({ candidateScenarioId: scenarioId, baselineScenarioId: baselineId });
  const gate = evaluateGate({ scenarioId, refresh });
  const reportInputs = summarizeReportsForScenario(scenarioId);
  const budgetSummary = scenario ? evaluateScenarioBudget({ scenarioId, scenarioRecord: scenario }) : null;
  const taxonomySummary = readScenarioTaxonomySummary(scenarioId);
  const blockers = [];
  const warnings = [];
  const info = [];

  if (!scenario) blockers.push("scenario_missing");
  else if (scenario.status === "retired") blockers.push("scenario_retired");
  if (!baselineId || !findScenarioRecord(baselineId)) blockers.push("baseline_missing");
  if (selectedScenarioId && !findScenarioRecord(selectedScenarioId)) blockers.push("selected_pointer_missing");
  if (currentScenarioId && !findScenarioRecord(currentScenarioId)) blockers.push("current_pointer_missing");

  for (const comparison of diff.comparisons || []) {
    for (const blocker of comparison.blockers || []) blockers.push(`diff:${comparison.from_state_role}:${blocker.code}`);
    for (const warning of comparison.warnings || []) {
      if (warning.code === "override_count_changed" && (budgetSummary?.accepted_overrides || []).length > 0 && (budgetSummary?.over_budget_overrides || []).length === 0) {
        info.push(`diff:${comparison.from_state_role}:${warning.code}:accepted_by_budget`);
        continue;
      }
      if (warning.code === "warning_taxonomy_increase" && (budgetSummary?.accepted_warnings || []).length > 0 && (budgetSummary?.over_budget_warnings || []).length === 0 && (budgetSummary?.unregistered_warnings || []).length === 0) {
        info.push(`diff:${comparison.from_state_role}:${warning.code}:accepted_by_budget`);
        continue;
      }
      warnings.push(`diff:${comparison.from_state_role}:${warning.code}`);
    }
    for (const informational of comparison.info || []) info.push(`diff:${comparison.from_state_role}:${informational.code}`);
  }

  for (const blocker of gate.blockers || []) blockers.push(`gate:${blocker}`);
  for (const warning of gate.warnings || []) {
    const [issueId, warningType] = String(warning).split(":");
    const acceptedWarning = (budgetSummary?.accepted_warnings || []).find((entry) => entry.issue_id === issueId && entry.warning_type === warningType);
    const acceptedByKnownPolicy = (knownWarningPolicy[issueId] || []).includes(warningType);
    const blockedByBudget =
      (budgetSummary?.over_budget_warnings || []).some((entry) => entry.issue_id === issueId && entry.warning_type === warningType) ||
      (budgetSummary?.unregistered_warnings || []).some((entry) => entry.issue_id === issueId && entry.warning_type === warningType);
    if ((acceptedWarning || acceptedByKnownPolicy) && !blockedByBudget) {
      info.push(`gate:${warning}:accepted_by_budget`);
      continue;
    }
    warnings.push(`gate:${warning}`);
  }

  if (!reportInputs.metadata_quality_summary.present) blockers.push("metadata_quality_missing");
  if (!reportInputs.warning_summary.present) blockers.push("warning_report_missing");
  if (!reportInputs.override_summary.present) blockers.push("override_report_missing");

  const unresolvedWarningCount = (reportInputs.metadata_quality_summary.items || []).reduce((total, item) => total + (item.unresolved_warnings_count || 0), 0);
  const overrideCount = (reportInputs.override_summary.entries || []).length;
  if ((budgetSummary?.unregistered_warnings || []).length > 0) {
    warnings.push(`quality:unregistered_warning_count:${budgetSummary.unregistered_warnings.length}`);
  }
  if ((budgetSummary?.over_budget_warnings || []).length > 0) {
    warnings.push(`quality:over_budget_warning_count:${budgetSummary.over_budget_warnings.length}`);
  }
  if ((budgetSummary?.over_budget_overrides || []).length > 0) {
    warnings.push(`quality:over_budget_override_count:${budgetSummary.over_budget_overrides.length}`);
  }
  if (unresolvedWarningCount > 0 && (budgetSummary?.accepted_warnings || []).length > 0 && (budgetSummary?.over_budget_warnings || []).length === 0 && (budgetSummary?.unregistered_warnings || []).length === 0) {
    info.push(`quality:unresolved_warning_count:${unresolvedWarningCount}:accepted_by_budget`);
  } else if (unresolvedWarningCount > 0) {
    warnings.push(`quality:unresolved_warning_count:${unresolvedWarningCount}`);
  }
  if (overrideCount > 0 && (budgetSummary?.accepted_overrides || []).length > 0 && (budgetSummary?.over_budget_overrides || []).length === 0) {
    info.push(`quality:override_count:${overrideCount}:accepted_by_budget`);
  } else if (overrideCount > 0) {
    warnings.push(`quality:override_count:${overrideCount}`);
  }
  if (budgetSummary && budgetSummary.release_eligible === false) {
    warnings.push(`policy:preview_only_scenario:${budgetSummary.scenario_class}`);
  }
  if (taxonomySummary?.unmapped_count > 0) {
    info.push(`taxonomy:unmapped_count:${taxonomySummary.unmapped_count}`);
  } else if (taxonomySummary) {
    info.push(`taxonomy:mapped_ratio:${taxonomySummary.mapped_ratio}`);
  }

  const decision = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "hold_warning" : "promotable";
  const report = {
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    selected_scenario_id: selectedScenarioId,
    current_scenario_id: currentScenarioId,
    diff_report: path.relative(path.dirname(opsPaths.ops2PromotionEvaluation), opsPaths.ops2DiffReport).replace(/\\/g, "/"),
    taxonomy_report: path.relative(path.dirname(opsPaths.ops2PromotionEvaluation), data3Paths.taxonomyCoverageReport).replace(/\\/g, "/"),
    gate,
    budget_summary: budgetSummary,
    taxonomy_summary: taxonomySummary,
    reports: reportInputs.test1,
    decision,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    info: Array.from(new Set(info))
  };

  writeJson(opsPaths.ops2PromotionEvaluation, report);
  recordPromotionAction({
    action: "evaluate",
    scenarioId,
    result: decision === "blocked" ? "blocked" : "ok",
    decision,
    blockers: report.blockers,
    warnings: report.warnings,
    info: report.info
  });
  buildPromotionDashboard();
  return report;
}

export function recordAction({ action, scenarioId, result, gateStatus = null, warnings = [], blockers = [], notes = [] }) {
  return appendPublishHistory({
    timestamp: new Date().toISOString(),
    action,
    scenario_id: scenarioId,
    result,
    gate_status: gateStatus,
    warnings,
    blockers,
    notes
  });
}

export function listScenarioView() {
  const scenarios = readScenarios();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  return {
    selected_scenario_id: selected.selected_scenario_id || scenarios.selected_scenario_id || null,
    current_scenario_id: currentMeta.selected_scenario_id || null,
    baseline_scenario_id: resolveBaselineScenarioId(),
    scenarios: (scenarios.items || []).map((item) => ({
      scenario_id: item.scenario_id,
      status: item.status,
      source_kind: item.source_kind,
      imported_article_count: item.imported_article_count,
      selected_pointer: selected.selected_scenario_id === item.scenario_id,
      current_published: currentMeta.selected_scenario_id === item.scenario_id
    }))
  };
}

export function inspectScenario(scenarioId) {
  ensureOps2Dirs();
  const snapshot = buildScenarioSnapshot(scenarioId, "candidate");
  const report = {
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    baseline_scenario_id: resolveBaselineScenarioId(),
    selected_scenario_id: readSelected().selected_scenario_id || null,
    current_scenario_id: readCurrentMeta().selected_scenario_id || null,
    snapshot
  };
  writeJson(opsPaths.ops2InspectReport, report);
  recordPromotionAction({
    action: "inspect",
    scenarioId,
    result: snapshot.exists ? "ok" : "missing",
    blockers: snapshot.exists ? [] : ["scenario_missing"]
  });
  buildPromotionDashboard();
  return report;
}

export function archivePack(sourcePath, archiveName = null) {
  ensureOpsDirs();
  const resolved = path.isAbsolute(sourcePath) ? sourcePath : path.join(repoRoot, sourcePath);
  if (!fs.existsSync(resolved)) throw new Error(`OPS1_PACK_NOT_FOUND:${resolved}`);
  const targetName = archiveName || `${new Date().toISOString().replace(/[:.]/g, "-")}-${path.basename(resolved)}`;
  const targetPath = path.join(opsPaths.intakeArchive, targetName);
  fs.copyFileSync(resolved, targetPath);
  return { source_path: resolved, archived_path: targetPath };
}
