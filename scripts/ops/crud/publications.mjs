import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePublicationDataDir } from "../../import/lib/taxonomy-normalizer.mjs";
import {
  pipelinePaths,
  readJson,
  repoRoot,
  writeJson
} from "../../import/lib/content-pipeline.mjs";
import { qualityPaths } from "../lib/quality-budget-lib.mjs";
import {
  loadPublicationById,
  normalizePublication,
  parseCrudCli,
  publicationMapPath,
  readIssuesRegistry,
  readPublicationsRegistry,
  refreshCandidateOutputs,
  refreshObservabilityOutput,
  refreshQualityOutputs,
  refreshTaxonomyOutputs,
  withCrudMutation,
  writeIssuesRegistry,
  writePublicationsRegistry
} from "./lib.mjs";

function listPublications() {
  const registry = readPublicationsRegistry();
  return {
    status: "ok",
    publications: (registry.items || []).map(normalizePublication)
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

function publicationOverrideDir(publicationId) {
  return path.join(pipelinePaths.overridesRoot, String(publicationId || "").replace(/-/g, "_"));
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function removePathIfExists(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return false;
  }
  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
}

export function buildPublicationDeleteContext(payload = {}) {
  const publicationId = payload.publication_id;
  if (!publicationId) {
    throw new Error("OPS5_PUBLICATION_ID_REQUIRED");
  }

  const beforeRaw = loadPublicationById(publicationId);
  if (!beforeRaw) {
    throw new Error(`OPS5_PUBLICATION_NOT_FOUND:${publicationId}`);
  }

  const linkedIssues = (readIssuesRegistry().items || [])
    .filter((item) => item.publication_id === publicationId);
  const cascade = parseCrudFlag(payload.cascade, false);
  const purgeFiles = parseCrudFlag(payload.purge_files, true);

  if (linkedIssues.length > 0 && !cascade) {
    throw new Error(`OPS5_PUBLICATION_DELETE_REQUIRES_CASCADE:${publicationId}:${linkedIssues.length}`);
  }

  return {
    publicationId,
    beforeRaw,
    before: {
      ...normalizePublication(beforeRaw),
      linked_issue_ids: linkedIssues.map((item) => item.issue_id)
    },
    linkedIssues,
    cascade,
    purgeFiles
  };
}

export function deletePublicationSourceOfTruth(context) {
  const {
    publicationId,
    linkedIssues,
    cascade,
    purgeFiles
  } = context;
  const now = new Date().toISOString();
  const linkedIssueIds = linkedIssues.map((item) => item.issue_id);
  const linkedIssueIdSet = new Set(linkedIssueIds);

  const publicationsRegistry = readPublicationsRegistry();
  publicationsRegistry.generated_at = now;
  publicationsRegistry.items = (publicationsRegistry.items || [])
    .filter((item) => item.id !== publicationId);
  writePublicationsRegistry(publicationsRegistry);

  if (cascade && linkedIssueIdSet.size > 0) {
    const issuesRegistry = readIssuesRegistry();
    issuesRegistry.generated_at = now;
    issuesRegistry.items = (issuesRegistry.items || [])
      .filter((item) => item.publication_id !== publicationId);
    writeIssuesRegistry(issuesRegistry);
  }

  const warningBudgets = readJson(qualityPaths.warningBudgets, {
    version: "stage-data2-v1",
    scenario_budgets: {},
    issue_budgets: {}
  });
  let removedBudgetEntries = 0;
  for (const issueId of linkedIssueIdSet) {
    if (warningBudgets.issue_budgets?.[issueId]) {
      delete warningBudgets.issue_budgets[issueId];
      removedBudgetEntries += 1;
    }
  }
  if (removedBudgetEntries > 0) {
    writeJson(qualityPaths.warningBudgets, warningBudgets);
  }

  const acceptedWarnings = readJson(qualityPaths.acceptedWarnings, {
    version: "stage-data2-v1",
    entries: []
  });
  const acceptedEntries = acceptedWarnings.entries || [];
  const nextAcceptedEntries = acceptedEntries.filter((entry) => !linkedIssueIdSet.has(entry.issue_id));
  const removedAcceptedWarningEntries = acceptedEntries.length - nextAcceptedEntries.length;
  if (removedAcceptedWarningEntries > 0) {
    acceptedWarnings.entries = nextAcceptedEntries;
    writeJson(qualityPaths.acceptedWarnings, acceptedWarnings);
  }

  const removedPaths = [];
  if (purgeFiles) {
    const publicationDataDir = resolvePublicationDataDir(publicationId);
    const overrideDir = publicationOverrideDir(publicationId);
    const taxonomyMapFile = publicationMapPath(publicationId);

    if (removePathIfExists(publicationDataDir)) {
      removedPaths.push(toRepoRelative(publicationDataDir));
    }
    if (removePathIfExists(overrideDir)) {
      removedPaths.push(toRepoRelative(overrideDir));
    }
    if (removePathIfExists(taxonomyMapFile)) {
      removedPaths.push(toRepoRelative(taxonomyMapFile));
    }
  }

  return {
    publication_id: publicationId,
    deleted: true,
    cascade,
    purge_files: purgeFiles,
    deleted_issue_count: linkedIssueIds.length,
    deleted_issue_ids: linkedIssueIds,
    removed_warning_budget_entries: removedBudgetEntries,
    removed_accepted_warning_entries: removedAcceptedWarningEntries,
    removed_paths: removedPaths
  };
}

async function createPublication(payload) {
  const publicationId = payload.publication_id;
  if (!publicationId) throw new Error("OPS5_PUBLICATION_ID_REQUIRED");
  const before = loadPublicationById(publicationId);
  if (before) throw new Error(`OPS5_PUBLICATION_EXISTS:${publicationId}`);
  return withCrudMutation({
    entityType: "publication",
    entityId: publicationId,
    action: "create",
    before: null,
    input: payload,
    mutation: async () => {
      const registry = readPublicationsRegistry();
      const next = {
        id: publicationId,
        display_name: payload.display_name || publicationId,
        status: payload.status || "active",
        locale: payload.locale || "zh-CN",
        description: payload.description || "",
        notes: payload.notes || "",
        enabled: payload.enabled !== false,
        parser_profiles: payload.parser_profiles || []
      };
      registry.generated_at = new Date().toISOString();
      registry.items = [...(registry.items || []), next];
      writePublicationsRegistry(registry);
      return { after: normalizePublication(next) };
    },
    followUpFactory: () => [refreshObservabilityOutput()]
  });
}

async function updatePublication(payload) {
  const publicationId = payload.publication_id;
  const beforeRaw = loadPublicationById(publicationId);
  if (!beforeRaw) throw new Error(`OPS5_PUBLICATION_NOT_FOUND:${publicationId}`);
  return withCrudMutation({
    entityType: "publication",
    entityId: publicationId,
    action: "edit",
    before: normalizePublication(beforeRaw),
    input: payload,
    mutation: async () => {
      const registry = readPublicationsRegistry();
      const nextItems = (registry.items || []).map((item) => item.id === publicationId ? {
        ...item,
        display_name: payload.display_name ?? item.display_name,
        status: payload.status ?? item.status,
        locale: payload.locale ?? item.locale,
        description: payload.description ?? item.description ?? "",
        notes: payload.notes ?? item.notes ?? "",
        enabled: payload.enabled ?? item.enabled ?? true,
        parser_profiles: payload.parser_profiles ?? item.parser_profiles ?? []
      } : item);
      registry.generated_at = new Date().toISOString();
      registry.items = nextItems;
      writePublicationsRegistry(registry);
      return { after: normalizePublication(nextItems.find((item) => item.id === publicationId)) };
    },
    followUpFactory: () => [refreshObservabilityOutput()]
  });
}

async function archivePublication(payload, enabled) {
  return updatePublication({
    ...payload,
    enabled,
    status: enabled ? "active" : "archived"
  });
}

export async function deletePublication(payload) {
  const context = buildPublicationDeleteContext(payload);
  return withCrudMutation({
    entityType: "publication",
    entityId: context.publicationId,
    action: "delete",
    before: context.before,
    input: {
      ...payload,
      cascade: context.cascade,
      purge_files: context.purgeFiles
    },
    mutation: async () => ({
      after: deletePublicationSourceOfTruth(context)
    }),
    followUpFactory: () => [
      refreshCandidateOutputs(),
      refreshQualityOutputs(),
      refreshTaxonomyOutputs(),
      refreshObservabilityOutput()
    ]
  });
}

async function main() {
  const { action, payload } = parseCrudCli(process.argv.slice(2));
  let result;

  switch (action) {
    case "list":
      result = listPublications();
      break;
    case "create":
      result = await createPublication(payload);
      break;
    case "edit":
      result = await updatePublication(payload);
      break;
    case "archive":
      result = await archivePublication(payload, false);
      break;
    case "unarchive":
      result = await archivePublication(payload, true);
      break;
    case "delete":
      result = await deletePublication(payload);
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
    console.log(JSON.stringify({ status: "error", error: { code: error.code || "OPS5_PUBLICATION_ERROR", message: error.message || String(error) } }, null, 2));
  }
}
