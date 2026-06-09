import path from "node:path";

import { pipelinePaths, readJson } from "./content-pipeline.mjs";

export function getOverrideFilePath(publicationId, issueLabel) {
  return path.join(pipelinePaths.overridesRoot, publicationId, issueLabel, "metadata-overrides.json");
}

export function loadEditorialOverrides(publicationId, issueLabel) {
  return readJson(getOverrideFilePath(publicationId, issueLabel), {
    version: "stage-data1d-v1",
    publication_id: publicationId,
    issue_label: issueLabel,
    articles: []
  });
}

export function applyEditorialOverrides(records, publicationId, issueLabel) {
  const overrideFile = loadEditorialOverrides(publicationId, issueLabel);
  const overrideMap = new Map((overrideFile.articles || []).map((entry) => [entry.article_id, entry]));
  const overrideAudit = [];

  const nextRecords = records.map((record) => {
    const override = overrideMap.get(record.article_id);
    if (!override) {
      return {
        ...record,
        effective_warnings: [...(record.import_warnings || [])],
        editorial_override_applied: false
      };
    }

    const nextRecord = { ...record };
    const fieldChanges = [];
    for (const [field, nextValue] of Object.entries(override.fields || {})) {
      fieldChanges.push({
        field,
        before: nextRecord[field] ?? null,
        after: nextValue
      });
      nextRecord[field] = nextValue;
    }

    const suppression = override.display_warning_suppression || [];
    nextRecord.display_warning_suppression = suppression;
    nextRecord.effective_warnings = (nextRecord.import_warnings || []).filter((warning) => !suppression.includes(warning));
    nextRecord.editorial_override_applied = fieldChanges.length > 0 || suppression.length > 0;
    nextRecord.editorial_override_note = override.reason || "";
    nextRecord.override_source = path.relative(pipelinePaths.repoRoot, getOverrideFilePath(publicationId, issueLabel)).replace(/\\/g, "/");

    overrideAudit.push({
      article_id: record.article_id,
      reason: override.reason || "",
      field_changes: fieldChanges,
      suppressed_warnings: suppression
    });
    return nextRecord;
  });

  return {
    records: nextRecords,
    overrideAudit,
    overridesCount: overrideAudit.length
  };
}
