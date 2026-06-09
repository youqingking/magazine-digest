import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getOverrideFilePath } from "../../import/lib/editorial-overrides.mjs";
import {
  pipelinePaths,
  readJson,
  repoRoot,
  writeJson
} from "../../import/lib/content-pipeline.mjs";
import { resolvePublicationDataDir } from "../../import/lib/taxonomy-normalizer.mjs";
import { buildIssueId } from "../../../shared/utils/issue-meta.js";
import { qualityPaths } from "../lib/quality-budget-lib.mjs";
import {
  loadIssueById,
  loadPublicationById,
  normalizeIssue,
  parseCrudCli,
  readIssuesRegistry,
  rebuildTaxonomyForIssue,
  refreshCandidateOutputs,
  refreshObservabilityOutput,
  refreshQualityOutputs,
  refreshTaxonomyOutputs,
  withCrudMutation,
  writeIssuesRegistry
} from "./lib.mjs";

function listIssues(payload = {}) {
  const registry = readIssuesRegistry();
  const items = (registry.items || []).map(normalizeIssue)
    .filter((item) => !payload.publication_id || item.publication_id === payload.publication_id);
  return {
    status: "ok",
    issues: items
  };
}

function parseCrudFlag(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function issueDataDir(publicationId, issueLabel) {
  return path.join(resolvePublicationDataDir(publicationId), issueLabel);
}

function issueOverrideDir(publicationId, issueLabel) {
  return path.dirname(getOverrideFilePath(publicationId, issueLabel));
}

function issueManifestPath(publicationId, issueLabel) {
  return path.join(issueDataDir(publicationId, issueLabel), "manifest.json");
}

function removePathIfExists(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return false;
  }
  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
}

function movePathIfExists(sourcePath, targetPath, movedPaths) {
  if (!sourcePath || !targetPath || !fs.existsSync(sourcePath)) {
    return false;
  }
  if (path.resolve(sourcePath) === path.resolve(targetPath)) {
    return false;
  }
  if (fs.existsSync(targetPath)) {
    throw new Error(`OPS5_ISSUE_TARGET_EXISTS:${toRepoRelative(targetPath)}`);
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.renameSync(sourcePath, targetPath);
  movedPaths.push({
    from: toRepoRelative(sourcePath),
    to: toRepoRelative(targetPath)
  });
  return true;
}

function pruneEmptyDirectories(startDir, stopDir) {
  let currentDir = startDir;
  const resolvedStopDir = path.resolve(stopDir);
  while (currentDir && path.resolve(currentDir).startsWith(resolvedStopDir) && path.resolve(currentDir) !== resolvedStopDir) {
    if (!fs.existsSync(currentDir)) {
      currentDir = path.dirname(currentDir);
      continue;
    }
    if (fs.readdirSync(currentDir).length > 0) {
      break;
    }
    fs.rmSync(currentDir, { recursive: true, force: true });
    currentDir = path.dirname(currentDir);
  }
}

function ensurePublication(publicationId) {
  if (!publicationId) {
    throw new Error("OPS5_PUBLICATION_ID_REQUIRED");
  }
  const publication = loadPublicationById(publicationId);
  if (!publication) {
    throw new Error(`OPS5_PUBLICATION_NOT_FOUND:${publicationId}`);
  }
  return publication;
}

function resolveExistingIssueId(payload = {}) {
  return String(payload.issue_id || buildIssueId(payload.publication_id, payload.issue_label) || "").trim();
}

function resolveCreateTarget(payload = {}) {
  const publicationId = String(payload.publication_id || "").trim();
  const issueLabel = String(payload.issue_label || "").trim();
  if (!publicationId) {
    throw new Error("OPS5_PUBLICATION_ID_REQUIRED");
  }
  if (!issueLabel) {
    throw new Error("OPS5_ISSUE_LABEL_REQUIRED");
  }
  const derivedIssueId = buildIssueId(publicationId, issueLabel);
  const requestedIssueId = String(payload.issue_id || "").trim();
  if (requestedIssueId && requestedIssueId !== derivedIssueId) {
    throw new Error(`OPS5_ISSUE_ID_MISMATCH:${requestedIssueId}:${derivedIssueId}`);
  }
  return {
    publicationId,
    issueLabel,
    issueId: requestedIssueId || derivedIssueId
  };
}

function resolveUpdateTarget(beforeRaw, payload = {}) {
  const publicationId = String(payload.publication_id ?? beforeRaw.publication_id ?? "").trim();
  const issueLabel = String(payload.issue_label ?? beforeRaw.issue_label ?? "").trim();
  if (!publicationId) {
    throw new Error("OPS5_PUBLICATION_ID_REQUIRED");
  }
  if (!issueLabel) {
    throw new Error("OPS5_ISSUE_LABEL_REQUIRED");
  }
  return {
    publicationId,
    issueLabel,
    issueId: buildIssueId(publicationId, issueLabel)
  };
}

function rewriteTags(tags = [], publicationId, issueLabel) {
  const nextTags = [];
  let hasIssueTag = false;
  let hasPublicationTag = false;

  for (const tag of tags || []) {
    const value = String(tag || "").trim();
    if (!value) {
      continue;
    }
    if (value.toLowerCase().startsWith("issue:")) {
      if (!hasIssueTag) {
        nextTags.push(`issue:${issueLabel}`);
        hasIssueTag = true;
      }
      continue;
    }
    if (value.toLowerCase().startsWith("publication:")) {
      if (!hasPublicationTag) {
        nextTags.push(`publication:${publicationId}`);
        hasPublicationTag = true;
      }
      continue;
    }
    nextTags.push(value);
  }

  if (!hasIssueTag) {
    nextTags.unshift(`issue:${issueLabel}`);
  }
  if (!hasPublicationTag) {
    nextTags.push(`publication:${publicationId}`);
  }
  return Array.from(new Set(nextTags));
}

function rewritePublishBatchId(currentValue, beforeIdentity, nextIdentity) {
  const fallbackBefore = `batch_${beforeIdentity.publication_id}_${beforeIdentity.issue_label}`;
  const fallbackNext = `batch_${nextIdentity.publication_id}_${nextIdentity.issue_label}`;
  if (!currentValue || currentValue === fallbackBefore) {
    return fallbackNext;
  }
  return currentValue;
}

function writeUpdatedIssueManifest(targetPath, nextIdentity, publication, payload = {}) {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  const manifest = readJson(targetPath, null);
  if (!manifest) {
    return null;
  }
  const nextManifest = {
    ...manifest,
    publication_id: nextIdentity.publication_id,
    publication_key: nextIdentity.publication_id,
    publication_name: publication.display_name || manifest.publication_name || nextIdentity.publication_id,
    issue_label: nextIdentity.issue_label,
    parser_profile: payload.parser_profile ?? manifest.parser_profile,
    source_pack: payload.source_pack ?? manifest.source_pack ?? manifest.source_zip ?? ""
  };
  if (payload.status !== undefined) {
    nextManifest.import_status = payload.status;
  }
  writeJson(targetPath, nextManifest);
  return toRepoRelative(targetPath);
}

function rewriteIssueNormalizedRecords({
  publicationId,
  issueLabel,
  publication,
  payload,
  beforeIdentity,
  overrideFilePath
}) {
  const normalizedRoot = path.join(issueDataDir(publicationId, issueLabel), "normalized");
  if (!fs.existsSync(normalizedRoot)) {
    return 0;
  }

  const nextOverrideSource = overrideFilePath && fs.existsSync(overrideFilePath)
    ? toRepoRelative(overrideFilePath)
    : null;

  const files = fs.readdirSync(normalizedRoot)
    .filter((name) => name.endsWith(".json"))
    .sort();

  for (const fileName of files) {
    const filePath = path.join(normalizedRoot, fileName);
    const record = readJson(filePath, null);
    if (!record) {
      continue;
    }
    const nextRecord = {
      ...record,
      publication_id: publicationId,
      publication_key: publicationId,
      publication_name: publication.display_name || record.publication_name || publicationId,
      publication_display_name: publication.display_name || record.publication_display_name || publicationId,
      issue_label: issueLabel,
      tags: rewriteTags(record.tags || [], publicationId, issueLabel),
      publish_batch_id: rewritePublishBatchId(record.publish_batch_id, beforeIdentity, {
        publication_id: publicationId,
        issue_label: issueLabel
      })
    };
    if (payload.source_pack !== undefined) {
      nextRecord.source_pack = payload.source_pack;
    }
    if (payload.parser_profile !== undefined) {
      nextRecord.parser_profile = payload.parser_profile;
    }
    if (payload.status !== undefined) {
      nextRecord.import_status = payload.status;
    }
    if (nextOverrideSource || record.override_source) {
      nextRecord.override_source = nextOverrideSource;
    }
    writeJson(filePath, nextRecord);
  }

  return files.length;
}

function rewriteIssueOverrideFile(publicationId, issueLabel) {
  const overrideFilePath = getOverrideFilePath(publicationId, issueLabel);
  if (!fs.existsSync(overrideFilePath)) {
    return null;
  }
  const current = readJson(overrideFilePath, {
    version: "stage-data1d-v1",
    publication_id: publicationId,
    issue_label: issueLabel,
    articles: []
  });
  writeJson(overrideFilePath, {
    ...current,
    publication_id: publicationId,
    issue_label: issueLabel
  });
  return toRepoRelative(overrideFilePath);
}

function moveIssueBudget(beforeIssueId, nextIssueId) {
  if (!beforeIssueId || !nextIssueId || beforeIssueId === nextIssueId) {
    return false;
  }
  const budgets = readJson(qualityPaths.warningBudgets, {
    version: "stage-data2-v1",
    scenario_budgets: {},
    issue_budgets: {}
  });
  const existing = budgets.issue_budgets?.[beforeIssueId];
  if (!existing) {
    return false;
  }
  delete budgets.issue_budgets[beforeIssueId];
  budgets.issue_budgets[nextIssueId] = existing;
  writeJson(qualityPaths.warningBudgets, budgets);
  return true;
}

function rewriteAcceptedWarningsIssueId(beforeIssueId, nextIssueId) {
  if (!beforeIssueId || !nextIssueId || beforeIssueId === nextIssueId) {
    return 0;
  }
  const acceptedWarnings = readJson(qualityPaths.acceptedWarnings, {
    version: "stage-data2-v1",
    entries: []
  });
  let changed = 0;
  acceptedWarnings.entries = (acceptedWarnings.entries || []).map((entry) => {
    if (entry.issue_id !== beforeIssueId) {
      return entry;
    }
    changed += 1;
    return {
      ...entry,
      issue_id: nextIssueId
    };
  });
  if (changed > 0) {
    writeJson(qualityPaths.acceptedWarnings, acceptedWarnings);
  }
  return changed;
}

function resolveIssueManifestPath(beforeRaw, payload, nextIdentity) {
  if (payload.manifest_path !== undefined) {
    return payload.manifest_path || null;
  }
  const nextManifestRelativePath = toRepoRelative(issueManifestPath(nextIdentity.publication_id, nextIdentity.issue_label));
  const beforeManifestRelativePath = beforeRaw?.manifest_path || null;
  const fallbackBeforeManifest = toRepoRelative(issueManifestPath(beforeRaw.publication_id, beforeRaw.issue_label));
  if (!beforeManifestRelativePath || beforeManifestRelativePath === fallbackBeforeManifest) {
    return fs.existsSync(issueManifestPath(nextIdentity.publication_id, nextIdentity.issue_label))
      ? nextManifestRelativePath
      : null;
  }
  return beforeManifestRelativePath;
}

function issueFollowUps() {
  return [
    refreshCandidateOutputs(),
    refreshQualityOutputs(),
    refreshTaxonomyOutputs(),
    refreshObservabilityOutput()
  ];
}

export function buildIssueDeleteContext(payload = {}) {
  const issueId = resolveExistingIssueId(payload);
  if (!issueId) {
    throw new Error("OPS5_ISSUE_ID_REQUIRED");
  }
  const beforeRaw = loadIssueById(issueId);
  if (!beforeRaw) {
    throw new Error(`OPS5_ISSUE_NOT_FOUND:${issueId}`);
  }
  return {
    issueId,
    beforeRaw,
    before: normalizeIssue(beforeRaw),
    purgeFiles: parseCrudFlag(payload.purge_files, true)
  };
}

export function deleteIssueSourceOfTruth(context) {
  const {
    issueId,
    beforeRaw,
    purgeFiles
  } = context;
  const now = new Date().toISOString();

  const issuesRegistry = readIssuesRegistry();
  issuesRegistry.generated_at = now;
  issuesRegistry.items = (issuesRegistry.items || []).filter((item) => item.issue_id !== issueId);
  writeIssuesRegistry(issuesRegistry);

  const budgets = readJson(qualityPaths.warningBudgets, {
    version: "stage-data2-v1",
    scenario_budgets: {},
    issue_budgets: {}
  });
  const removedBudget = Boolean(budgets.issue_budgets?.[issueId]);
  if (removedBudget) {
    delete budgets.issue_budgets[issueId];
    writeJson(qualityPaths.warningBudgets, budgets);
  }

  const acceptedWarnings = readJson(qualityPaths.acceptedWarnings, {
    version: "stage-data2-v1",
    entries: []
  });
  const acceptedEntries = acceptedWarnings.entries || [];
  const nextAcceptedEntries = acceptedEntries.filter((entry) => entry.issue_id !== issueId);
  const removedAcceptedWarningEntries = acceptedEntries.length - nextAcceptedEntries.length;
  if (removedAcceptedWarningEntries > 0) {
    acceptedWarnings.entries = nextAcceptedEntries;
    writeJson(qualityPaths.acceptedWarnings, acceptedWarnings);
  }

  const removedPaths = [];
  if (purgeFiles) {
    const dataDir = issueDataDir(beforeRaw.publication_id, beforeRaw.issue_label);
    const overrideDir = issueOverrideDir(beforeRaw.publication_id, beforeRaw.issue_label);
    if (removePathIfExists(dataDir)) {
      removedPaths.push(toRepoRelative(dataDir));
      pruneEmptyDirectories(path.dirname(dataDir), pipelinePaths.dataRoot);
    }
    if (removePathIfExists(overrideDir)) {
      removedPaths.push(toRepoRelative(overrideDir));
      pruneEmptyDirectories(path.dirname(overrideDir), pipelinePaths.overridesRoot);
    }
  }

  return {
    issue_id: issueId,
    deleted: true,
    purge_files: purgeFiles,
    removed_warning_budget_entry: removedBudget,
    removed_accepted_warning_entries: removedAcceptedWarningEntries,
    removed_paths: removedPaths
  };
}

async function createIssue(payload) {
  const target = resolveCreateTarget(payload);
  ensurePublication(target.publicationId);
  if (loadIssueById(target.issueId)) {
    throw new Error(`OPS5_ISSUE_EXISTS:${target.issueId}`);
  }
  return withCrudMutation({
    entityType: "issue",
    entityId: target.issueId,
    action: "create",
    before: null,
    input: {
      ...payload,
      issue_id: target.issueId,
      publication_id: target.publicationId,
      issue_label: target.issueLabel
    },
    mutation: async () => {
      const registry = readIssuesRegistry();
      const nextManifestPath = payload.manifest_path !== undefined
        ? payload.manifest_path || null
        : fs.existsSync(issueManifestPath(target.publicationId, target.issueLabel))
          ? toRepoRelative(issueManifestPath(target.publicationId, target.issueLabel))
          : null;
      const next = {
        issue_id: target.issueId,
        publication_id: target.publicationId,
        issue_label: target.issueLabel,
        status: payload.status || "active",
        import_status: payload.status || "active",
        source_pack: payload.source_pack || "",
        parser_profile: payload.parser_profile || "",
        notes: payload.notes || "",
        enabled: payload.enabled !== false,
        manifest_path: nextManifestPath,
        warnings_count: payload.warnings_count || 0,
        article_pair_count: payload.article_count || 0
      };
      registry.generated_at = new Date().toISOString();
      registry.items = [...(registry.items || []), next];
      writeIssuesRegistry(registry);
      fs.mkdirSync(issueDataDir(target.publicationId, target.issueLabel), { recursive: true });
      return { after: normalizeIssue(next) };
    },
    followUpFactory: () => issueFollowUps()
  });
}

async function updateIssue(payload) {
  const issueId = resolveExistingIssueId(payload);
  if (!issueId) {
    throw new Error("OPS5_ISSUE_ID_REQUIRED");
  }
  const beforeRaw = loadIssueById(issueId);
  if (!beforeRaw) {
    throw new Error(`OPS5_ISSUE_NOT_FOUND:${issueId}`);
  }

  const nextIdentity = resolveUpdateTarget(beforeRaw, payload);
  const publication = ensurePublication(nextIdentity.publicationId);
  if (nextIdentity.issueId !== issueId && loadIssueById(nextIdentity.issueId)) {
    throw new Error(`OPS5_ISSUE_EXISTS:${nextIdentity.issueId}`);
  }

  return withCrudMutation({
    entityType: "issue",
    entityId: issueId,
    action: "edit",
    before: normalizeIssue(beforeRaw),
    input: {
      ...payload,
      next_issue_id: nextIdentity.issueId,
      publication_id: nextIdentity.publicationId,
      issue_label: nextIdentity.issueLabel
    },
    mutation: async () => {
      const movedPaths = [];
      const previousIdentity = {
        issue_id: beforeRaw.issue_id,
        publication_id: beforeRaw.publication_id,
        issue_label: beforeRaw.issue_label
      };
      const beforeDataDir = issueDataDir(beforeRaw.publication_id, beforeRaw.issue_label);
      const nextDataDir = issueDataDir(nextIdentity.publicationId, nextIdentity.issueLabel);
      const beforeOverrideDir = issueOverrideDir(beforeRaw.publication_id, beforeRaw.issue_label);
      const nextOverrideDir = issueOverrideDir(nextIdentity.publicationId, nextIdentity.issueLabel);

      movePathIfExists(beforeDataDir, nextDataDir, movedPaths);
      movePathIfExists(beforeOverrideDir, nextOverrideDir, movedPaths);
      pruneEmptyDirectories(path.dirname(beforeDataDir), pipelinePaths.dataRoot);
      pruneEmptyDirectories(path.dirname(beforeOverrideDir), pipelinePaths.overridesRoot);

      const registry = readIssuesRegistry();
      const nextItems = (registry.items || []).map((item) => item.issue_id === issueId ? {
        ...item,
        issue_id: nextIdentity.issueId,
        publication_id: nextIdentity.publicationId,
        issue_label: nextIdentity.issueLabel,
        status: payload.status ?? item.status ?? item.import_status,
        import_status: payload.status ?? item.import_status ?? item.status,
        source_pack: payload.source_pack ?? item.source_pack ?? item.source_zip ?? "",
        parser_profile: payload.parser_profile ?? item.parser_profile ?? "",
        notes: payload.notes ?? item.notes ?? "",
        enabled: payload.enabled ?? item.enabled ?? true,
        manifest_path: resolveIssueManifestPath(beforeRaw, payload, {
          publication_id: nextIdentity.publicationId,
          issue_label: nextIdentity.issueLabel
        })
      } : item);
      registry.generated_at = new Date().toISOString();
      registry.items = nextItems;
      writeIssuesRegistry(registry);

      moveIssueBudget(issueId, nextIdentity.issueId);
      rewriteAcceptedWarningsIssueId(issueId, nextIdentity.issueId);

      const overrideFilePath = getOverrideFilePath(nextIdentity.publicationId, nextIdentity.issueLabel);
      const manifestRelativePath = writeUpdatedIssueManifest(
        issueManifestPath(nextIdentity.publicationId, nextIdentity.issueLabel),
        {
          publication_id: nextIdentity.publicationId,
          issue_label: nextIdentity.issueLabel
        },
        publication,
        payload
      );
      const overrideRelativePath = rewriteIssueOverrideFile(nextIdentity.publicationId, nextIdentity.issueLabel);
      const rewrittenRecordCount = rewriteIssueNormalizedRecords({
        publicationId: nextIdentity.publicationId,
        issueLabel: nextIdentity.issueLabel,
        publication,
        payload,
        beforeIdentity: previousIdentity,
        overrideFilePath
      });

      rebuildTaxonomyForIssue(nextIdentity.publicationId, nextIdentity.issueLabel);

      const after = normalizeIssue(nextItems.find((item) => item.issue_id === nextIdentity.issueId));
      return {
        after: {
          ...after,
          moved_paths: movedPaths,
          manifest_path: manifestRelativePath ?? after.manifest_path ?? null,
          override_path: overrideRelativePath,
          rewritten_record_count: rewrittenRecordCount
        }
      };
    },
    followUpFactory: () => issueFollowUps()
  });
}

async function archiveIssue(payload, enabled) {
  return updateIssue({
    ...payload,
    enabled,
    status: enabled ? "active" : "archived"
  });
}

export async function deleteIssue(payload) {
  const context = buildIssueDeleteContext(payload);
  return withCrudMutation({
    entityType: "issue",
    entityId: context.issueId,
    action: "delete",
    before: context.before,
    input: {
      ...payload,
      purge_files: context.purgeFiles
    },
    mutation: async () => ({
      after: deleteIssueSourceOfTruth(context)
    }),
    followUpFactory: () => issueFollowUps()
  });
}

async function main() {
  const { action, payload } = parseCrudCli(process.argv.slice(2));
  let result;

  switch (action) {
    case "list":
      result = listIssues(payload);
      break;
    case "create":
      result = await createIssue(payload);
      break;
    case "edit":
      result = await updateIssue(payload);
      break;
    case "archive":
      result = await archiveIssue(payload, false);
      break;
    case "unarchive":
      result = await archiveIssue(payload, true);
      break;
    case "delete":
      result = await deleteIssue(payload);
      break;
    default:
      result = { status: "error", error: { code: "OPS5_UNKNOWN_ACTION", message: action } };
      break;
  }

  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await main();
  } catch (error) {
    console.log(JSON.stringify({ status: "error", error: { code: error.code || "OPS5_ISSUE_ERROR", message: error.message || String(error) } }, null, 2));
  }
}
