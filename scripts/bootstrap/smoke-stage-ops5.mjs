import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { repoRoot } from "../import/lib/content-pipeline.mjs";
import { ops5Paths, rebuildMetadataQualityReports } from "../ops/crud/lib.mjs";
import { qualityPaths } from "../ops/lib/quality-budget-lib.mjs";
import { taxonomyPaths } from "../import/lib/taxonomy-normalizer.mjs";
import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";
import { ops4Paths } from "../ops/lib/operator-console-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const consolePort = 4177;
const publicationId = "ops5_demo_publication";
const issueId = "ops5_demo_publication__209901";
const renamedIssueId = "ops5_demo_publication__209902";
const taxonomyRawLabel = "OPS5 Smoke Label";
const overridePayloadBase = {
  publication_id: "the_atlantic",
  issue_label: "012026",
  article_id: "art_the_atlantic_012026_006"
};

const snapshots = new Map();

function snapshotFile(filePath) {
  snapshots.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
}

function restoreFile(filePath) {
  const content = snapshots.get(filePath);
  if (content === null) {
    fs.rmSync(filePath, { force: true, recursive: false });
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
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

function restoreState() {
  for (const filePath of Array.from(snapshots.keys()).reverse()) {
    restoreFile(filePath);
  }
  const publicationDir = path.join(repoRoot, "data", "real-content", publicationId);
  const overrideDir = path.join(repoRoot, "data", "real-content", "overrides", publicationId);
  if (fs.existsSync(publicationDir)) {
    fs.rmSync(publicationDir, { recursive: true, force: true });
  }
  if (fs.existsSync(overrideDir)) {
    fs.rmSync(overrideDir, { recursive: true, force: true });
  }
  rebuildMetadataQualityReports();
  runJson("scripts/ops/report-taxonomy-coverage.mjs");
  runJson("scripts/ops/show-quality-drift.mjs");
  runJson("scripts/ops/show-warning-budget.mjs");
  runJson("scripts/ops/build-release-candidate.mjs");
  runJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  runJson("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data1c_three_release_mixed_preview", "--use-existing-reports"]);
  runJson("scripts/ops/refresh-observability.mjs");
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(repoRoot, "scripts", "ops", "start-operator-console.mjs"), "--port", String(consolePort)], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let settled = false;
    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      if (!settled && text.includes(`http://127.0.0.1:${consolePort}`)) {
        settled = true;
        resolve(child);
      }
    });
    child.stderr.on("data", (chunk) => {
      if (!settled) {
        settled = true;
        reject(new Error(String(chunk)));
      }
    });
    child.on("exit", (code) => {
      if (!settled) {
        reject(new Error(`OPS5_SERVER_EXITED:${code}`));
      }
    });
  });
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  return {
    status: response.status,
    body: await response.json()
  };
}

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

const filesToRestore = [
  path.join(repoRoot, "data", "real-content", "publications.json"),
  path.join(repoRoot, "data", "real-content", "issues.json"),
  path.join(repoRoot, "data", "real-content", "overrides", "the_atlantic", "012026", "metadata-overrides.json"),
  path.join(repoRoot, "data", "real-content", "taxonomy", "canonical-sections.json"),
  path.join(repoRoot, "data", "real-content", "taxonomy", "discovery-buckets.json"),
  path.join(repoRoot, "data", "real-content", "taxonomy", "publication-section-maps", "the_atlantic.json"),
  qualityPaths.warningBudgets,
  path.join(repoRoot, "data", "real-content", "quality", "accepted-warnings.json"),
  path.join(repoRoot, "data", "real-content", "the_atlantic", "012026", "normalized", "article-006.json"),
  ops5Paths.crudAuditLog,
  ops5Paths.entityChangeReport,
  ops5Paths.rebuildTriggerReport,
  ops4Paths.actionsReport,
  path.join(path.dirname(ops4Paths.actionsReport), "operator-console-crud-actions-report.json")
];

let server = null;
const beforeSelected = readSelected().selected_scenario_id || null;
const beforeCurrent = readCurrentMeta().selected_scenario_id || null;

for (const filePath of filesToRestore) {
  snapshotFile(filePath);
}

try {
  report.checks.publication_create = runJson("scripts/ops/crud/publications.mjs", ["--action", "create", "--payload", JSON.stringify({
    publication_id: publicationId,
    display_name: "OPS5 Demo Publication",
    locale: "zh-CN",
    status: "active",
    notes: "ops5 smoke create"
  })]);
  report.checks.publication_edit = runJson("scripts/ops/crud/publications.mjs", ["--action", "edit", "--payload", JSON.stringify({
    publication_id: publicationId,
    display_name: "OPS5 Demo Publication Updated",
    notes: "ops5 smoke edit"
  })]);
  report.checks.publication_archive = runJson("scripts/ops/crud/publications.mjs", ["--action", "archive", "--payload", JSON.stringify({
    publication_id: publicationId
  })]);

  report.checks.issue_create = runJson("scripts/ops/crud/issues.mjs", ["--action", "create", "--payload", JSON.stringify({
    publication_id: publicationId,
    issue_label: "209901",
    parser_profile: "ops5_smoke_v1",
    source_pack: "ops5-smoke.zip",
    notes: "ops5 smoke issue create"
  })]);
  report.checks.issue_edit = runJson("scripts/ops/crud/issues.mjs", ["--action", "edit", "--payload", JSON.stringify({
    issue_id: issueId,
    issue_label: "209902",
    notes: "ops5 smoke issue edit"
  })]);
  report.checks.issue_archive = runJson("scripts/ops/crud/issues.mjs", ["--action", "archive", "--payload", JSON.stringify({
    issue_id: renamedIssueId
  })]);
  report.checks.issue_unarchive = runJson("scripts/ops/crud/issues.mjs", ["--action", "unarchive", "--payload", JSON.stringify({
    issue_id: renamedIssueId
  })]);
  report.checks.issue_delete = runJson("scripts/ops/crud/issues.mjs", ["--action", "delete", "--payload", JSON.stringify({
    issue_id: renamedIssueId,
    purge_files: true
  })]);

  report.checks.override_create = runJson("scripts/ops/crud/article-overrides.mjs", ["--action", "create", "--payload", JSON.stringify({
    ...overridePayloadBase,
    title: "OPS5 smoke override title",
    notes: "ops5 smoke create override"
  })]);
  report.checks.override_edit = runJson("scripts/ops/crud/article-overrides.mjs", ["--action", "edit", "--payload", JSON.stringify({
    ...overridePayloadBase,
    title: "OPS5 smoke override title v2",
    section_label: "Dispatches",
    notes: "ops5 smoke edit override"
  })]);
  report.checks.override_delete = runJson("scripts/ops/crud/article-overrides.mjs", ["--action", "delete", "--payload", JSON.stringify(overridePayloadBase)]);

  report.checks.taxonomy_create = runJson("scripts/ops/crud/taxonomy.mjs", ["--action", "create", "--payload", JSON.stringify({
    publication_id: "the_atlantic",
    raw_label: taxonomyRawLabel,
    canonical_section_key: "feature",
    canonical_section_label: "特写",
    discovery_bucket_key: "feature",
    discovery_bucket_label: "特写",
    mapping_kind: "publication_specific"
  })]);
  report.checks.taxonomy_edit = runJson("scripts/ops/crud/taxonomy.mjs", ["--action", "edit", "--payload", JSON.stringify({
    publication_id: "the_atlantic",
    raw_label: taxonomyRawLabel,
    canonical_section_key: "culture",
    canonical_section_label: "文化评论",
    discovery_bucket_key: "culture",
    discovery_bucket_label: "文化",
    mapping_kind: "publication_specific"
  })]);
  report.checks.taxonomy_disable = runJson("scripts/ops/crud/taxonomy.mjs", ["--action", "disable", "--payload", JSON.stringify({
    publication_id: "the_atlantic",
    raw_label: taxonomyRawLabel,
    canonical_section_key: "culture",
    canonical_section_label: "文化评论",
    discovery_bucket_key: "culture",
    discovery_bucket_label: "文化",
    mapping_kind: "publication_specific"
  })]);

  report.checks.membership_include = runJson("scripts/ops/crud/scenario-membership.mjs", ["--action", "include", "--payload", JSON.stringify({
    issue_id: "the_economist__20260314",
    classification: "ops5_smoke_rc"
  })]);
  report.checks.membership_exclude = runJson("scripts/ops/crud/scenario-membership.mjs", ["--action", "exclude", "--payload", JSON.stringify({
    issue_id: "the_economist__20260314",
    classification: "accepted_preview_only_anomaly",
    note: "restore preview only"
  })]);
  report.checks.membership_rebuild = runJson("scripts/ops/crud/scenario-membership.mjs", ["--action", "rebuild"]);

  server = await startServer();
  const baseUrl = `http://127.0.0.1:${consolePort}`;
  report.checks.console_editorial = await getJson(`${baseUrl}/api/editorial`);
  report.checks.console_ops5 = await getJson(`${baseUrl}/api/ops5`);
  report.checks.console_crud = await getJson(`${baseUrl}/api/crud-action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entity: "publications", action: "list" })
  });
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
} finally {
  if (server) server.kill();
  restoreState();
}

report.checks.restore = {
  selected_scenario_id: readSelected().selected_scenario_id || null,
  current_scenario_id: readCurrentMeta().selected_scenario_id || null,
  selected_restored: (readSelected().selected_scenario_id || null) === beforeSelected,
  current_restored: (readCurrentMeta().selected_scenario_id || null) === beforeCurrent
};
report.checks.outputs = {
  audit_log: fs.existsSync(ops5Paths.crudAuditLog),
  entity_change: fs.existsSync(ops5Paths.entityChangeReport),
  rebuild_trigger: fs.existsSync(ops5Paths.rebuildTriggerReport)
};

const pass =
  report.status === "passed" &&
  report.checks.publication_create?.status === "ok" &&
  report.checks.publication_edit?.status === "ok" &&
  report.checks.publication_archive?.status === "ok" &&
  report.checks.issue_create?.status === "ok" &&
  report.checks.issue_create?.after?.issue_id === issueId &&
  report.checks.issue_edit?.status === "ok" &&
  report.checks.issue_edit?.after?.issue_id === renamedIssueId &&
  report.checks.issue_archive?.status === "ok" &&
  report.checks.issue_unarchive?.status === "ok" &&
  report.checks.issue_delete?.status === "ok" &&
  report.checks.issue_delete?.after?.deleted === true &&
  report.checks.override_create?.status === "ok" &&
  report.checks.override_edit?.status === "ok" &&
  report.checks.override_delete?.status === "ok" &&
  report.checks.taxonomy_create?.status === "ok" &&
  report.checks.taxonomy_edit?.status === "ok" &&
  report.checks.taxonomy_disable?.status === "ok" &&
  report.checks.membership_include?.status === "ok" &&
  report.checks.membership_exclude?.status === "ok" &&
  report.checks.membership_rebuild?.status === "ok" &&
  report.checks.console_editorial?.status === 200 &&
  report.checks.console_ops5?.status === 200 &&
  report.checks.console_crud?.status === 200 &&
  report.checks.restore.selected_restored &&
  report.checks.restore.current_restored &&
  Object.values(report.checks.outputs).every(Boolean);

report.status = pass ? "passed" : "failed";
fs.mkdirSync(path.dirname(ops5Paths.smokeReport), { recursive: true });
fs.writeFileSync(ops5Paths.smokeReport, JSON.stringify(report, null, 2) + "\n", "utf8");

if (report.status !== "passed") {
  throw new Error(report.error || "OPS5_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
