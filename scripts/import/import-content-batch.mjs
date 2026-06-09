import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  pipelinePaths,
  publishScenarioToCurrent,
  readJson,
  repoRoot,
  toRepoRelative,
  upsertBy,
  writeJson
} from "./lib/content-pipeline.mjs";
import {
  canHandleReadersDigestSource,
  importReadersDigestSource
} from "./parsers/readers-digest.parser.mjs";

const __filename = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = nextValue;
    index += 1;
  }
  return args;
}

function normalizePath(targetPath) {
  if (!targetPath) {
    return null;
  }
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRoot, targetPath);
}

function detectEntries({ zip, inputDir, scanDir }) {
  if (zip) {
    return [{ zipPath: normalizePath(zip) }];
  }
  if (inputDir) {
    return [{ inputDir: normalizePath(inputDir) }];
  }
  if (scanDir) {
    const resolvedScanDir = normalizePath(scanDir);
    const directoryEntries = fs.readdirSync(resolvedScanDir, { withFileTypes: true });
    return directoryEntries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".zip"))
      .map((entry) => ({ zipPath: path.join(resolvedScanDir, entry.name) }));
  }
  throw new Error("DATA1B_IMPORT_SOURCE_REQUIRED");
}

function selectImporter(entry) {
  if (canHandleReadersDigestSource(entry)) {
    return importReadersDigestSource;
  }
  throw new Error(`DATA1B_UNSUPPORTED_IMPORT_SOURCE:${path.basename(entry.zipPath || entry.inputDir || "")}`);
}

function writeRegistries(importResults, publishResult = null) {
  let publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
  let issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
  let scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());

  for (const result of importResults) {
    publicationsRegistry.items = upsertBy(publicationsRegistry.items, "id", result.publicationRecord);
    issuesRegistry.items = upsertBy(issuesRegistry.items, "issue_id", result.issueRecord);
    scenarioRegistry.items = upsertBy(scenarioRegistry.items, "scenario_id", result.scenarioRecord);
  }

  const generatedAt = new Date().toISOString();
  publicationsRegistry.generated_at = generatedAt;
  issuesRegistry.generated_at = generatedAt;
  scenarioRegistry.generated_at = generatedAt;
  if (publishResult?.scenarioId) {
    scenarioRegistry.selected_scenario_id = publishResult.scenarioId;
    scenarioRegistry.items = (scenarioRegistry.items || []).map((item) => ({
      ...item,
      is_selected_for_current: item.scenario_id === publishResult.scenarioId
    }));
  }

  writeJson(pipelinePaths.publicationsRegistry, publicationsRegistry);
  writeJson(pipelinePaths.issuesRegistry, issuesRegistry);
  writeJson(pipelinePaths.runtimeScenarioIndex, scenarioRegistry);

  return {
    publicationsRegistry,
    issuesRegistry,
    scenarioRegistry
  };
}

export async function importContentBatch(options = {}) {
  const entries = detectEntries(options);
  const importResults = [];
  const explicitScenarioId = entries.length === 1 ? options.scenarioId : null;

  try {
    for (const entry of entries) {
      const importer = selectImporter(entry);
      const issueLabelMatch = (entry.zipPath || entry.inputDir || "").match(/(\d{8})/);
      const issueLabel = options.issueLabel || issueLabelMatch?.[1] || null;
      const result = await importer({
        ...entry,
        issueLabel,
        scenarioId: explicitScenarioId,
        freeQuotaLimit: Number(options.freeQuotaLimit || 8)
      });
      importResults.push(result);
    }
  } catch (error) {
    importResults.forEach((result) => {
      if (result?.issueRoot) {
        fs.rmSync(result.issueRoot, { recursive: true, force: true });
      }
      if (result?.runtimeBundlePath) {
        fs.rmSync(result.runtimeBundlePath, { force: true });
      }
    });
    throw error;
  }

  const selectionRequested = options.publishScenario || options.selectScenario;
  const selectionTarget =
    typeof options.selectScenario === "string"
      ? options.selectScenario
      : typeof options.publishScenario === "string"
        ? options.publishScenario
        : importResults[0]?.scenarioRecord?.scenario_id || null;

  writeRegistries(importResults);
  const publishResult = selectionRequested && selectionTarget
    ? publishScenarioToCurrent({
        scenarioId: selectionTarget,
        selectionSource: options.scanDir ? "batch_import_publish" : "single_import_publish"
      })
    : null;
  const registries = writeRegistries(importResults, publishResult);

  const registryReport = {
    generated_at: new Date().toISOString(),
    imported_count: importResults.length,
    imported_sources: importResults.map((result) => ({
      scenario_id: result.scenarioRecord.scenario_id,
      publication_id: result.publicationRecord.id,
      issue_label: result.issueRecord.issue_label,
      parser_profile: result.parserProfile,
      article_count: result.issueRecord.article_count,
      warnings: result.issueRecord.import_warnings_count,
      manifest_path: result.issueRecord.manifest_path,
      bundle_path: result.scenarioRecord.bundle_path
    })),
    selected_scenario_id: publishResult?.scenarioId || registries.scenarioRegistry.selected_scenario_id || null,
    registry_snapshot: {
      publications_path: toRepoRelative(pipelinePaths.publicationsRegistry),
      issues_path: toRepoRelative(pipelinePaths.issuesRegistry),
      scenarios_path: toRepoRelative(pipelinePaths.runtimeScenarioIndex),
      selected_path: toRepoRelative(pipelinePaths.runtimeScenarioSelected)
    }
  };

  writeJson(path.join(pipelinePaths.stageData1bOutputRoot, "registry-report.json"), registryReport);

  return {
    importResults,
    publishResult,
    registryReport
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await importContentBatch(args);
    console.log(
      JSON.stringify(
        {
          status: "ok",
          imported_count: result.importResults.length,
          selected_scenario_id: result.publishResult?.scenarioId || result.registryReport.selected_scenario_id || null,
          registry_report: toRepoRelative(path.join(pipelinePaths.stageData1bOutputRoot, "registry-report.json"))
        },
        null,
        2
      )
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          status: error.report ? "blocked" : "error",
          error_code: error.code || null,
          message: error.user_message || error.message,
          validation_report: error.report || null
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}
