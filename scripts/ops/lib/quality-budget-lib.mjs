import fs from "node:fs";
import path from "node:path";

import { pipelinePaths, readJson, repoRoot, writeJson } from "../../import/lib/content-pipeline.mjs";
import { resolveSandboxPath } from "../../lib/sandbox-paths.mjs";

export const qualityPaths = {
  root: path.join(repoRoot, "data", "real-content", "quality"),
  acceptedWarnings: path.join(repoRoot, "data", "real-content", "quality", "accepted-warnings.json"),
  warningBudgets: path.join(repoRoot, "data", "real-content", "quality", "warning-budgets.json"),
  outputRoot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2")),
  qualityConvergenceReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "quality-convergence-report.json")),
  warningBudgetReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "warning-budget-report.json")),
  releaseCandidateReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "release-candidate-report.json")),
  releaseCandidateManifest: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "release-candidate-manifest.json")),
  promotionReadinessReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "promotion-readiness-report.json")),
  smokeReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data2", "smoke-report.json"))
};

export function ensureQualityDirs() {
  fs.mkdirSync(qualityPaths.root, { recursive: true });
  fs.mkdirSync(qualityPaths.outputRoot, { recursive: true });
}

function issueDir(publicationId, issueLabel) {
  if (publicationId === "readers_digest") {
    return path.join(pipelinePaths.dataRoot, "readers-digest", issueLabel);
  }
  return path.join(pipelinePaths.dataRoot, publicationId, issueLabel);
}

function parseIssueId(issueId) {
  const splitIndex = issueId.indexOf("__");
  if (splitIndex < 0) {
    return { publicationId: null, issueLabel: null };
  }
  return {
    publicationId: issueId.slice(0, splitIndex),
    issueLabel: issueId.slice(splitIndex + 2)
  };
}

export function loadAcceptedWarnings() {
  return readJson(qualityPaths.acceptedWarnings, { version: "stage-data2-v1", entries: [] });
}

export function loadWarningBudgets() {
  return readJson(qualityPaths.warningBudgets, {
    version: "stage-data2-v1",
    scenario_budgets: {},
    issue_budgets: {}
  });
}

export function loadNormalizedIssueRecords(issueId) {
  const { publicationId, issueLabel } = parseIssueId(issueId);
  if (!publicationId || !issueLabel) {
    return [];
  }
  const normalizedRoot = path.join(issueDir(publicationId, issueLabel), "normalized");
  if (!fs.existsSync(normalizedRoot)) {
    return [];
  }
  return fs.readdirSync(normalizedRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(normalizedRoot, name), null))
    .filter(Boolean);
}

export function summarizeIssueWarnings(issueId) {
  const records = loadNormalizedIssueRecords(issueId);
  const unresolvedByType = {};
  const importByType = {};

  for (const record of records) {
    for (const warningType of record.import_warnings || []) {
      const bucket = importByType[warningType] || { count: 0, article_ids: [] };
      bucket.count += 1;
      bucket.article_ids.push(record.article_id);
      importByType[warningType] = bucket;
    }
    for (const warningType of record.effective_warnings || []) {
      const bucket = unresolvedByType[warningType] || { count: 0, article_ids: [] };
      bucket.count += 1;
      bucket.article_ids.push(record.article_id);
      unresolvedByType[warningType] = bucket;
    }
  }

  return {
    issue_id: issueId,
    article_count: records.length,
    import_warning_counts: Object.fromEntries(Object.entries(importByType).map(([key, value]) => [key, value.count])),
    unresolved_warning_counts: Object.fromEntries(Object.entries(unresolvedByType).map(([key, value]) => [key, value.count])),
    unresolved_warning_articles: Object.fromEntries(Object.entries(unresolvedByType).map(([key, value]) => [key, value.article_ids]))
  };
}

function scenarioBudgetFor(scenarioId, scenarioRecord) {
  const budgets = loadWarningBudgets();
  if (budgets.scenario_budgets?.[scenarioId]) {
    return budgets.scenario_budgets[scenarioId];
  }
  if (scenarioRecord?.source_kind === "real_content_split_pack_mixed") {
    return budgets.scenario_budgets?.default_preview_only || null;
  }
  return budgets.scenario_budgets?.default_release_candidate || null;
}

function matchingAcceptedEntries({ acceptedWarnings, scenarioId, issueId, warningType = null, kind = "warning" }) {
  return (acceptedWarnings.entries || []).filter((entry) => {
    if ((entry.kind || "warning") !== kind) {
      return false;
    }
    if (entry.issue_id && entry.issue_id !== issueId) {
      return false;
    }
    if (warningType && entry.warning_type !== warningType) {
      return false;
    }
    if (Array.isArray(entry.applies_to_scenarios) && entry.applies_to_scenarios.length > 0 && !entry.applies_to_scenarios.includes(scenarioId)) {
      return false;
    }
    return true;
  });
}

function selectApplicableEntry(entries, count) {
  return entries.find((entry) => (entry.max_count ?? 0) >= count) || entries[0] || null;
}

export function evaluateScenarioBudget({ scenarioId, scenarioRecord }) {
  ensureQualityDirs();
  const acceptedWarnings = loadAcceptedWarnings();
  const budgets = loadWarningBudgets();
  const issueIds = (scenarioRecord?.included_issues || []).map((item) => `${item.publication_id}__${item.issue_label}`);
  const issueSummaries = issueIds.map((issueId) => summarizeIssueWarnings(issueId));
  const overrideReport = readJson(path.join(repoRoot, "output", "stage-data1d", "override-report.json"), { entries: [] });
  const overrideCountByIssue = {};
  for (const entry of overrideReport.entries || []) {
    const issueId = `${entry.publication_id}__${entry.issue_label}`;
    overrideCountByIssue[issueId] = (overrideCountByIssue[issueId] || 0) + 1;
  }
  const accepted = [];
  const overBudget = [];
  const unregistered = [];
  const acceptedOverrides = [];
  const overBudgetOverrides = [];
  const budget = scenarioBudgetFor(scenarioId, scenarioRecord) || {};

  for (const issueSummary of issueSummaries) {
    for (const [warningType, count] of Object.entries(issueSummary.unresolved_warning_counts || {})) {
      const candidates = matchingAcceptedEntries({
        acceptedWarnings,
        scenarioId,
        issueId: issueSummary.issue_id,
        warningType,
        kind: "warning"
      });
      if (candidates.length === 0) {
        unregistered.push({
          issue_id: issueSummary.issue_id,
          warning_type: warningType,
          count,
          article_ids: issueSummary.unresolved_warning_articles?.[warningType] || []
        });
        continue;
      }

      const matched = selectApplicableEntry(candidates, count);
      if ((matched.max_count ?? 0) >= count) {
        accepted.push({
          id: matched.id,
          issue_id: issueSummary.issue_id,
          warning_type: warningType,
          count,
          classification: matched.classification,
          article_ids: issueSummary.unresolved_warning_articles?.[warningType] || []
        });
      } else {
        overBudget.push({
          id: matched.id,
          issue_id: issueSummary.issue_id,
          warning_type: warningType,
          count,
          max_count: matched.max_count ?? 0,
          classification: matched.classification
        });
      }
    }

    const issueBudget = budgets.issue_budgets?.[issueSummary.issue_id] || {};
    const actualCount = overrideCountByIssue[issueSummary.issue_id] || 0;
    if (actualCount > 0) {
      const overrideEntries = matchingAcceptedEntries({
        acceptedWarnings,
        scenarioId,
        issueId: issueSummary.issue_id,
        kind: "override_count"
      });
      const matched = selectApplicableEntry(overrideEntries, actualCount);
      if (matched && (matched.max_count ?? 0) >= actualCount) {
        acceptedOverrides.push({
          id: matched.id,
          issue_id: issueSummary.issue_id,
          count: actualCount,
          classification: matched.classification
        });
      } else {
        overBudgetOverrides.push({
          issue_id: issueSummary.issue_id,
          count: actualCount,
          max_count: matched?.max_count ?? issueBudget.override_budget ?? 0
        });
      }
    }
  }

  return {
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    scenario_class: budget.scenario_class || "release_candidate",
    release_eligible: budget.release_eligible !== false,
    issue_summaries: issueSummaries,
    accepted_warnings: accepted,
    over_budget_warnings: overBudget,
    unregistered_warnings: unregistered,
    accepted_overrides: acceptedOverrides,
    over_budget_overrides: overBudgetOverrides
  };
}

export function writeQualityReport(filePath, value) {
  ensureQualityDirs();
  writeJson(filePath, value);
}
