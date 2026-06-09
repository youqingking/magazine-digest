import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  pipelinePaths,
  readJson
} from "../import/lib/content-pipeline.mjs";
import { importContentBatch } from "../import/import-content-batch.mjs";
import { importContentPack } from "../import/import-content-pack.mjs";
import { importGenericSplitRelease } from "../import/import-generic-split-release.mjs";
import { resolvePublicationDataDir } from "../import/lib/taxonomy-normalizer.mjs";
import { ensureOpsDirs, findInboxZips, opsPaths, parseArgs, archivePack, writeJson, buildOperatorCatalog } from "./lib/ops-lib.mjs";

function normalizeRouteHint(value) {
  if (!value || value === true) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return null;
  }
  if (["content_batch", "single_issue_batch", "batch", "single"].includes(normalized)) {
    return "content_batch";
  }
  if (["content_pack", "multi_release_pack", "pack", "multi"].includes(normalized)) {
    return "content_pack";
  }
  if (["generic_split_release", "generic_single_release", "generic", "science_like"].includes(normalized)) {
    return "generic_split_release";
  }
  throw new Error(`OPS1_UNSUPPORTED_ROUTE_HINT:${value}`);
}

function listZipEntries(sourcePath) {
  const nodeScript = [
    "import fs from 'node:fs';",
    "import process from 'node:process';",
    "import { execFileSync } from 'node:child_process';",
    "const zipPath = process.env.OPS1_ZIP_PATH;",
    "const attempts = [];",
    "if (process.platform === 'win32') {",
    "  attempts.push(() => execFileSync('powershell', ['-NoProfile', '-Command', \"Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [IO.Compression.ZipFile]::OpenRead($env:OPS1_ZIP_PATH); $zip.Entries | ForEach-Object { $_.FullName }; $zip.Dispose()\"], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, env: process.env }));",
    "}",
    "attempts.push(() => execFileSync('python3', ['-c', \"import os, zipfile; p=os.environ['OPS1_ZIP_PATH']; z=zipfile.ZipFile(p); print('\\\\n'.join(z.namelist())); z.close()\"], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, env: process.env }));",
    "attempts.push(() => execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, env: process.env }));",
    "for (const run of attempts) {",
    "  try {",
    "    const output = run();",
    "    if (String(output || '').trim()) {",
    "      process.stdout.write(String(output));",
    "      process.exit(0);",
    "    }",
    "  } catch (error) {}",
    "}",
    "process.exit(1);"
  ].join("");
  try {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        nodeScript
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 32 * 1024 * 1024,
        env: {
          ...process.env,
          OPS1_ZIP_PATH: sourcePath
        }
      }
    );
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeZipEntry(entry) {
  return String(entry || "")
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .trim();
}

function findPairedAudienceRoots(entries) {
  const roots = new Map();
  for (const rawEntry of entries || []) {
    const entry = normalizeZipEntry(rawEntry);
    if (!entry) {
      continue;
    }
    const segments = entry.split("/").filter(Boolean);
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index].toLowerCase();
      if (segment !== "adult" && segment !== "youth") {
        continue;
      }
      const root = segments.slice(0, index).join("/");
      const audiences = roots.get(root) || new Set();
      audiences.add(segment);
      roots.set(root, audiences);
      break;
    }
  }
  return Array.from(roots.entries())
    .filter(([, audiences]) => audiences.has("adult") && audiences.has("youth"))
    .map(([root]) => root);
}

export function detectRouteFromEntries(entries, routeHint = null, sourceName = "upload.zip") {
  const explicitRoute = normalizeRouteHint(routeHint);
  if (explicitRoute) {
    return explicitRoute;
  }
  const name = path.basename(sourceName).toLowerCase();
  if (name.includes("three-release")) {
    return "content_pack";
  }
  if (name.includes("reader") && name.includes("digest")) {
    return "content_batch";
  }
  const pairedAudienceRoots = findPairedAudienceRoots(entries);
  if (pairedAudienceRoots.length === 1) {
    return "generic_split_release";
  }
  if (pairedAudienceRoots.length > 1) {
    return "content_pack";
  }
  const normalizedEntries = entries.map((entry) => normalizeZipEntry(entry)).filter(Boolean);
  const hasGenericSplitRelease =
    normalizedEntries.some((entry) => /^public_release\/adult\//i.test(entry)) &&
    normalizedEntries.some((entry) => /^public_release\/youth\//i.test(entry));
  if (hasGenericSplitRelease) {
    return "generic_split_release";
  }
  const hasReleaseDirectory = normalizedEntries.some((entry) => /(^|\/)[^/]+-release\//i.test(entry));
  const hasAudienceMarkdown = normalizedEntries.some((entry) => /_adult\.md$/i.test(entry) || /_youth\.md$/i.test(entry));
  const topLevelEntries = new Set(normalizedEntries.map((entry) => entry.split("/")[0]).filter(Boolean));
  if (hasReleaseDirectory || topLevelEntries.size > 1) {
    return "content_pack";
  }
  if (hasAudienceMarkdown || normalizedEntries.some((entry) => entry.toLowerCase().endsWith(".md"))) {
    return "content_batch";
  }
  throw new Error(`OPS1_UNSUPPORTED_PACK:${path.basename(sourceName)}`);
}

function detectRoute(sourcePath, routeHint = null) {
  return detectRouteFromEntries(listZipEntries(sourcePath), routeHint, sourcePath);
}

function buildIssueId(publicationId, issueLabel) {
  return publicationId && issueLabel ? `${publicationId}__${issueLabel}` : null;
}

function buildIntakeError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function copyPathIfExists(sourcePath, targetPath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return false;
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
  return true;
}

function removePathIfExists(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return;
  }
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function loadReplacementContext(publicationId, issueLabel) {
  const issueId = buildIssueId(publicationId, issueLabel);
  const issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
  const publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  const issueRecord = (issuesRegistry.items || []).find((item) => item.issue_id === issueId) || null;
  const issueRoot = path.join(resolvePublicationDataDir(publicationId), issueLabel);
  const scenarioRecords = (scenarioRegistry.items || []).filter((item) =>
    (item.included_issues || []).some((entry) => entry.publication_id === publicationId && entry.issue_label === issueLabel)
  );

  return {
    publicationId,
    issueLabel,
    issueId,
    issueRecord,
    issueRoot,
    scenarioRecords,
    exists: Boolean(issueRecord || fs.existsSync(issueRoot))
  };
}

function createReplacementBackup(context, sourcePack) {
  const replacementRoot = path.join(
    opsPaths.intakeReplacements,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${context.issueId}`
  );
  const registryRoot = path.join(replacementRoot, "registries");
  const issueBackupRoot = path.join(replacementRoot, "issue-root");
  const scenariosRoot = path.join(replacementRoot, "scenario-bundles");

  fs.mkdirSync(registryRoot, { recursive: true });
  fs.mkdirSync(scenariosRoot, { recursive: true });

  copyPathIfExists(pipelinePaths.publicationsRegistry, path.join(registryRoot, "publications.json"));
  copyPathIfExists(pipelinePaths.issuesRegistry, path.join(registryRoot, "issues.json"));
  copyPathIfExists(pipelinePaths.runtimeScenarioIndex, path.join(registryRoot, "scenario-index.json"));

  const issueRootExisted = copyPathIfExists(context.issueRoot, issueBackupRoot);
  const scenarioBackups = context.scenarioRecords.map((record) => {
    const bundleRelativePath = record.bundle_path || "";
    const bundlePath = path.join(pipelinePaths.repoRoot, bundleRelativePath);
    const backupPath = path.join(scenariosRoot, path.basename(bundleRelativePath || `${record.scenario_id}.bundle.json`));
    const existed = copyPathIfExists(bundlePath, backupPath);
    return {
      scenario_id: record.scenario_id,
      bundle_relative_path: bundleRelativePath,
      existed,
      backup_path: existed ? backupPath : null
    };
  });

  const manifest = {
    generated_at: new Date().toISOString(),
    action: "replace_existing_issue_backup",
    source_pack: sourcePack,
    publication_id: context.publicationId,
    issue_label: context.issueLabel,
    issue_id: context.issueId,
    issue_root_existed: issueRootExisted,
    scenario_records: context.scenarioRecords.map((record) => ({
      scenario_id: record.scenario_id,
      bundle_path: record.bundle_path || null
    })),
    issue_root: context.issueRoot
  };
  writeJson(path.join(replacementRoot, "replacement-backup.json"), manifest);

  return {
    replacementRoot,
    issueRootExisted,
    scenarioBackups,
    manifest
  };
}

function restoreReplacementBackup(context, backup) {
  copyPathIfExists(path.join(backup.replacementRoot, "registries", "publications.json"), pipelinePaths.publicationsRegistry);
  copyPathIfExists(path.join(backup.replacementRoot, "registries", "issues.json"), pipelinePaths.issuesRegistry);
  copyPathIfExists(path.join(backup.replacementRoot, "registries", "scenario-index.json"), pipelinePaths.runtimeScenarioIndex);

  if (backup.issueRootExisted) {
    removePathIfExists(context.issueRoot);
    copyPathIfExists(path.join(backup.replacementRoot, "issue-root"), context.issueRoot);
  } else {
    removePathIfExists(context.issueRoot);
  }

  backup.scenarioBackups.forEach((item) => {
    if (!item.bundle_relative_path) {
      return;
    }
    const bundlePath = path.join(pipelinePaths.repoRoot, item.bundle_relative_path);
    if (item.existed && item.backup_path) {
      copyPathIfExists(item.backup_path, bundlePath);
    } else {
      removePathIfExists(bundlePath);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    ensureOpsDirs();

    const sourcePath = args.zip
      ? (path.isAbsolute(args.zip) ? args.zip : path.join(process.cwd(), args.zip))
      : findInboxZips()[0];

    if (!sourcePath) {
      throw new Error("OPS1_INBOX_EMPTY");
    }

    const route = detectRoute(sourcePath, args["route-hint"]);
    const replaceExisting = Boolean(args["replace-existing"]);
    const publicationId = args["publication-id"] || null;
    const issueLabel = args["issue-label"] || null;

    if (replaceExisting && route === "content_pack") {
      throw buildIntakeError(
        "OPS5_REPLACE_MULTI_RELEASE_UNSUPPORTED",
        "当前替代模式只支持单刊/单期重传，不支持 multi_release_pack 批量替代。",
        { route, source_pack: path.basename(sourcePath) }
      );
    }

    if (replaceExisting && (!publicationId || !issueLabel)) {
      throw buildIntakeError(
        "OPS5_REPLACE_TARGET_REQUIRED",
        "替代现有期次时必须显式填写 publication_id 和 issue_label，系统不会盲替代。",
        { route, source_pack: path.basename(sourcePath) }
      );
    }

    const replacementContext = publicationId && issueLabel
      ? loadReplacementContext(publicationId, issueLabel)
      : null;

    if (replacementContext?.exists && !replaceExisting) {
      throw buildIntakeError(
        "OPS5_INTAKE_TARGET_EXISTS",
        `已存在 ${replacementContext.issueId}。如要修订旧上传，请勾选“替代现有期次”后重传，系统会先做备份再替换。`,
        {
          route,
          source_pack: path.basename(sourcePath),
          target_issue_id: replacementContext.issueId,
          target_exists: true,
          recommended_action: "replace_existing"
        }
      );
    }

    if (replaceExisting && !replacementContext?.exists) {
      throw buildIntakeError(
        "OPS5_REPLACE_TARGET_NOT_FOUND",
        `未找到 ${buildIssueId(publicationId, issueLabel)}，不能执行替代。请先确认 publication_id / issue_label 是否正确。`,
        {
          route,
          source_pack: path.basename(sourcePath),
          target_issue_id: buildIssueId(publicationId, issueLabel),
          target_exists: false
        }
      );
    }

    const replacementBackup = replaceExisting && replacementContext?.exists
      ? createReplacementBackup(replacementContext, path.basename(sourcePath))
      : null;
    let result;
    try {
      if (route === "content_pack") {
        result = await importContentPack({
          zip: sourcePath,
          freeQuotaLimit: Number(args["free-quota-limit"] || 8)
        });
      } else if (route === "generic_split_release") {
        result = await importGenericSplitRelease({
          zip: sourcePath,
          freeQuotaLimit: Number(args["free-quota-limit"] || 8),
          issueLabel,
          publicationId,
          publicationDisplayName: args["publication-display-name"] || null,
          parserProfile: args["parser-profile"] || null,
          locale: args.locale || null,
          notes: args.notes || null
        });
      } else {
        result = await importContentBatch({
          zip: sourcePath,
          freeQuotaLimit: Number(args["free-quota-limit"] || 8)
        });
      }
    } catch (error) {
      if (replacementBackup && replacementContext) {
        restoreReplacementBackup(replacementContext, replacementBackup);
        error.replacement_restore = {
          status: "restored",
          replacement_root: replacementBackup.replacementRoot,
          target_issue_id: replacementContext.issueId
        };
      }
      throw error;
    }

    const generatedIssues = route === "content_pack"
      ? result.registryReport.added_issues
      : route === "generic_split_release"
        ? [result.issueRecord.issue_id]
        : result.importResults.map((item) => item.issueRecord.issue_id);

    if (replaceExisting && replacementContext && !generatedIssues.includes(replacementContext.issueId)) {
      restoreReplacementBackup(replacementContext, replacementBackup);
      throw buildIntakeError(
        "OPS5_REPLACE_TARGET_MISMATCH",
        `替代导入已回滚：实际生成的 issue 与目标 ${replacementContext.issueId} 不一致。`,
        {
          route,
          source_pack: path.basename(sourcePath),
          target_issue_id: replacementContext.issueId,
          generated_issues: generatedIssues,
          replacement_restore: {
            status: "restored",
            replacement_root: replacementBackup?.replacementRoot || null
          }
        }
      );
    }

    let archiveResult = null;
    if (args["archive-source"]) {
      archiveResult = archivePack(sourcePath);
      if (sourcePath.startsWith(opsPaths.intakeInbox) && fs.existsSync(sourcePath)) {
        fs.rmSync(sourcePath, { force: true });
      }
    }

    const intakeManifest = {
      imported_at: new Date().toISOString(),
      source_pack: path.basename(sourcePath),
      source_path: sourcePath,
      parser_routing: route,
      warnings_summary:
        route === "content_pack"
          ? result.packReport.releases.map((item) => ({
              publication_id: item.publication_id,
              warning_count: (item.warnings || []).length + (item.article_warnings || []).length
            }))
          : route === "generic_split_release"
            ? [{
                publication_id: result.publicationRecord.id,
                warning_count: result.parsed.records.reduce((sum, record) => sum + (record.import_warnings || []).length, 0)
              }]
            : result.importResults.map((item) => ({
                publication_id: item.publicationRecord.id,
                warning_count: item.issueRecord.import_warnings_count
              })),
      generated_issues: generatedIssues,
      generated_scenarios:
        route === "content_pack"
          ? result.registryReport.added_scenarios
          : route === "generic_split_release"
            ? [result.scenarioRecord.scenario_id]
            : result.importResults.map((item) => item.scenarioRecord.scenario_id),
      archive: archiveResult,
      replacement: replaceExisting && replacementContext ? {
        mode: "replace_existing_issue",
        target_issue_id: replacementContext.issueId,
        backup_root: replacementBackup?.replacementRoot || null,
        restored_on_failure: false
      } : null
    };

    const manifestPath = path.join(opsPaths.intakeManifests, `${new Date().toISOString().replace(/[:.]/g, "-")}-${path.basename(sourcePath)}.json`);
    writeJson(manifestPath, intakeManifest);
    buildOperatorCatalog();

    console.log(JSON.stringify({
      status: "ok",
      route,
      source_pack: path.basename(sourcePath),
      manifest_path: manifestPath,
      generated_issues: intakeManifest.generated_issues,
      generated_scenarios: intakeManifest.generated_scenarios,
      archive: archiveResult,
      replacement: intakeManifest.replacement
    }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      status: error.report ? "blocked" : "error",
      error_code: error.code || null,
      message: error.user_message || error.message,
      route: error.report?.route || null,
      source_pack: error.report?.source_pack || null,
      validation_report: error.report || null,
      target_issue_id: error.target_issue_id || null,
      target_exists: error.target_exists ?? null,
      recommended_action: error.recommended_action || null,
      generated_issues: error.generated_issues || null,
      replacement_restore: error.replacement_restore || null
    }, null, 2));
    process.exit(1);
  }
}
