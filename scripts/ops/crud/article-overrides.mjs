import {
  issueAffectsReleaseCandidate,
  listIssueArticles,
  listNormalizedIssueRecords,
  loadIssueById,
  parseCrudCli,
  rebuildMetadataQualityReports,
  refreshCandidateOutputs,
  refreshObservabilityOutput,
  updateNormalizedRecord,
  withCrudMutation
} from "./lib.mjs";
import { getOverrideFilePath, loadEditorialOverrides } from "../../import/lib/editorial-overrides.mjs";
import { writeJson } from "../../import/lib/content-pipeline.mjs";

const allowedFields = ["title", "section_label", "ordinal", "author", "canonical_url", "featured", "notes"];

function buildOverrideInput(payload) {
  const fields = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields[key] = payload[key];
    }
  }
  return fields;
}

function findArticleRecord(publicationId, issueLabel, articleId) {
  return listNormalizedIssueRecords(publicationId, issueLabel).find((item) => item.record.article_id === articleId) || null;
}

function writeOverrideFile(publicationId, issueLabel, overrideFile) {
  writeJson(getOverrideFilePath(publicationId, issueLabel), overrideFile);
}

function applyOverrideToRecord(record, entry) {
  const next = { ...record };
  for (const [field, value] of Object.entries(entry.fields || {})) {
    next[field] = value;
  }
  next.display_warning_suppression = entry.display_warning_suppression || [];
  next.effective_warnings = (next.import_warnings || []).filter((warning) => !(entry.display_warning_suppression || []).includes(warning));
  next.editorial_override_applied = Object.keys(entry.fields || {}).length > 0 || (entry.display_warning_suppression || []).length > 0;
  next.editorial_override_note = entry.reason || entry.notes || "";
  next.override_source = getOverrideFilePath(record.publication_id, record.issue_label).replace(/\\/g, "/");
  return next;
}

function restoreRecordFromBase(record, baseFields) {
  const next = { ...record };
  for (const [field, value] of Object.entries(baseFields || {})) {
    next[field] = value;
  }
  next.display_warning_suppression = [];
  next.effective_warnings = [...(next.import_warnings || [])];
  next.editorial_override_applied = false;
  next.editorial_override_note = "";
  next.override_source = null;
  return next;
}

function listOverrides(payload) {
  return {
    status: "ok",
    publication_id: payload.publication_id,
    issue_label: payload.issue_label,
    articles: listIssueArticles(payload.publication_id, payload.issue_label)
  };
}

async function upsertOverride(payload) {
  const issue = loadIssueById(`${payload.publication_id}__${payload.issue_label}`);
  if (!issue) throw new Error("OPS5_ISSUE_REQUIRED_FOR_OVERRIDE");
  const articleRef = findArticleRecord(payload.publication_id, payload.issue_label, payload.article_id);
  if (!articleRef) throw new Error(`OPS5_ARTICLE_NOT_FOUND:${payload.article_id}`);
  const overrideFile = loadEditorialOverrides(payload.publication_id, payload.issue_label);
  const existing = (overrideFile.articles || []).find((item) => item.article_id === payload.article_id) || null;
  const nextFields = buildOverrideInput(payload);
  const entityId = `${payload.publication_id}__${payload.issue_label}__${payload.article_id}`;
  return withCrudMutation({
    entityType: "article_override",
    entityId,
    action: existing ? "edit" : "create",
    before: existing,
    input: payload,
    mutation: async () => {
      const baseFields = {
        ...(existing?.base_fields || {}),
        ...Object.fromEntries(Object.keys(nextFields).map((field) => [field, articleRef.record[field] ?? null]))
      };
      const nextEntry = {
        article_id: payload.article_id,
        reason: payload.reason || payload.notes || existing?.reason || "",
        notes: payload.notes || existing?.notes || "",
        fields: {
          ...(existing?.fields || {}),
          ...nextFields
        },
        display_warning_suppression: payload.display_warning_suppression ?? existing?.display_warning_suppression ?? [],
        base_fields: baseFields
      };
      overrideFile.articles = (overrideFile.articles || []).filter((item) => item.article_id !== payload.article_id);
      overrideFile.articles.push(nextEntry);
      overrideFile.articles.sort((left, right) => left.article_id.localeCompare(right.article_id));
      writeOverrideFile(payload.publication_id, payload.issue_label, overrideFile);
      updateNormalizedRecord(articleRef.filePath, applyOverrideToRecord(articleRef.record, nextEntry));
      const followUps = [rebuildMetadataQualityReports(), refreshObservabilityOutput()];
      if (issueAffectsReleaseCandidate(issue.issue_id)) {
        followUps.unshift(refreshCandidateOutputs());
      }
      return {
        after: nextEntry,
        followUps
      };
    },
    followUpFactory: (result) => result.followUps
  });
}

async function deleteOverride(payload) {
  const articleRef = findArticleRecord(payload.publication_id, payload.issue_label, payload.article_id);
  if (!articleRef) throw new Error(`OPS5_ARTICLE_NOT_FOUND:${payload.article_id}`);
  const overrideFile = loadEditorialOverrides(payload.publication_id, payload.issue_label);
  const existing = (overrideFile.articles || []).find((item) => item.article_id === payload.article_id) || null;
  if (!existing) throw new Error(`OPS5_OVERRIDE_NOT_FOUND:${payload.article_id}`);
  const issue = loadIssueById(`${payload.publication_id}__${payload.issue_label}`);
  const entityId = `${payload.publication_id}__${payload.issue_label}__${payload.article_id}`;
  return withCrudMutation({
    entityType: "article_override",
    entityId,
    action: "delete",
    before: existing,
    input: payload,
    mutation: async () => {
      overrideFile.articles = (overrideFile.articles || []).filter((item) => item.article_id !== payload.article_id);
      writeOverrideFile(payload.publication_id, payload.issue_label, overrideFile);
      if (existing.base_fields && Object.keys(existing.base_fields).length > 0) {
        updateNormalizedRecord(articleRef.filePath, restoreRecordFromBase(articleRef.record, existing.base_fields));
      }
      const followUps = [rebuildMetadataQualityReports(), refreshObservabilityOutput()];
      if (issue && issueAffectsReleaseCandidate(issue.issue_id)) {
        followUps.unshift(refreshCandidateOutputs());
      }
      return {
        after: null,
        followUps
      };
    },
    followUpFactory: (result) => result.followUps
  });
}

try {
  const { action, payload } = parseCrudCli(process.argv.slice(2));
  let result;

  switch (action) {
    case "list":
      result = listOverrides(payload);
      break;
    case "create":
    case "edit":
      result = await upsertOverride(payload);
      break;
    case "delete":
      result = await deleteOverride(payload);
      break;
    default:
      result = { status: "error", error: { code: "OPS5_UNKNOWN_ACTION", message: action } };
      break;
  }

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.log(JSON.stringify({ status: "error", error: { code: error.code || "OPS5_OVERRIDE_ERROR", message: error.message || String(error) } }, null, 2));
}
