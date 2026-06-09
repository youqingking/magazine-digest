import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  ensureDir,
  loadBaseRuntimeFixtures,
  loadStageGFallbackBundle,
  pipelinePaths,
  readJson,
  repoRoot,
  toRepoRelative,
  upsertBy,
  writeJson
} from "./lib/content-pipeline.mjs";
import { assertContentPackageGate, buildContentPackageGateReport } from "./lib/content-package-gate.mjs";
import { buildRuntimeBundleFromNormalizedRecords } from "./lib/runtime-bundle-builder.mjs";
import { extractZipToDir } from "./lib/zip-utils.mjs";
import { parseSplitAudienceRelease } from "./parsers/split-audience-release.parser.mjs";

const __filename = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
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

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function titleizeFromSlug(value) {
  return String(value || "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripUploadPrefix(value) {
  return String(value || "")
    .replace(/^\d{4}-\d{2}-\d{2}T\d{2}[-:_]\d{2}[-:_]\d{2}(?:[-:_]\d+)?Z-?/i, "")
    .replace(/^\d{4}_\d{2}_\d{2}t\d{2}_\d{2}_\d{2}(?:_\d+)?z_?/i, "");
}

function deriveIssueLabel(zipPath, explicitLabel = null) {
  if (explicitLabel) {
    return explicitLabel;
  }
  const basename = stripUploadPrefix(path.basename(zipPath));
  const exactDate = basename.match(/(\d{8})/);
  if (exactDate) {
    return exactDate[1];
  }
  const monthDate = basename.match(/(\d{6})/);
  if (monthDate) {
    return monthDate[1];
  }
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function derivePublicationId(zipPath, explicitId = null) {
  if (explicitId) {
    return slugify(explicitId);
  }
  const basename = stripUploadPrefix(path.basename(zipPath, path.extname(zipPath)))
    .replace(/\d{6,8}/g, "")
    .replace(/public_release/gi, "")
    .trim();
  return slugify(basename || "new_publication");
}

function deriveDisplayName(zipPath, publicationId, explicitName = null) {
  if (explicitName) {
    return explicitName.trim();
  }
  const basename = stripUploadPrefix(path.basename(zipPath, path.extname(zipPath)))
    .replace(/\d{6,8}/g, "")
    .replace(/public_release/gi, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return basename || titleizeFromSlug(publicationId);
}

function extractPack(zipPath, destinationPath) {
  ensureDir(path.dirname(destinationPath));
  extractZipToDir(zipPath, destinationPath, "OPS5_ZIP");
}

function findReleaseRoot(extractedRoot) {
  const direct = ["public_release", "release", "content_release"]
    .map((name) => path.join(extractedRoot, name))
    .find((candidate) => fs.existsSync(path.join(candidate, "adult")) && fs.existsSync(path.join(candidate, "youth")));
  if (direct) {
    return direct;
  }

  const nestedDirectories = fs.readdirSync(extractedRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(extractedRoot, entry.name));
  const nested = nestedDirectories.find((candidate) => fs.existsSync(path.join(candidate, "adult")) && fs.existsSync(path.join(candidate, "youth")));
  if (nested) {
    return nested;
  }

  if (fs.existsSync(path.join(extractedRoot, "adult")) && fs.existsSync(path.join(extractedRoot, "youth"))) {
    return extractedRoot;
  }

  throw new Error("OPS5_GENERIC_RELEASE_ROOT_NOT_FOUND");
}

function deriveSectionLabel(record, displayName) {
  const stem = String(record.source_file_stem || "").replace(/^\d+_/, "");
  const prefix = stem.split(/[_-]+/).filter(Boolean).slice(0, 3).join(" ");
  return prefix || displayName;
}

function buildRegistries({ publicationRecord, issueRecord, scenarioRecord }) {
  const publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
  const issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  const generatedAt = new Date().toISOString();

  publicationsRegistry.items = upsertBy(publicationsRegistry.items, "id", publicationRecord);
  issuesRegistry.items = upsertBy(issuesRegistry.items, "issue_id", issueRecord);
  scenarioRegistry.items = upsertBy(scenarioRegistry.items, "scenario_id", scenarioRecord);

  publicationsRegistry.generated_at = generatedAt;
  issuesRegistry.generated_at = generatedAt;
  scenarioRegistry.generated_at = generatedAt;

  writeJson(pipelinePaths.publicationsRegistry, publicationsRegistry);
  writeJson(pipelinePaths.issuesRegistry, issuesRegistry);
  writeJson(pipelinePaths.runtimeScenarioIndex, scenarioRegistry);

  return {
    publicationsRegistry,
    issuesRegistry,
    scenarioRegistry
  };
}

function buildIssueManifest({ publicationId, publicationDisplayName, issueLabel, sourcePack, sourceReleaseDir, parserProfile, records }) {
  return {
    publication_id: publicationId,
    publication_key: publicationId,
    publication_name: publicationDisplayName,
    issue_label: issueLabel,
    source_pack: sourcePack,
    source_release_dir: sourceReleaseDir,
    parser_profile: parserProfile,
    article_pair_count: records.length,
    import_status: "active",
    warnings_count: records.reduce((sum, record) => sum + (record.import_warnings || []).length, 0),
    articles: records.map((record) => ({
      article_id: record.article_id,
      ordinal: record.ordinal,
      title: record.title,
      section_label: record.section_label,
      source_adult_path: record.source_adult_path,
      source_youth_path: record.source_youth_path,
      import_warnings: record.import_warnings
    }))
  };
}

function removeEmptyParentDirs(startPath, stopPath) {
  let current = path.dirname(startPath);
  const normalizedStop = path.resolve(stopPath);
  while (current.startsWith(normalizedStop) && current !== normalizedStop) {
    if (!fs.existsSync(current)) {
      current = path.dirname(current);
      continue;
    }
    if (fs.readdirSync(current).length > 0) {
      break;
    }
    fs.rmSync(current, { recursive: true, force: true });
    current = path.dirname(current);
  }
}

export async function importGenericSplitRelease(options = {}) {
  const zipPath = options.zip && path.isAbsolute(options.zip) ? options.zip : path.resolve(repoRoot, options.zip || "");
  if (!zipPath || !fs.existsSync(zipPath)) {
    throw new Error(`OPS5_GENERIC_ZIP_MISSING:${options.zip || ""}`);
  }

  const publicationId = derivePublicationId(zipPath, options.publicationId);
  const publicationDisplayName = deriveDisplayName(zipPath, publicationId, options.publicationDisplayName);
  const issueLabel = deriveIssueLabel(zipPath, options.issueLabel);
  const parserProfile = options.parserProfile || "generic_split_release_v1";
  const sourcePack = path.basename(zipPath);
  const scenarioId = options.scenarioId || `intake_${publicationId}_${issueLabel}`;

  const outputRoot = path.join(repoRoot, "output", "stage-ops5", "generic-intake");
  const extractedRoot = path.join(outputRoot, `${publicationId}_${issueLabel}`);
  extractPack(zipPath, extractedRoot);
  const releaseRoot = findReleaseRoot(extractedRoot);
  const sourceReleaseDir = path.relative(extractedRoot, releaseRoot).replace(/\\/g, "/") || path.basename(releaseRoot);

  const baseRuntimeFixtures = loadStageGFallbackBundle() || await loadBaseRuntimeFixtures();
  const issueDataRoot = path.join(pipelinePaths.dataRoot, publicationId, issueLabel);
  const parsed = parseSplitAudienceRelease({
    releaseRoot,
    publicationId,
    publicationDisplayName,
    issueLabel,
    parserProfile,
    sourcePack,
    sourceReleaseDir,
    issueDataRoot,
    freeQuotaLimit: Number(options.freeQuotaLimit || 8),
    overlay: {
      applyRecordOverlay(record) {
        const next = { ...record };
        next.section_label = deriveSectionLabel(next, publicationDisplayName);
        return next;
      }
    }
  });
  const gateReport = buildContentPackageGateReport({
    records: parsed.records,
    route: "generic_split_release",
    sourcePack,
    publicationId,
    issueLabel,
    parserWarnings: parsed.warnings
  });
  ensureDir(outputRoot);
  writeJson(path.join(outputRoot, `${publicationId}_${issueLabel}.validation.json`), gateReport);
  try {
    assertContentPackageGate(gateReport, "内容包未通过导入门禁，已阻止导入");
  } catch (error) {
    fs.rmSync(issueDataRoot, { recursive: true, force: true });
    removeEmptyParentDirs(issueDataRoot, pipelinePaths.dataRoot);
    fs.rmSync(path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`), { force: true });
    throw error;
  }

  const runtimeNow = new Date().toISOString();
  const issueManifest = buildIssueManifest({
    publicationId,
    publicationDisplayName,
    issueLabel,
    sourcePack,
    sourceReleaseDir,
    parserProfile,
    records: parsed.records
  });
  writeJson(path.join(issueDataRoot, "manifest.json"), issueManifest);
  const bundle = buildRuntimeBundleFromNormalizedRecords({
    records: parsed.records,
    scenarioId,
    sourceKind: "generic_split_release",
    canonicalSource: `data/real-content/${publicationId}/${issueLabel} + ${sourcePack}`,
    buildLabel: `${publicationId}_${issueLabel}`,
    freeQuotaLimit: Number(options.freeQuotaLimit || 8),
    baseRuntimeFixtures,
    runtimeNow,
    description: `${publicationDisplayName} ${issueLabel} generic split-audience intake`
  });
  const scenarioBundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`);
  writeJson(scenarioBundlePath, bundle);

  const publicationRecord = {
    id: publicationId,
    display_name: publicationDisplayName,
    locale: options.locale || "zh-CN",
    status: "active",
    parser_profiles: [parserProfile],
    notes: options.notes || "generated by generic split release intake"
  };
  const issueRecord = {
    issue_id: `${publicationId}__${issueLabel}`,
    publication_id: publicationId,
    issue_label: issueLabel,
    source_pack: sourcePack,
    source_release_dir: sourceReleaseDir,
    manifest_path: toRepoRelative(path.join(issueDataRoot, "manifest.json")),
    parser_profile: parserProfile,
    article_pair_count: parsed.records.length,
    import_status: "active",
    warnings_count: issueManifest.warnings_count
  };
  const scenarioRecord = {
    scenario_id: scenarioId,
    scenario_type: "real_content_single_release",
    source_kind: "generic_split_release",
    bundle_path: toRepoRelative(scenarioBundlePath),
    included_publications: [publicationId],
    included_issues: [{ publication_id: publicationId, issue_label: issueLabel }],
    paywall_test_rule: {
      rule_key: "global_free_quota_limit",
      free_quota_limit: Number(options.freeQuotaLimit || 8)
    },
    parser_profiles: [parserProfile],
    build_label: `${publicationId}_${issueLabel}`,
    enabled_at: runtimeNow,
    status: "active",
    imported_article_count: parsed.records.length,
    is_selected_for_current: false
  };

  buildRegistries({ publicationRecord, issueRecord, scenarioRecord });
  writeJson(path.join(outputRoot, `${publicationId}_${issueLabel}.json`), {
    generated_at: runtimeNow,
    publication_id: publicationId,
    publication_display_name: publicationDisplayName,
    issue_label: issueLabel,
    scenario_id: scenarioId,
    source_pack: sourcePack,
    release_root: releaseRoot,
    warnings: parsed.warnings,
    article_count: parsed.records.length
  });

  return {
    publicationRecord,
    issueRecord,
    scenarioRecord,
    parsed,
    assumed_metadata: {
      publication_id: !options.publicationId,
      publication_display_name: !options.publicationDisplayName,
      issue_label: !options.issueLabel
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await importGenericSplitRelease(args);
    console.log(JSON.stringify({
      status: "ok",
      publication_id: result.publicationRecord.id,
      issue_id: result.issueRecord.issue_id,
      scenario_id: result.scenarioRecord.scenario_id,
      assumed_metadata: result.assumed_metadata,
      article_count: result.parsed.records.length
    }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      status: error.report ? "blocked" : "error",
      error_code: error.code || null,
      message: error.user_message || error.message,
      validation_report: error.report || null
    }, null, 2));
    process.exit(1);
  }
}
