import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acquireStateLock, releaseStateLock } from "../lib/state-lock.mjs";
import { resolveSandboxPath } from "../lib/sandbox-paths.mjs";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  ensureDir,
  loadBaseRuntimeFixtures,
  loadStageGFallbackBundle,
  pipelinePaths,
  publishScenarioToCurrent,
  readJson,
  repoRoot,
  toRepoRelative,
  upsertBy,
  writeJson
} from "./lib/content-pipeline.mjs";
import { assertContentPackageGate, buildContentPackageGateReport } from "./lib/content-package-gate.mjs";
import { applyEditorialOverrides, getOverrideFilePath } from "./lib/editorial-overrides.mjs";
import { buildRuntimeBundleFromNormalizedRecords } from "./lib/runtime-bundle-builder.mjs";
import { extractZipToDir } from "./lib/zip-utils.mjs";
import { parseSplitAudienceRelease } from "./parsers/split-audience-release.parser.mjs";
import { barronsReleaseOverlay } from "./parsers/barrons-release.parser.mjs";
import { theAtlanticReleaseOverlay } from "./parsers/the-atlantic-release.parser.mjs";
import { theEconomistReleaseOverlay } from "./parsers/the-economist-release.parser.mjs";

const __filename = fileURLToPath(import.meta.url);

const packConfig = [
  {
    releaseDir: "Barron’s-09022026-release",
    issueLabel: "09022026",
    overlay: barronsReleaseOverlay
  },
  {
    releaseDir: "The Atlantic-012026-release",
    issueLabel: "012026",
    overlay: theAtlanticReleaseOverlay
  },
  {
    releaseDir: "TheEconomist20260314-release",
    issueLabel: "20260314",
    overlay: theEconomistReleaseOverlay
  }
];

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

function extractPack(zipPath, destinationPath) {
  ensureDir(path.dirname(destinationPath));
  extractZipToDir(zipPath, destinationPath, "DATA1C_ZIP");
}

function writeIssueManifest(issueRoot, manifest) {
  writeJson(path.join(issueRoot, "manifest.json"), manifest);
}

function buildIssueManifest({ publicationId, publicationDisplayName, issueLabel, sourcePack, sourceReleaseDir, parserProfile, records, warningsCount }) {
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
    warnings_count: warningsCount,
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

function upsertRegistries({ publications, issues, scenarios }) {
  let publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
  let issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
  let scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());

  for (const publication of publications) {
    publicationsRegistry.items = upsertBy(publicationsRegistry.items, "id", publication);
  }
  for (const issue of issues) {
    issuesRegistry.items = upsertBy(issuesRegistry.items, "issue_id", issue);
  }
  for (const scenario of scenarios) {
    scenarioRegistry.items = upsertBy(scenarioRegistry.items, "scenario_id", scenario);
  }

  const generatedAt = new Date().toISOString();
  publicationsRegistry.generated_at = generatedAt;
  issuesRegistry.generated_at = generatedAt;
  scenarioRegistry.generated_at = generatedAt;

  writeJson(pipelinePaths.publicationsRegistry, publicationsRegistry);
  writeJson(pipelinePaths.issuesRegistry, issuesRegistry);
  writeJson(pipelinePaths.runtimeScenarioIndex, scenarioRegistry);

  return { publicationsRegistry, issuesRegistry, scenarioRegistry };
}

export async function importContentPack(options = {}) {
  const zipPath = options.zip || process.env.DATA1C_ZIP_PATH || "C:/Users/dabblefly/Downloads/Three-release.zip";
  if (!fs.existsSync(zipPath)) {
    throw new Error(`DATA1C_PACK_MISSING:${zipPath}`);
  }

  const outputRoot = resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-data1c"));
  const extractedRoot = path.join(outputRoot, "extracted");
  extractPack(zipPath, extractedRoot);

  const baseRuntimeFixtures = loadStageGFallbackBundle() || await loadBaseRuntimeFixtures();
  const scenarioRecords = [];
  const publicationRecords = [];
  const issueRecords = [];
  const issueResults = [];
  const allMixedRecords = [];
  const overrideAuditEntries = [];
  const metadataQualityEntries = [];
  const createdIssueRoots = [];
  const createdScenarioBundlePaths = [];

  try {
    for (const config of packConfig) {
      const releaseRoot = path.join(extractedRoot, config.releaseDir);
      const issueRoot = path.join(pipelinePaths.dataRoot, config.overlay.publicationId, config.issueLabel);
      const parsed = parseSplitAudienceRelease({
        releaseRoot,
        publicationId: config.overlay.publicationId,
        publicationDisplayName: config.overlay.publicationDisplayName,
        issueLabel: config.issueLabel,
        parserProfile: config.overlay.parserProfile,
        sourcePack: path.basename(zipPath),
        sourceReleaseDir: config.releaseDir,
        issueDataRoot: issueRoot,
        freeQuotaLimit: Number(options.freeQuotaLimit || 8),
        overlay: config.overlay
      });
      const beforeOverrideWarnings = parsed.records.reduce((sum, record) => sum + ((record.import_warnings || []).length), 0);
      const beforeSectionCount = parsed.records.filter((record) => Boolean(record.section_label)).length;
      const overridden = applyEditorialOverrides(parsed.records, config.overlay.publicationId, config.issueLabel);
      const refinedRecords = overridden.records;
      const normalizedRoot = path.join(issueRoot, "normalized");
      refinedRecords.forEach((record, recordIndex) => {
        writeJson(path.join(normalizedRoot, `article-${String(recordIndex + 1).padStart(3, "0")}.json`), record);
      });
      overrideAuditEntries.push(...overridden.overrideAudit.map((entry) => ({
        publication_id: config.overlay.publicationId,
        issue_label: config.issueLabel,
        override_file: path.relative(repoRoot, getOverrideFilePath(config.overlay.publicationId, config.issueLabel)).replace(/\\/g, "/"),
        ...entry
      })));
      const unresolvedWarnings = refinedRecords.reduce((sum, record) => sum + ((record.effective_warnings || []).length), 0);
      const afterSectionCount = refinedRecords.filter((record) => Boolean(record.section_label)).length;
      const gateReport = buildContentPackageGateReport({
        records: refinedRecords,
        route: "content_pack",
        sourcePack: path.basename(zipPath),
        publicationId: config.overlay.publicationId,
        issueLabel: config.issueLabel,
        parserWarnings: parsed.warnings
      });
      writeJson(path.join(outputRoot, `${config.overlay.publicationId}_${config.issueLabel}.validation.json`), gateReport);
      assertContentPackageGate(gateReport, "内容包未通过导入门禁，已阻止导入");
      createdIssueRoots.push(issueRoot);

      const issueManifest = buildIssueManifest({
        publicationId: config.overlay.publicationId,
        publicationDisplayName: config.overlay.publicationDisplayName,
        issueLabel: config.issueLabel,
        sourcePack: path.basename(zipPath),
        sourceReleaseDir: config.releaseDir,
        parserProfile: config.overlay.parserProfile,
        records: refinedRecords,
        warningsCount: parsed.warnings.length + unresolvedWarnings
      });
      writeIssueManifest(issueRoot, issueManifest);

      const scenarioId = `data1c_${config.overlay.publicationId}_${config.issueLabel}`;
      const runtimeNow = new Date().toISOString();
      const bundle = buildRuntimeBundleFromNormalizedRecords({
        records: refinedRecords,
        scenarioId,
        sourceKind: "real_content_split_pack",
        canonicalSource: `data/real-content/${config.overlay.publicationId}/${config.issueLabel} + ${path.basename(zipPath)}`,
        buildLabel: `${config.overlay.publicationId}_${config.issueLabel}`,
        freeQuotaLimit: Number(options.freeQuotaLimit || 8),
        baseRuntimeFixtures,
        runtimeNow,
        description: `${config.overlay.publicationDisplayName} ${config.issueLabel} single scenario`
      });
      const scenarioBundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`);
      writeJson(scenarioBundlePath, bundle);
      createdScenarioBundlePaths.push(scenarioBundlePath);

      publicationRecords.push({
        id: config.overlay.publicationId,
        display_name: config.overlay.publicationDisplayName,
        locale: "zh-CN",
        status: "active",
        parser_profiles: [config.overlay.parserProfile]
      });
      issueRecords.push({
        issue_id: `${config.overlay.publicationId}__${config.issueLabel}`,
        publication_id: config.overlay.publicationId,
        issue_label: config.issueLabel,
        source_pack: path.basename(zipPath),
        source_release_dir: config.releaseDir,
        manifest_path: toRepoRelative(path.join(issueRoot, "manifest.json")),
        parser_profile: config.overlay.parserProfile,
        article_pair_count: parsed.records.length,
        import_status: "active",
        warnings_count: issueManifest.warnings_count
      });
      scenarioRecords.push({
        scenario_id: scenarioId,
        scenario_type: "real_content_single_release",
        source_kind: "real_content_split_pack",
        bundle_path: toRepoRelative(scenarioBundlePath),
        included_publications: [config.overlay.publicationId],
        included_issues: [{ publication_id: config.overlay.publicationId, issue_label: config.issueLabel }],
        paywall_test_rule: {
          rule_key: "global_free_quota_limit",
          free_quota_limit: Number(options.freeQuotaLimit || 8)
        },
        parser_profiles: [config.overlay.parserProfile],
        build_label: `${config.overlay.publicationId}_${config.issueLabel}`,
        enabled_at: runtimeNow,
        status: "active",
        imported_article_count: parsed.records.length,
        is_selected_for_current: false
      });

      issueResults.push({
        publication_id: config.overlay.publicationId,
        issue_label: config.issueLabel,
        release_dir: config.releaseDir,
        parser_profile: config.overlay.parserProfile,
        adult_count: parsed.adult_count,
        youth_count: parsed.youth_count,
        merged_count: parsed.merged_count,
        paired_count: parsed.paired_count,
        warnings: parsed.warnings,
        article_warnings: refinedRecords.filter((record) => (record.effective_warnings || []).length > 0 || (record.import_warnings || []).length > 0).map((record) => ({
          article_id: record.article_id,
          import_warnings: record.import_warnings,
          effective_warnings: record.effective_warnings || []
        }))
      });

      metadataQualityEntries.push({
        publication_id: config.overlay.publicationId,
        issue_label: config.issueLabel,
        article_count: refinedRecords.length,
        title_complete_rate: refinedRecords.filter((record) => Boolean(record.title)).length / refinedRecords.length,
        section_label_complete_rate_before: beforeSectionCount / refinedRecords.length,
        section_label_complete_rate_after: afterSectionCount / refinedRecords.length,
        ordinal_complete_rate: refinedRecords.filter((record) => Number.isFinite(Number(record.ordinal))).length / refinedRecords.length,
        warnings_before: beforeOverrideWarnings,
        warnings_after: unresolvedWarnings,
        overrides_count: overridden.overridesCount,
        override_file: path.relative(repoRoot, getOverrideFilePath(config.overlay.publicationId, config.issueLabel)).replace(/\\/g, "/")
      });

      allMixedRecords.push(...refinedRecords);
    }
  } catch (error) {
    createdIssueRoots.forEach((issueRoot) => fs.rmSync(issueRoot, { recursive: true, force: true }));
    createdScenarioBundlePaths.forEach((bundlePath) => fs.rmSync(bundlePath, { force: true }));
    throw error;
  }

  const mixedScenarioId = "data1c_three_release_mixed_preview";
  const mixedBundle = buildRuntimeBundleFromNormalizedRecords({
    records: allMixedRecords,
    scenarioId: mixedScenarioId,
    sourceKind: "real_content_split_pack_mixed",
    canonicalSource: `Three-release mixed preview`,
    buildLabel: "three_release_mixed_preview",
    freeQuotaLimit: Number(options.freeQuotaLimit || 8),
    baseRuntimeFixtures,
    runtimeNow: new Date().toISOString(),
    description: "Barron's + The Atlantic + The Economist mixed preview"
  });
  const mixedBundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${mixedScenarioId}.bundle.json`);
  writeJson(mixedBundlePath, mixedBundle);
  scenarioRecords.push({
    scenario_id: mixedScenarioId,
    scenario_type: "real_content_mixed_preview",
    source_kind: "real_content_split_pack_mixed",
    bundle_path: toRepoRelative(mixedBundlePath),
    included_publications: ["barrons", "the_atlantic", "the_economist"],
    included_issues: [
      { publication_id: "barrons", issue_label: "09022026" },
      { publication_id: "the_atlantic", issue_label: "012026" },
      { publication_id: "the_economist", issue_label: "20260314" }
    ],
    paywall_test_rule: {
      rule_key: "global_free_quota_limit",
      free_quota_limit: Number(options.freeQuotaLimit || 8)
    },
    parser_profiles: ["barrons_release_v1", "the_atlantic_release_v1", "the_economist_release_v1"],
    build_label: "three_release_mixed_preview",
    enabled_at: new Date().toISOString(),
    status: "active",
    imported_article_count: allMixedRecords.length,
    is_selected_for_current: false
  });

  const registries = upsertRegistries({
    publications: publicationRecords,
    issues: issueRecords,
    scenarios: scenarioRecords
  });

  const packReport = {
    generated_at: new Date().toISOString(),
    source_pack: path.basename(zipPath),
    releases: issueResults
  };
  const registryReport = {
    generated_at: new Date().toISOString(),
    added_publications: publicationRecords.map((record) => record.id),
    added_issues: issueRecords.map((record) => record.issue_id),
    added_scenarios: scenarioRecords.map((record) => record.scenario_id),
    selected_scenario_id_unchanged: readJson(pipelinePaths.runtimeScenarioSelected, { selected_scenario_id: null }).selected_scenario_id,
    publications_registry_count: registries.publicationsRegistry.items.length,
    issues_registry_count: registries.issuesRegistry.items.length,
    scenarios_registry_count: registries.scenarioRegistry.items.length
  };
  const scenarioReport = {
    generated_at: new Date().toISOString(),
    single_scenarios: scenarioRecords.filter((record) => record.scenario_id !== mixedScenarioId),
    mixed_scenario: scenarioRecords.find((record) => record.scenario_id === mixedScenarioId)
  };
  const overrideReport = {
    generated_at: new Date().toISOString(),
    entries: overrideAuditEntries
  };

  ensureDir(outputRoot);
  writeJson(path.join(outputRoot, "pack-report.json"), packReport);
  writeJson(path.join(outputRoot, "registry-report.json"), registryReport);
  writeJson(path.join(outputRoot, "scenario-report.json"), scenarioReport);
  writeJson(path.join(outputRoot, "override-report.json"), overrideReport);

  let publishResult = null;
  if (options.publishScenario) {
    publishResult = publishScenarioToCurrent({
      scenarioId: options.publishScenario,
      selectionSource: "data1c_explicit_publish"
    });
  }

  return {
    packReport,
    registryReport,
    scenarioReport,
    overrideReport,
    metadataQualityEntries,
    publishResult
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let lock = null;
  try {
    const args = parseArgs(process.argv.slice(2));
    lock = await acquireStateLock("runtime-state", {
      runId: process.env.RUN_ID || "import-content-pack",
      script: "scripts/import/import-content-pack.mjs"
    });
    const result = await importContentPack(args);
    releaseStateLock(lock);
    lock = null;
    console.log(
      JSON.stringify(
        {
          status: "ok",
          release_count: result.packReport.releases.length,
          mixed_scenario: "data1c_three_release_mixed_preview",
          published_scenario: result.publishResult?.scenarioId || null
        },
        null,
        2
      )
    );
  } catch (error) {
    releaseStateLock(lock);
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
