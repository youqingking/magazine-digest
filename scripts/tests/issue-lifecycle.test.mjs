import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { resolvePublicationDataDir } from "../import/lib/taxonomy-normalizer.mjs";
import {
  pipelinePaths,
  readJson,
  repoRoot,
  writeJson
} from "../import/lib/content-pipeline.mjs";
import { ops5Paths, rebuildMetadataQualityReports } from "../ops/crud/lib.mjs";
import { qualityPaths } from "../ops/lib/quality-budget-lib.mjs";

function snapshotFiles(paths) {
  const snapshot = new Map();
  for (const filePath of paths) {
    snapshot.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
  }
  return snapshot;
}

function restoreFiles(snapshot) {
  for (const [filePath, content] of snapshot.entries()) {
    if (content === null) {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      continue;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

function runJson(relativePath, args = [], allowFailure = false) {
  try {
    const output = execFileSync(process.execPath, [path.join(repoRoot, relativePath), ...args], {
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

function ensureJsonListItem(filePath, mutator) {
  const current = readJson(filePath, {});
  writeJson(filePath, mutator(current));
}

function restoreDerivedOutputs() {
  rebuildMetadataQualityReports();
  runJson("scripts/ops/show-quality-drift.mjs");
  runJson("scripts/ops/show-warning-budget.mjs");
  runJson("scripts/ops/build-release-candidate.mjs");
  runJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  runJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data1c_three_release_mixed_preview", "--use-existing-reports"]);
  runJson("scripts/ops/refresh-observability.mjs");
}

const publicationId = "ops5_issue_test_publication";
const issueLabel = "209901";
const issueId = `${publicationId}__${issueLabel}`;
const renamedIssueLabel = "209902";
const renamedIssueId = `${publicationId}__${renamedIssueLabel}`;
const publicationDir = resolvePublicationDataDir(publicationId);
const issueRoot = path.join(publicationDir, issueLabel);
const renamedIssueRoot = path.join(publicationDir, renamedIssueLabel);
const manifestPath = path.join(issueRoot, "manifest.json");
const renamedManifestPath = path.join(renamedIssueRoot, "manifest.json");
const normalizedPath = path.join(issueRoot, "normalized", "article-001.json");
const renamedNormalizedPath = path.join(renamedIssueRoot, "normalized", "article-001.json");
const overrideRoot = path.join(pipelinePaths.overridesRoot, publicationId, issueLabel);
const renamedOverrideRoot = path.join(pipelinePaths.overridesRoot, publicationId, renamedIssueLabel);
const overrideFilePath = path.join(overrideRoot, "metadata-overrides.json");
const renamedOverrideFilePath = path.join(renamedOverrideRoot, "metadata-overrides.json");
const lifecycleReportPath = path.join(ops5Paths.root, "issue-lifecycle-report.json");

const fileSnapshot = snapshotFiles([
  pipelinePaths.publicationsRegistry,
  pipelinePaths.issuesRegistry,
  qualityPaths.warningBudgets,
  qualityPaths.acceptedWarnings,
  ops5Paths.crudAuditLog,
  ops5Paths.entityChangeReport,
  ops5Paths.rebuildTriggerReport
]);

try {
  ensureJsonListItem(pipelinePaths.publicationsRegistry, (current) => ({
    version: current.version || "stage-data1b-v1",
    generated_at: new Date().toISOString(),
    items: [
      ...(current.items || []).filter((item) => item.id !== publicationId),
      {
        id: publicationId,
        display_name: "OPS5 Issue Test Publication",
        locale: "zh-CN",
        status: "active",
        parser_profiles: ["ops5_issue_test_v1"]
      }
    ]
  }));

  const createResult = runJson("scripts/ops/crud/issues.mjs", ["--action", "create", "--payload", JSON.stringify({
    publication_id: publicationId,
    issue_label: issueLabel,
    parser_profile: "ops5_issue_test_v1",
    source_pack: "ops5-issue-test.zip",
    notes: "create without explicit issue id"
  })]);

  assert.equal(createResult.status, "ok");
  assert.equal(createResult.after.issue_id, issueId);
  assert.equal(fs.existsSync(issueRoot), true);

  fs.mkdirSync(path.join(issueRoot, "normalized"), { recursive: true });
  writeJson(manifestPath, {
    publication_id: publicationId,
    publication_key: publicationId,
    publication_name: "OPS5 Issue Test Publication",
    issue_label: issueLabel,
    source_pack: "ops5-issue-test.zip",
    parser_profile: "ops5_issue_test_v1",
    article_pair_count: 1,
    import_status: "active",
    warnings_count: 0,
    articles: []
  });
  writeJson(normalizedPath, {
    article_id: "art_ops5_issue_test_001",
    article_uid: "real_ops5_issue_test_001",
    publication_id: publicationId,
    publication_key: publicationId,
    publication_name: "OPS5 Issue Test Publication",
    publication_display_name: "OPS5 Issue Test Publication",
    issue_label: issueLabel,
    title: "OPS5 issue lifecycle test article",
    summary: "ops5 issue lifecycle summary",
    quick_30s: "adult quick",
    deep_3m: "adult deep",
    teen_quick_30s: "teen quick",
    teen_deep_3m: "teen deep",
    general_quick_30s: "general quick",
    general_deep_3m: "general deep",
    section_label: "Front",
    tags: [`issue:${issueLabel}`, `publication:${publicationId}`],
    parser_profile: "ops5_issue_test_v1",
    source_pack: "ops5-issue-test.zip",
    publish_batch_id: `batch_${publicationId}_${issueLabel}`,
    import_warnings: [],
    effective_warnings: [],
    editorial_override_applied: true,
    override_source: `data/real-content/overrides/${publicationId}/${issueLabel}/metadata-overrides.json`
  });
  fs.mkdirSync(overrideRoot, { recursive: true });
  writeJson(overrideFilePath, {
    version: "stage-data1d-v1",
    publication_id: publicationId,
    issue_label: issueLabel,
    articles: [
      {
        article_id: "art_ops5_issue_test_001",
        reason: "ops5 issue lifecycle override",
        fields: {
          section_label: "Dispatches"
        }
      }
    ]
  });

  ensureJsonListItem(qualityPaths.warningBudgets, (current) => ({
    version: current.version || "stage-data2-v1",
    scenario_budgets: current.scenario_budgets || {},
    issue_budgets: {
      ...(current.issue_budgets || {}),
      [issueId]: {
        classification: "release_ready",
        release_candidate_allowed: true,
        note: "ops5 issue lifecycle budget"
      }
    }
  }));

  ensureJsonListItem(qualityPaths.acceptedWarnings, (current) => ({
    version: current.version || "stage-data2-v1",
    entries: [
      ...(current.entries || []).filter((entry) => entry.id !== "ops5-issue-lifecycle-warning"),
      {
        id: "ops5-issue-lifecycle-warning",
        kind: "warning",
        classification: "accepted_best_effort",
        issue_id: issueId,
        warning_type: "ops5_issue_lifecycle_warning",
        applies_to_scenarios: ["data2_multi_publication_release_candidate"],
        max_count: 1,
        note: "ops5 issue lifecycle accepted warning"
      }
    ]
  }));

  const editResult = runJson("scripts/ops/crud/issues.mjs", ["--action", "edit", "--payload", JSON.stringify({
    issue_id: issueId,
    issue_label: renamedIssueLabel,
    notes: "rename issue lifecycle test"
  })]);

  assert.equal(editResult.status, "ok");
  assert.equal(editResult.after.issue_id, renamedIssueId);
  assert.equal(fs.existsSync(issueRoot), false);
  assert.equal(fs.existsSync(renamedIssueRoot), true);
  assert.equal(fs.existsSync(renamedManifestPath), true);
  assert.equal(fs.existsSync(renamedNormalizedPath), true);
  assert.equal(fs.existsSync(renamedOverrideFilePath), true);

  const issuesRegistryAfterEdit = readJson(pipelinePaths.issuesRegistry, { items: [] });
  assert.equal(issuesRegistryAfterEdit.items.some((item) => item.issue_id === issueId), false);
  assert.equal(issuesRegistryAfterEdit.items.some((item) => item.issue_id === renamedIssueId), true);

  const warningBudgetsAfterEdit = readJson(qualityPaths.warningBudgets, { issue_budgets: {} });
  assert.equal(Boolean(warningBudgetsAfterEdit.issue_budgets?.[issueId]), false);
  assert.equal(Boolean(warningBudgetsAfterEdit.issue_budgets?.[renamedIssueId]), true);

  const acceptedWarningsAfterEdit = readJson(qualityPaths.acceptedWarnings, { entries: [] });
  assert.equal(acceptedWarningsAfterEdit.entries.some((entry) => entry.issue_id === issueId), false);
  assert.equal(acceptedWarningsAfterEdit.entries.some((entry) => entry.issue_id === renamedIssueId), true);

  const renamedManifest = readJson(renamedManifestPath, null);
  assert.equal(renamedManifest.publication_id, publicationId);
  assert.equal(renamedManifest.issue_label, renamedIssueLabel);

  const renamedRecord = readJson(renamedNormalizedPath, null);
  assert.equal(renamedRecord.publication_id, publicationId);
  assert.equal(renamedRecord.issue_label, renamedIssueLabel);
  assert.deepEqual(renamedRecord.tags, [`issue:${renamedIssueLabel}`, `publication:${publicationId}`]);
  assert.equal(renamedRecord.publish_batch_id, `batch_${publicationId}_${renamedIssueLabel}`);
  assert.equal(
    renamedRecord.override_source,
    `data/real-content/overrides/${publicationId}/${renamedIssueLabel}/metadata-overrides.json`
  );

  const renamedOverride = readJson(renamedOverrideFilePath, null);
  assert.equal(renamedOverride.publication_id, publicationId);
  assert.equal(renamedOverride.issue_label, renamedIssueLabel);

  const manifestMovedOnEdit = fs.existsSync(renamedManifestPath);
  const overrideMovedOnEdit = fs.existsSync(renamedOverrideFilePath);

  const deleteResult = runJson("scripts/ops/crud/issues.mjs", ["--action", "delete", "--payload", JSON.stringify({
    issue_id: renamedIssueId,
    purge_files: true
  })]);

  assert.equal(deleteResult.status, "ok");
  assert.equal(deleteResult.after.deleted, true);
  assert.equal(fs.existsSync(renamedIssueRoot), false);
  assert.equal(fs.existsSync(renamedOverrideRoot), false);

  const issuesRegistryAfterDelete = readJson(pipelinePaths.issuesRegistry, { items: [] });
  const warningBudgetsAfterDelete = readJson(qualityPaths.warningBudgets, { issue_budgets: {} });
  const acceptedWarningsAfterDelete = readJson(qualityPaths.acceptedWarnings, { entries: [] });

  assert.equal(issuesRegistryAfterDelete.items.some((item) => item.issue_id === renamedIssueId), false);
  assert.equal(Boolean(warningBudgetsAfterDelete.issue_budgets?.[renamedIssueId]), false);
  assert.equal(acceptedWarningsAfterDelete.entries.some((entry) => entry.issue_id === renamedIssueId), false);

  const report = {
    generated_at: new Date().toISOString(),
    status: "ok",
    publication_id: publicationId,
    issue_id: issueId,
    renamed_issue_id: renamedIssueId,
    assertions: {
      create_auto_derived_issue_id: createResult.after.issue_id === issueId,
      edit_rekeys_registry: issuesRegistryAfterEdit.items.some((item) => item.issue_id === renamedIssueId),
      edit_moves_budget: Boolean(warningBudgetsAfterEdit.issue_budgets?.[renamedIssueId]),
      edit_moves_accepted_warning: acceptedWarningsAfterEdit.entries.some((entry) => entry.issue_id === renamedIssueId),
      edit_moves_manifest: manifestMovedOnEdit,
      edit_moves_override: overrideMovedOnEdit,
      edit_rewrites_normalized_record: renamedRecord.issue_label === renamedIssueLabel,
      delete_removes_registry: !issuesRegistryAfterDelete.items.some((item) => item.issue_id === renamedIssueId),
      delete_removes_budget: !warningBudgetsAfterDelete.issue_budgets?.[renamedIssueId],
      delete_removes_accepted_warning: !acceptedWarningsAfterDelete.entries.some((entry) => entry.issue_id === renamedIssueId),
      delete_removes_issue_files: !fs.existsSync(renamedIssueRoot),
      delete_removes_override_files: !fs.existsSync(renamedOverrideRoot)
    }
  };

  fs.mkdirSync(path.dirname(lifecycleReportPath), { recursive: true });
  fs.writeFileSync(lifecycleReportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  restoreFiles(fileSnapshot);
  if (fs.existsSync(publicationDir)) {
    fs.rmSync(publicationDir, { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(pipelinePaths.overridesRoot, publicationId))) {
    fs.rmSync(path.join(pipelinePaths.overridesRoot, publicationId), { recursive: true, force: true });
  }
  restoreDerivedOutputs();
}
