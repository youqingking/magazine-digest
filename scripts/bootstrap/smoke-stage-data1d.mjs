import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-data1d");

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function assertCheck(checks, id, condition, details = {}) {
  checks[id] = {
    status: condition ? "passed" : "failed",
    ...details
  };
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countWarnings(records, fieldName = "effective_warnings") {
  const counts = {};
  for (const record of records) {
    for (const warning of record[fieldName] || []) {
      counts[warning] = (counts[warning] || 0) + 1;
    }
  }
  return counts;
}

function loadNormalizedRecords(publicationId, issueLabel) {
  const normalizedDir =
    publicationId === "readers_digest"
      ? path.join(repoRoot, "data", "real-content", "readers-digest", issueLabel, "normalized")
      : path.join(repoRoot, "data", "real-content", publicationId, issueLabel, "normalized");

  return fs
    .readdirSync(normalizedDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => loadJson(path.join(normalizedDir, name)));
}

function buildIssueQualityEntry({ issueId, manifest, records }) {
  const withTitle = records.filter((record) => Boolean(record.title)).length;
  const withSection = records.filter((record) => Boolean(record.section_label)).length;
  const withOrdinal = records.filter((record) => Number.isFinite(Number(record.ordinal))).length;
  const overridesCount = records.filter((record) => record.editorial_override_applied).length;
  const unresolvedWarnings = records.reduce((sum, record) => sum + ((record.effective_warnings || []).length), 0);
  return {
    issue_id: issueId,
    publication_id: manifest.publication_id,
    issue_label: manifest.issue_label,
    article_count: records.length,
    title_complete_rate: withTitle / records.length,
    section_label_complete_rate: withSection / records.length,
    ordinal_complete_rate: withOrdinal / records.length,
    overrides_count: overridesCount,
    warnings_count: records.reduce((sum, record) => sum + ((record.import_warnings || []).length), 0),
    unresolved_warnings_count: unresolvedWarnings
  };
}

async function main() {
  ensureDir(outputDir);
  const checks = {};
  let fatalError = "";

  try {
    const { importReadersDigestPilot } = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "import-readers-digest-pilot.mjs")).href);
    const { importContentPack } = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "import-content-pack.mjs")).href);
    const pipeline = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "lib", "content-pipeline.mjs")).href);
    const discoveryStore = await import(pathToFileURL(path.join(repoRoot, "mobile", "stores", "discovery.store.js")).href);

    const selectedPath = path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json");
    const scenarioIndexPath = path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "index.json");
    const currentMetaPath = path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "scenario-meta.json");

    const selectedBefore = loadJson(selectedPath);
    const baselineScenarioId = selectedBefore.selected_scenario_id || "data1a_readers_digest_12112025";

    await importReadersDigestPilot();
    const packImport = await importContentPack({
      zip: "C:/Users/dabblefly/Downloads/Three-release.zip",
      freeQuotaLimit: 8
    });

    const atlManifest = loadJson(path.join(repoRoot, "data", "real-content", "the_atlantic", "012026", "manifest.json"));
    const econManifest = loadJson(path.join(repoRoot, "data", "real-content", "the_economist", "20260314", "manifest.json"));
    const barManifest = loadJson(path.join(repoRoot, "data", "real-content", "barrons", "09022026", "manifest.json"));
    const rdManifest = loadJson(path.join(repoRoot, "data", "real-content", "readers-digest", "12112025", "manifest.json"));
    const atlNormalized = loadNormalizedRecords("the_atlantic", "012026");
    const econNormalized = loadNormalizedRecords("the_economist", "20260314");
    const barNormalized = loadNormalizedRecords("barrons", "09022026");
    const rdNormalized = loadNormalizedRecords("readers_digest", "12112025");
    const atlBundle = loadJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "data1c_the_atlantic_012026.bundle.json"));
    const econBundle = loadJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "data1c_the_economist_20260314.bundle.json"));
    const barBundle = loadJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "data1c_barrons_09022026.bundle.json"));
    const overrideReportStage1c = loadJson(path.join(repoRoot, "output", "stage-data1c", "override-report.json"));

    const atlRecords = atlBundle.discoveryCatalog.items;
    const econRecords = econBundle.discoveryCatalog.items;
    const barRecords = barBundle.discoveryCatalog.items;

    const metadataQualityReport = {
      generated_at: new Date().toISOString(),
      items: [
        buildIssueQualityEntry({ issueId: "readers_digest__12112025", manifest: rdManifest, records: rdNormalized }),
        buildIssueQualityEntry({ issueId: "barrons__09022026", manifest: barManifest, records: barNormalized }),
        buildIssueQualityEntry({ issueId: "the_atlantic__012026", manifest: atlManifest, records: atlNormalized }),
        buildIssueQualityEntry({ issueId: "the_economist__20260314", manifest: econManifest, records: econNormalized })
      ],
      improvement_summary: packImport.metadataQualityEntries
    };

    const warningReport = {
      generated_at: new Date().toISOString(),
      items: [
        {
          issue_id: "the_atlantic__012026",
          import_warning_counts: countWarnings(atlNormalized, "import_warnings"),
          unresolved_warning_counts: countWarnings(atlNormalized, "effective_warnings")
        },
        {
          issue_id: "the_economist__20260314",
          import_warning_counts: countWarnings(econNormalized, "import_warnings"),
          unresolved_warning_counts: countWarnings(econNormalized, "effective_warnings")
        },
        {
          issue_id: "barrons__09022026",
          import_warning_counts: countWarnings(barNormalized, "import_warnings"),
          unresolved_warning_counts: countWarnings(barNormalized, "effective_warnings")
        }
      ]
    };

    const overrideReport = {
      generated_at: new Date().toISOString(),
      entries: overrideReportStage1c.entries
    };

    const scenarioListBefore = loadJson(scenarioIndexPath);
    pipeline.setSelectedScenario({
      scenarioId: "data1c_three_release_mixed_preview",
      selectionSource: "stage_data1d_smoke_select"
    });
    const selectedAfterSelect = loadJson(selectedPath);

    pipeline.publishSelectedScenarioToCurrent({
      selectionSource: "stage_data1d_smoke_publish"
    });
    const currentAfterPublish = loadJson(currentMetaPath);

    const currentBundle = loadJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "runtime.bundle.json"));
    const todayNewCount = currentBundle.discoveryCatalog.items.filter((item) => item.update_type === "new_publish").length;
    const searchAllCount = currentBundle.discoveryCatalog.items.length;
    const searchBarronsCount = currentBundle.discoveryCatalog.items.filter((item) => item.publication_key === "barrons").length;
    const searchAtlanticCount = currentBundle.discoveryCatalog.items.filter((item) => item.publication_key === "the_atlantic").length;
    const searchEconomistCount = currentBundle.discoveryCatalog.items.filter((item) => item.publication_key === "the_economist").length;
    const detailQuick = currentBundle.contentDetail.responses["art_the_atlantic_012026_002|zh-CN|general|quick_30s"];
    const detailTeen = currentBundle.contentDetail.responses["art_the_economist_20260314_024|zh-CN|teen|deep_3m"];
    const quotaStatus = currentBundle.stageG.quotaStatus.response;
    const profileBenefits = currentBundle.stageG.profileBenefits.response;

    discoveryStore.resetFeedUiState();
    discoveryStore.setFeedUiState({
      activeTab: "followed",
      publicationKey: "the_atlantic",
      updateType: "new_publish",
      scrollTop: 540,
      restorePending: true
    });
    const restoreState = discoveryStore.consumeFeedRestoreState();

    pipeline.publishScenarioToCurrent({
      scenarioId: baselineScenarioId,
      selectionSource: "stage_data1d_smoke_rollback"
    });
    const selectedAfterRollback = loadJson(selectedPath);
    const currentAfterRollback = loadJson(currentMetaPath);
    const scenarioListAfter = loadJson(scenarioIndexPath);

    const publishFlowReport = {
      generated_at: new Date().toISOString(),
      selected_before: selectedBefore.selected_scenario_id,
      selected_after_select: selectedAfterSelect.selected_scenario_id,
      current_after_publish: currentAfterPublish.selected_scenario_id,
      current_after_rollback: currentAfterRollback.selected_scenario_id,
      selected_after_rollback: selectedAfterRollback.selected_scenario_id,
      scenario_list_before: scenarioListBefore.items.map((item) => ({
        scenario_id: item.scenario_id,
        status: item.status,
        is_selected_for_current: item.is_selected_for_current === true
      })),
      scenario_list_after: scenarioListAfter.items.map((item) => ({
        scenario_id: item.scenario_id,
        status: item.status,
        is_selected_for_current: item.is_selected_for_current === true,
        selected_for_current_at: item.selected_for_current_at || null
      }))
    };

    writeJson(path.join(outputDir, "metadata-quality-report.json"), metadataQualityReport);
    writeJson(path.join(outputDir, "warning-report.json"), warningReport);
    writeJson(path.join(outputDir, "override-report.json"), overrideReport);
    writeJson(path.join(outputDir, "publish-flow-report.json"), publishFlowReport);

    const atlImprovement = packImport.metadataQualityEntries.find((item) => item.publication_id === "the_atlantic");
    const econImprovement = packImport.metadataQualityEntries.find((item) => item.publication_id === "the_economist");
    const barImprovement = packImport.metadataQualityEntries.find((item) => item.publication_id === "barrons");

    assertCheck(
      checks,
      "atlantic_quality_improved",
      atlImprovement &&
        atlImprovement.warnings_after < atlImprovement.warnings_before &&
        atlImprovement.overrides_count >= 9,
      { improvement: atlImprovement }
    );
    assertCheck(
      checks,
      "economist_quality_improved",
      econImprovement &&
        econImprovement.section_label_complete_rate_after >= econImprovement.section_label_complete_rate_before &&
        econImprovement.warnings_after < 19,
      { improvement: econImprovement }
    );
    assertCheck(
      checks,
      "barrons_registry_stable",
      barImprovement &&
        barManifest.publication_name === "Barron's" &&
        barManifest.issue_label === "09022026" &&
        barImprovement.warnings_after === 0,
      { improvement: barImprovement }
    );
    assertCheck(
      checks,
      "override_report_generated",
      overrideReport.entries.length >= 10,
      { override_count: overrideReport.entries.length }
    );
    assertCheck(
      checks,
      "publish_controls_work",
      selectedAfterSelect.selected_scenario_id === "data1c_three_release_mixed_preview" &&
        currentAfterPublish.selected_scenario_id === "data1c_three_release_mixed_preview" &&
        currentAfterRollback.selected_scenario_id === baselineScenarioId,
      {
        selected_after_select: selectedAfterSelect.selected_scenario_id,
        current_after_publish: currentAfterPublish.selected_scenario_id,
        current_after_rollback: currentAfterRollback.selected_scenario_id
      }
    );
    assertCheck(
      checks,
      "mixed_runtime_paths_not_regressed",
      todayNewCount === 78 &&
        searchAllCount === 78 &&
        searchBarronsCount === 17 &&
        searchAtlanticCount === 10 &&
        searchEconomistCount === 51 &&
        detailQuick.resolved_variant?.reading_mode === "quick_30s" &&
        detailTeen.resolved_variant?.audience_segment === "teen" &&
        quotaStatus.free_quota_total === 8 &&
        Array.isArray(profileBenefits.benefit_summary),
      {
        today_new_count: todayNewCount,
        barrons_results: searchBarronsCount,
        atlantic_results: searchAtlanticCount,
        economist_results: searchEconomistCount
      }
    );
    assertCheck(
      checks,
      "feed_return_state_preserved",
      restoreState.activeTab === "followed" &&
        restoreState.publicationKey === "the_atlantic" &&
        restoreState.updateType === "new_publish" &&
        restoreState.scrollTop === 540,
      { restore_state: restoreState }
    );
    assertCheck(
      checks,
      "baseline_reader_digest_preserved",
      scenarioListAfter.items.some((item) => item.scenario_id === baselineScenarioId) &&
        selectedAfterRollback.selected_scenario_id === baselineScenarioId,
      { baseline: baselineScenarioId }
    );
  } catch (error) {
    fatalError = error.message || String(error);
  }

  const report = {
    generated_at: new Date().toISOString(),
    status:
      !fatalError && Object.values(checks).every((check) => check.status === "passed") ? "passed" : "failed",
    fatal_error: fatalError,
    checks
  };

  writeJson(path.join(outputDir, "smoke-report.json"), report);

  if (report.status !== "passed") {
    process.exit(1);
  }
}

main().catch((error) => {
  writeJson(path.join(outputDir, "smoke-report.json"), {
    generated_at: new Date().toISOString(),
    status: "failed",
    fatal_error: error.message || String(error),
    checks: {}
  });
  process.exit(1);
});
