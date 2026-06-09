import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-data1c");
const reportPath = path.join(outputDir, "smoke-report.json");

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

function assertCheck(checks, id, condition, details = {}) {
  checks[id] = {
    status: condition ? "passed" : "failed",
    ...details
  };
}

async function main() {
  const checks = {};
  let fatalError = "";

  try {
    const selectedBefore = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json"), "utf8")
    );
    const { importContentPack } = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "import-content-pack.mjs")).href);
    const { publishScenarioToCurrent } = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "lib", "content-pipeline.mjs")).href);

    const importResult = await importContentPack({
      zip: "C:/Users/dabblefly/Downloads/Three-release.zip",
      freeQuotaLimit: 8
    });

    const packReport = JSON.parse(fs.readFileSync(path.join(outputDir, "pack-report.json"), "utf8"));
    const registryReport = JSON.parse(fs.readFileSync(path.join(outputDir, "registry-report.json"), "utf8"));
    const scenarioReport = JSON.parse(fs.readFileSync(path.join(outputDir, "scenario-report.json"), "utf8"));
    const selectedAfterImport = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json"), "utf8")
    );

    assertCheck(
      checks,
      "three_release_publications_detected",
      packReport.releases.length === 3 &&
        packReport.releases.some((item) => item.publication_id === "barrons" && item.paired_count === 17) &&
        packReport.releases.some((item) => item.publication_id === "the_atlantic" && item.paired_count === 10) &&
        packReport.releases.some((item) => item.publication_id === "the_economist" && item.paired_count === 51),
      {
        releases: packReport.releases
      }
    );
    assertCheck(
      checks,
      "split_audience_pairing_established",
      packReport.releases.every((item) => item.adult_count === item.youth_count && item.paired_count === item.adult_count),
      {
        releases: packReport.releases.map((item) => ({
          publication_id: item.publication_id,
          adult_count: item.adult_count,
          youth_count: item.youth_count,
          paired_count: item.paired_count
        }))
      }
    );
    assertCheck(
      checks,
      "registry_entries_created",
      registryReport.added_publications.includes("barrons") &&
        registryReport.added_publications.includes("the_atlantic") &&
        registryReport.added_publications.includes("the_economist") &&
        registryReport.added_issues.includes("barrons__09022026") &&
        registryReport.added_scenarios.includes("data1c_three_release_mixed_preview"),
      {
        registry_report: registryReport
      }
    );
    assertCheck(
      checks,
      "reader_digest_selection_preserved_after_import",
      selectedBefore.selected_scenario_id === selectedAfterImport.selected_scenario_id &&
        selectedAfterImport.selected_scenario_id === "data1a_readers_digest_12112025",
      {
        before: selectedBefore.selected_scenario_id,
        after: selectedAfterImport.selected_scenario_id
      }
    );
    assertCheck(
      checks,
      "single_and_mixed_scenarios_generated",
      scenarioReport.single_scenarios.length === 3 &&
        scenarioReport.mixed_scenario?.scenario_id === "data1c_three_release_mixed_preview",
      {
        scenario_report: scenarioReport
      }
    );

    publishScenarioToCurrent({
      scenarioId: "data1c_three_release_mixed_preview",
      selectionSource: "stage_data1c_smoke"
    });

    const { createLocalRuntimeApi } = await import(pathToFileURL(path.join(repoRoot, "mobile", "api", "local-runtime-api.js")).href);
    const discoveryStore = await import(pathToFileURL(path.join(repoRoot, "mobile", "stores", "discovery.store.js")).href);
    const api = createLocalRuntimeApi();

    const homeDiscovery = await api.getHomeDiscovery({ user_id: "user_local_stage_e0" });
    const todayNew = homeDiscovery.modules.find((module) => module.section_key === "today_new");
    const searchAll = await api.searchContent({ query: "", filters: {}, limit: 200 });
    const searchBarrons = await api.searchContent({ query: "", filters: { publication: "barrons" }, limit: 50 });
    const searchAtlantic = await api.searchContent({ query: "", filters: { publication: "the_atlantic" }, limit: 50 });
    const searchEconomist = await api.searchContent({ query: "", filters: { publication: "the_economist" }, limit: 100 });
    const detailQuick = await api.getContentDetail({
      article_id: "art_barrons_09022026_001",
      language: "zh-CN",
      audience_segment: "general",
      reading_mode: "quick_30s"
    });
    const detailTeen = await api.getContentDetail({
      article_id: "art_the_economist_20260314_004",
      language: "zh-CN",
      audience_segment: "teen",
      reading_mode: "deep_3m"
    });
    const quotaStatus = await api.getQuotaStatus();
    const profileBenefits = await api.getProfileBenefits();

    assertCheck(
      checks,
      "mixed_scenario_feed_search_detail_profile_ok",
      (todayNew?.items || []).length === 78 &&
        searchAll.items.length === 78 &&
        searchBarrons.items.length === 17 &&
        searchAtlantic.items.length === 10 &&
        searchEconomist.items.length === 51 &&
        detailQuick.resolved_variant?.reading_mode === "quick_30s" &&
        detailTeen.resolved_variant?.audience_segment === "teen" &&
        quotaStatus.free_quota_total === 8 &&
        Array.isArray(profileBenefits.benefit_summary),
      {
        today_new_count: (todayNew?.items || []).length,
        barrons_results: searchBarrons.items.length,
        atlantic_results: searchAtlantic.items.length,
        economist_results: searchEconomist.items.length
      }
    );

    discoveryStore.resetFeedUiState();
    discoveryStore.setFeedUiState({
      activeTab: "followed",
      publicationKey: "the_economist",
      updateType: "new_publish",
      scrollTop: 610,
      restorePending: true
    });
    const restoreState = discoveryStore.consumeFeedRestoreState();
    assertCheck(
      checks,
      "feed_return_state_still_works_in_mixed_scenario",
      restoreState.activeTab === "followed" &&
        restoreState.publicationKey === "the_economist" &&
        restoreState.updateType === "new_publish" &&
        restoreState.scrollTop === 610,
      {
        restore_state: restoreState
      }
    );

    publishScenarioToCurrent({
      scenarioId: selectedBefore.selected_scenario_id,
      selectionSource: "stage_data1c_smoke_restore"
    });

    const selectedAfterRestore = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json"), "utf8")
    );
    assertCheck(
      checks,
      "baseline_restored_after_smoke",
      selectedAfterRestore.selected_scenario_id === selectedBefore.selected_scenario_id,
      {
        restored: selectedAfterRestore.selected_scenario_id
      }
    );

    void importResult;
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

  writeReport(report);

  if (report.status !== "passed") {
    process.exit(1);
  }
}

main().catch((error) => {
  writeReport({
    generated_at: new Date().toISOString(),
    status: "failed",
    fatal_error: error.message || String(error),
    checks: {}
  });
  process.exit(1);
});
