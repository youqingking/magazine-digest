import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { resolvePublicationDataDir } from "../import/lib/taxonomy-normalizer.mjs";
import {
  pipelinePaths,
  readJson,
  writeJson
} from "../import/lib/content-pipeline.mjs";
import { qualityPaths } from "../ops/lib/quality-budget-lib.mjs";
import { publicationMapPath } from "../ops/crud/lib.mjs";
import {
  buildPublicationDeleteContext,
  deletePublicationSourceOfTruth
} from "../ops/crud/publications.mjs";

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

function ensureJsonListItem(filePath, mutator) {
  const current = readJson(filePath, {});
  const next = mutator(current);
  writeJson(filePath, next);
}

const publicationId = "ops5_delete_test_publication";
const issueLabel = "20260324";
const issueId = `${publicationId}__${issueLabel}`;
const publicationDir = resolvePublicationDataDir(publicationId);
const overrideDir = path.join(pipelinePaths.overridesRoot, publicationId);
const taxonomyMapFile = publicationMapPath(publicationId);
const publicationsRegistryPath = pipelinePaths.publicationsRegistry;
const issuesRegistryPath = pipelinePaths.issuesRegistry;
const warningBudgetsPath = qualityPaths.warningBudgets;
const acceptedWarningsPath = qualityPaths.acceptedWarnings;

const fileSnapshot = snapshotFiles([
  publicationsRegistryPath,
  issuesRegistryPath,
  warningBudgetsPath,
  acceptedWarningsPath,
  taxonomyMapFile
]);

try {
  ensureJsonListItem(publicationsRegistryPath, (current) => ({
    version: current.version || "stage-data1b-v1",
    generated_at: new Date().toISOString(),
    items: [
      ...(current.items || []).filter((item) => item.id !== publicationId),
      {
        id: publicationId,
        display_name: "OPS5 Delete Test Publication",
        locale: "zh-CN",
        status: "active",
        parser_profiles: ["test_profile_v1"]
      }
    ]
  }));

  ensureJsonListItem(issuesRegistryPath, (current) => ({
    version: current.version || "stage-data1b-v1",
    generated_at: new Date().toISOString(),
    items: [
      ...(current.items || []).filter((item) => item.issue_id !== issueId),
      {
        issue_id: issueId,
        publication_id: publicationId,
        issue_label: issueLabel,
        source_pack: "ops5-delete-test.zip",
        parser_profile: "test_profile_v1",
        article_pair_count: 1,
        import_status: "active",
        warnings_count: 0
      }
    ]
  }));

  ensureJsonListItem(warningBudgetsPath, (current) => ({
    version: current.version || "stage-data2-v1",
    scenario_budgets: current.scenario_budgets || {},
    issue_budgets: {
      ...(current.issue_budgets || {}),
      [issueId]: {
        classification: "release_ready",
        release_candidate_allowed: true,
        note: "ops5 delete test"
      }
    }
  }));

  ensureJsonListItem(acceptedWarningsPath, (current) => ({
    version: current.version || "stage-data2-v1",
    entries: [
      ...(current.entries || []).filter((entry) => entry.id !== "ops5-delete-test-warning"),
      {
        id: "ops5-delete-test-warning",
        kind: "warning",
        classification: "accepted_best_effort",
        issue_id: issueId,
        warning_type: "ops5_delete_test_warning",
        applies_to_scenarios: ["data2_multi_publication_release_candidate"],
        max_count: 1,
        note: "ops5 delete test"
      }
    ]
  }));

  fs.mkdirSync(path.join(publicationDir, issueLabel, "normalized"), { recursive: true });
  fs.writeFileSync(
    path.join(publicationDir, issueLabel, "normalized", "article-001.json"),
    JSON.stringify({ article_id: "ops5_delete_test_article" }, null, 2)
  );
  fs.mkdirSync(path.dirname(taxonomyMapFile), { recursive: true });
  fs.writeFileSync(
    taxonomyMapFile,
    JSON.stringify({
      version: "stage-data3-v1",
      publication_key: publicationId,
      mappings: []
    }, null, 2)
  );
  fs.mkdirSync(path.join(overrideDir, issueLabel), { recursive: true });
  fs.writeFileSync(
    path.join(overrideDir, issueLabel, "metadata-overrides.json"),
    JSON.stringify({ version: "stage-data1d-v1", articles: [] }, null, 2)
  );

  let blockedError = null;
  try {
    buildPublicationDeleteContext({ publication_id: publicationId });
  } catch (error) {
    blockedError = error;
  }

  assert.ok(blockedError, "delete without cascade should be blocked");
  assert.match(blockedError.message, /OPS5_PUBLICATION_DELETE_REQUIRES_CASCADE/);

  const context = buildPublicationDeleteContext({
    publication_id: publicationId,
    cascade: true,
    purge_files: true
  });
  const result = deletePublicationSourceOfTruth(context);

  const publicationsRegistry = readJson(publicationsRegistryPath, { items: [] });
  const issuesRegistry = readJson(issuesRegistryPath, { items: [] });
  const warningBudgets = readJson(warningBudgetsPath, { issue_budgets: {} });
  const acceptedWarnings = readJson(acceptedWarningsPath, { entries: [] });

  assert.equal(publicationsRegistry.items.some((item) => item.id === publicationId), false);
  assert.equal(issuesRegistry.items.some((item) => item.issue_id === issueId), false);
  assert.equal(Boolean(warningBudgets.issue_budgets?.[issueId]), false);
  assert.equal(acceptedWarnings.entries.some((entry) => entry.issue_id === issueId), false);
  assert.equal(fs.existsSync(publicationDir), false);
  assert.equal(fs.existsSync(overrideDir), false);
  assert.equal(fs.existsSync(taxonomyMapFile), false);
  assert.equal(result.deleted, true);
  assert.equal(result.deleted_issue_count, 1);

  console.log(JSON.stringify({
    status: "ok",
    publication_id: publicationId,
    issue_id: issueId,
    assertions: {
      blocked_without_cascade: true,
      deleted_with_cascade: result.deleted,
      removed_issue_registry_entry: true,
      removed_warning_budget_entry: true,
      removed_accepted_warning_entry: true,
      removed_publication_dir: true,
      removed_override_dir: true,
      removed_taxonomy_map: true
    }
  }, null, 2));
} finally {
  restoreFiles(fileSnapshot);
  if (fs.existsSync(publicationDir)) {
    fs.rmSync(publicationDir, { recursive: true, force: true });
  }
  if (fs.existsSync(overrideDir)) {
    fs.rmSync(overrideDir, { recursive: true, force: true });
  }
  if (fs.existsSync(taxonomyMapFile)) {
    fs.rmSync(taxonomyMapFile, { force: true });
  }
}
