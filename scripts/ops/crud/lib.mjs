import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  pipelinePaths,
  readJson,
  repoRoot,
  writeJson
} from "../../import/lib/content-pipeline.mjs";
import { getOverrideFilePath, loadEditorialOverrides } from "../../import/lib/editorial-overrides.mjs";
import { createTaxonomyContext, normalizeTaxonomyRecord, resolvePublicationDataDir, taxonomyPaths } from "../../import/lib/taxonomy-normalizer.mjs";
import { acquireStateLock, releaseStateLock } from "../../lib/state-lock.mjs";
import { parseArgs } from "../lib/ops-lib.mjs";
import { qualityPaths, writeQualityReport } from "../lib/quality-budget-lib.mjs";
import { data3Paths, buildData3Reports } from "../lib/taxonomy-lib.mjs";
import { captureOpsEvent, refreshObservabilityReports, recordObservabilityEvent } from "../lib/observability-lib.mjs";

export const ops5Paths = {
  root: path.join(repoRoot, "output", "stage-ops5"),
  crudAuditLog: path.join(repoRoot, "output", "stage-ops5", "crud-audit-log.json"),
  entityChangeReport: path.join(repoRoot, "output", "stage-ops5", "entity-change-report.json"),
  rebuildTriggerReport: path.join(repoRoot, "output", "stage-ops5", "rebuild-trigger-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-ops5", "smoke-report.json")
};

function nowIso() {
  return new Date().toISOString();
}

export function ensureOps5Dirs() {
  fs.mkdirSync(ops5Paths.root, { recursive: true });
}

export function normalizePublication(record) {
  return {
    publication_id: record.id,
    display_name: record.display_name || "",
    status: record.status || "active",
    locale: record.locale || "zh-CN",
    description: record.description || "",
    notes: record.notes || "",
    enabled: record.enabled !== false,
    parser_profiles: record.parser_profiles || []
  };
}

export function normalizeIssue(record) {
  return {
    issue_id: record.issue_id,
    publication_id: record.publication_id,
    issue_label: record.issue_label,
    status: record.status || record.import_status || "active",
    source_pack: record.source_pack || record.source_zip || "",
    parser_profile: record.parser_profile || "",
    notes: record.notes || "",
    enabled: record.enabled !== false,
    manifest_path: record.manifest_path || null,
    warnings_count: record.warnings_count ?? record.import_warnings_count ?? 0,
    article_count: record.article_pair_count ?? record.article_count ?? 0
  };
}

export function readPublicationsRegistry() {
  return readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
}

export function readIssuesRegistry() {
  return readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
}

export function writePublicationsRegistry(registry) {
  writeJson(pipelinePaths.publicationsRegistry, registry);
}

export function writeIssuesRegistry(registry) {
  writeJson(pipelinePaths.issuesRegistry, registry);
}

export function listNormalizedIssueRecords(publicationId, issueLabel) {
  const normalizedRoot = path.join(resolvePublicationDataDir(publicationId), issueLabel, "normalized");
  if (!fs.existsSync(normalizedRoot)) {
    return [];
  }
  return fs.readdirSync(normalizedRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const filePath = path.join(normalizedRoot, name);
      return {
        filePath,
        record: readJson(filePath, null)
      };
    })
    .filter((item) => Boolean(item.record));
}

function countWarnings(records, fieldName = "effective_warnings") {
  return records.reduce((accumulator, record) => {
    for (const warning of record[fieldName] || []) {
      accumulator[warning] = (accumulator[warning] || 0) + 1;
    }
    return accumulator;
  }, {});
}

function buildIssueQualityEntry(issue, records) {
  const articleCount = records.length || 1;
  const withTitle = records.filter((record) => Boolean(record.title)).length;
  const withSection = records.filter((record) => Boolean(record.section_label)).length;
  const withOrdinal = records.filter((record) => Number.isFinite(Number(record.ordinal))).length;
  const overridesCount = records.filter((record) => record.editorial_override_applied).length;
  const unresolvedWarnings = records.reduce((sum, record) => sum + ((record.effective_warnings || []).length), 0);
  return {
    issue_id: issue.issue_id,
    publication_id: issue.publication_id,
    issue_label: issue.issue_label,
    article_count: records.length,
    title_complete_rate: withTitle / articleCount,
    section_label_complete_rate: withSection / articleCount,
    ordinal_complete_rate: withOrdinal / articleCount,
    overrides_count: overridesCount,
    warnings_count: records.reduce((sum, record) => sum + ((record.import_warnings || []).length), 0),
    unresolved_warnings_count: unresolvedWarnings
  };
}

export function rebuildMetadataQualityReports() {
  const issuesRegistry = readIssuesRegistry();
  const metadataQuality = [];
  const warningItems = [];
  const overrideEntries = [];

  for (const issue of issuesRegistry.items || []) {
    const records = listNormalizedIssueRecords(issue.publication_id, issue.issue_label).map((item) => item.record);
    if (records.length === 0) continue;
    metadataQuality.push(buildIssueQualityEntry(issue, records));
    warningItems.push({
      issue_id: issue.issue_id,
      import_warning_counts: countWarnings(records, "import_warnings"),
      unresolved_warning_counts: countWarnings(records, "effective_warnings")
    });
    const overrideFile = loadEditorialOverrides(issue.publication_id, issue.issue_label);
    overrideEntries.push(...(overrideFile.articles || []).map((entry) => ({
      publication_id: issue.publication_id,
      issue_label: issue.issue_label,
      article_id: entry.article_id,
      reason: entry.reason || entry.notes || "",
      fields: entry.fields || {},
      display_warning_suppression: entry.display_warning_suppression || [],
      base_fields: entry.base_fields || {}
    })));
  }

  const generatedAt = nowIso();
  writeJson(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"), {
    generated_at: generatedAt,
    items: metadataQuality
  });
  writeJson(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"), {
    generated_at: generatedAt,
    items: warningItems
  });
  writeJson(path.join(repoRoot, "output", "stage-data1d", "override-report.json"), {
    generated_at: generatedAt,
    entries: overrideEntries
  });

  return {
    action: "refresh_metadata_quality_reports",
    status: "ok",
    metadata_quality_count: metadataQuality.length,
    warning_issue_count: warningItems.length,
    override_entry_count: overrideEntries.length
  };
}

function runNodeJson(scriptRelativePath, args = [], allowFailure = false) {
  try {
    const output = execFileSync(process.execPath, [path.join(repoRoot, scriptRelativePath), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024
    });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure && error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}

function writeAuditArtifacts(items) {
  const entityCounts = {};
  const actionCounts = {};
  const triggered = [];

  for (const item of items) {
    entityCounts[item.entity_type] = (entityCounts[item.entity_type] || 0) + 1;
    actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
    for (const followUp of item.triggered_follow_up_actions || []) {
      triggered.push({
        timestamp: item.timestamp,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        action: item.action,
        follow_up_action: followUp.action,
        status: followUp.status
      });
    }
  }

  writeJson(ops5Paths.entityChangeReport, {
    generated_at: nowIso(),
    total_entries: items.length,
    counts_by_entity_type: entityCounts,
    counts_by_action: actionCounts,
    recent_changes: items.slice(-40).reverse()
  });
  writeJson(ops5Paths.rebuildTriggerReport, {
    generated_at: nowIso(),
    total_follow_up_actions: triggered.length,
    items: triggered.slice(-80).reverse()
  });
}

export function appendCrudAudit(entry) {
  ensureOps5Dirs();
  const current = readJson(ops5Paths.crudAuditLog, {
    generated_at: null,
    items: []
  });
  current.generated_at = nowIso();
  current.items.push(entry);
  writeJson(ops5Paths.crudAuditLog, current);
  writeAuditArtifacts(current.items);
  return current;
}

export function buildEditorialCrudSnapshot() {
  ensureOps5Dirs();
  const publications = (readPublicationsRegistry().items || []).map(normalizePublication);
  const issues = (readIssuesRegistry().items || []).map(normalizeIssue);
  const canonical = readJson(taxonomyPaths.canonicalSections, { sections: [] });
  const buckets = readJson(taxonomyPaths.discoveryBuckets, { buckets: [] });
  const unmapped = readJson(data3Paths.unmappedSectionsReport, { publications: [] });
  const budgets = readJson(qualityPaths.warningBudgets, { issue_budgets: {} });
  const audit = readJson(ops5Paths.crudAuditLog, { items: [] });
  return {
    generated_at: nowIso(),
    publications,
    issues,
    taxonomy: {
      canonical_sections: canonical.sections || [],
      discovery_buckets: buckets.buckets || [],
      unmapped_publications: unmapped.publications || []
    },
    scenario_membership: {
      issue_budgets: budgets.issue_budgets || {}
    },
    audit: {
      total_entries: (audit.items || []).length,
      recent_changes: (audit.items || []).slice(-20).reverse()
    }
  };
}

export async function withCrudMutation({
  entityType,
  entityId,
  action,
  before = null,
  mutation,
  input = {},
  followUpFactory = null
}) {
  let lock = null;
  const timestamp = nowIso();
  const auditEntry = {
    actor: "local_op",
    mode: "local_op",
    entity_type: entityType,
    entity_id: entityId,
    action,
    before,
    after: null,
    timestamp,
    success: false,
    failure_code: null,
    failure_message: null,
    triggered_follow_up_actions: [],
    lock_name: "runtime-state",
    observability_event_id: null
  };

  try {
    lock = await acquireStateLock("runtime-state", {
      runId: process.env.RUN_ID || `ops5_${action}`,
      script: `scripts/ops/crud/${entityType}.mjs`
    });
    const result = await mutation();
    auditEntry.after = result.after ?? null;
    if (typeof followUpFactory === "function") {
      auditEntry.triggered_follow_up_actions = followUpFactory(result) || [];
    }
    const obs = recordObservabilityEvent({
      event_type: `crud_${entityType}_${action}`,
      event_category: "editorial_crud",
      source_surface: "ops",
      user_mode: "operator",
      severity: "info",
      details: {
        entity_type: entityType,
        entity_id: entityId,
        action,
        input,
        follow_up_actions: auditEntry.triggered_follow_up_actions
      }
    });
    auditEntry.observability_event_id = obs.event.event_id;
    auditEntry.success = true;
    appendCrudAudit(auditEntry);
    releaseStateLock(lock);
    refreshObservabilityReports();
    return {
      status: "ok",
      entity_type: entityType,
      entity_id: entityId,
      action,
      before,
      after: auditEntry.after,
      follow_up_actions: auditEntry.triggered_follow_up_actions
    };
  } catch (error) {
    auditEntry.failure_code = error.code || "OPS5_MUTATION_FAILED";
    auditEntry.failure_message = error.message || String(error);
    const obs = recordObservabilityEvent({
      event_type: `crud_${entityType}_${action}_failed`,
      event_category: "editorial_crud",
      source_surface: "ops",
      user_mode: "operator",
      severity: auditEntry.failure_code === "STATE_LOCK_BUSY" ? "critical" : "error",
      error_code: auditEntry.failure_code,
      error_message: auditEntry.failure_message,
      details: {
        entity_type: entityType,
        entity_id: entityId,
        action,
        input
      }
    });
    auditEntry.observability_event_id = obs.event.event_id;
    appendCrudAudit(auditEntry);
    releaseStateLock(lock);
    refreshObservabilityReports();
    return {
      status: "error",
      entity_type: entityType,
      entity_id: entityId,
      action,
      error: {
        code: auditEntry.failure_code,
        message: auditEntry.failure_message
      }
    };
  }
}

export function parseCrudCli(argv) {
  const args = parseArgs(argv);
  const payload = args.payload ? JSON.parse(args.payload) : {};
  return {
    action: args.action || "list",
    payload
  };
}

export function loadPublicationById(publicationId) {
  return (readPublicationsRegistry().items || []).find((item) => item.id === publicationId) || null;
}

export function loadIssueById(issueId) {
  return (readIssuesRegistry().items || []).find((item) => item.issue_id === issueId) || null;
}

function refreshPromotionReadiness() {
  const mixed = runNodeJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data1c_three_release_mixed_preview", "--use-existing-reports"]);
  const candidate = runNodeJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  const readiness = {
    generated_at: nowIso(),
    mixed_preview: mixed.evaluation,
    release_candidate: candidate.evaluation
  };
  writeQualityReport(qualityPaths.promotionReadinessReport, readiness);
  return readiness;
}

export function refreshCandidateOutputs() {
  const warningBudget = runNodeJson("scripts/ops/show-warning-budget.mjs");
  const releaseCandidate = runNodeJson("scripts/ops/build-release-candidate.mjs");
  const readiness = refreshPromotionReadiness();
  return {
    action: "refresh_candidate_outputs",
    status: "ok",
    warning_budget_status: warningBudget.status,
    release_candidate_status: releaseCandidate.status,
    readiness_release_candidate_decision: readiness.release_candidate?.decision || null
  };
}

export function refreshTaxonomyOutputs() {
  buildData3Reports();
  return {
    action: "refresh_taxonomy_reports",
    status: "ok"
  };
}

export function refreshQualityOutputs() {
  const metadata = rebuildMetadataQualityReports();
  const qualityDrift = runNodeJson("scripts/ops/show-quality-drift.mjs");
  const warningBudget = runNodeJson("scripts/ops/show-warning-budget.mjs");
  const readiness = refreshPromotionReadiness();
  return {
    action: "refresh_quality_reports",
    status: "ok",
    metadata,
    quality_drift_status: qualityDrift.status,
    warning_budget_status: warningBudget.status,
    readiness_release_candidate_decision: readiness.release_candidate?.decision || null
  };
}

export function refreshObservabilityOutput() {
  captureOpsEvent("override_applied", { stage: "ops5_refresh" });
  refreshObservabilityReports();
  return {
    action: "refresh_observability",
    status: "ok"
  };
}

export function updateNormalizedRecord(filePath, nextRecord) {
  writeJson(filePath, nextRecord);
}

export function issueAffectsReleaseCandidate(issueId) {
  const budgets = readJson(qualityPaths.warningBudgets, { issue_budgets: {} });
  return budgets.issue_budgets?.[issueId]?.release_candidate_allowed === true;
}

export function issueIdsForPublication(publicationId) {
  return (readIssuesRegistry().items || [])
    .filter((item) => item.publication_id === publicationId)
    .map((item) => item.issue_id);
}

export function rebuildTaxonomyForIssue(publicationId, issueLabel) {
  const context = createTaxonomyContext();
  const records = listNormalizedIssueRecords(publicationId, issueLabel);
  for (const item of records) {
    updateNormalizedRecord(item.filePath, normalizeTaxonomyRecord(item.record, context));
  }
  return {
    issue_id: `${publicationId}__${issueLabel}`,
    updated_records: records.length
  };
}

export function listIssueArticles(publicationId, issueLabel) {
  const overrideFile = loadEditorialOverrides(publicationId, issueLabel);
  const overrideMap = new Map((overrideFile.articles || []).map((item) => [item.article_id, item]));
  return listNormalizedIssueRecords(publicationId, issueLabel).map(({ record }) => ({
    article_id: record.article_id,
    title: record.title || "",
    section_label: record.section_label || "",
    author: record.author || "",
    canonical_url: record.canonical_url || null,
    featured: record.featured === true,
    override: overrideMap.get(record.article_id) || null
  }));
}

export function publicationMapPath(publicationId) {
  return path.join(taxonomyPaths.publicationMapsRoot, `${String(publicationId || "").replace(/-/g, "_")}.json`);
}

export function readPublicationMap(publicationId) {
  return readJson(publicationMapPath(publicationId), {
    version: "stage-data3-v1",
    publication_key: publicationId,
    mappings: []
  });
}

export function writePublicationMap(publicationId, value) {
  writeJson(publicationMapPath(publicationId), value);
}

export function ensureCanonicalSection(sectionKey, sectionLabel, discoveryBucketKey) {
  const canonical = readJson(taxonomyPaths.canonicalSections, { version: "stage-data3-v1", sections: [] });
  const sections = [...(canonical.sections || [])];
  const existingIndex = sections.findIndex((item) => item.key === sectionKey);
  const next = {
    key: sectionKey,
    label: sectionLabel || sectionKey,
    discovery_bucket: discoveryBucketKey
  };
  if (existingIndex >= 0) sections[existingIndex] = { ...sections[existingIndex], ...next };
  else sections.push(next);
  canonical.sections = sections.sort((left, right) => left.key.localeCompare(right.key));
  writeJson(taxonomyPaths.canonicalSections, canonical);
}

export function ensureDiscoveryBucket(bucketKey, bucketLabel) {
  const bucketsFile = readJson(taxonomyPaths.discoveryBuckets, { version: "stage-data3-v1", buckets: [] });
  const buckets = [...(bucketsFile.buckets || [])];
  const existingIndex = buckets.findIndex((item) => item.key === bucketKey);
  const next = {
    key: bucketKey,
    label: bucketLabel || bucketKey
  };
  if (existingIndex >= 0) buckets[existingIndex] = { ...buckets[existingIndex], ...next };
  else buckets.push(next);
  bucketsFile.buckets = buckets.sort((left, right) => left.key.localeCompare(right.key));
  writeJson(taxonomyPaths.discoveryBuckets, bucketsFile);
}
