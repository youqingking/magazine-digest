import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-data1b");
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

function buildTempZipFromRaw() {
  const rawRoot = path.join(repoRoot, "data", "real-content", "readers-digest", "12112025", "raw");
  const tempRoot = path.join(outputDir, "temp-batch");
  const sourceDir = path.join(tempRoot, "Reader's Digest-12112025");
  const zipPath = path.join(tempRoot, "Reader's Digest-12112025.zip");

  if (fs.existsSync(tempRoot)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(sourceDir, { recursive: true });
  for (const entry of fs.readdirSync(rawRoot)) {
    fs.copyFileSync(path.join(rawRoot, entry), path.join(sourceDir, entry));
  }

  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "Compress-Archive -Path $env:DATA1B_ZIP_SOURCE -DestinationPath $env:DATA1B_ZIP_DEST -Force"
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        DATA1B_ZIP_SOURCE: path.join(sourceDir, "*"),
        DATA1B_ZIP_DEST: zipPath
      },
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024
    }
  );

  return {
    tempRoot,
    zipPath
  };
}

async function main() {
  const checks = {};
  let fatalError = "";

  try {
    const { zipPath } = buildTempZipFromRaw();
    const batchImporterModule = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "import-content-batch.mjs")).href);
    const importResult = await batchImporterModule.importContentBatch({
      scanDir: path.dirname(zipPath),
      publishScenario: "data1a_readers_digest_12112025",
      freeQuotaLimit: 8
    });

    const publicationsRegistry = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "real-content", "publications.json"), "utf8"));
    const issuesRegistry = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "real-content", "issues.json"), "utf8"));
    const scenariosRegistry = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "index.json"), "utf8"));
    const selectedScenario = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json"), "utf8"));
    const currentMeta = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "scenario-meta.json"), "utf8"));
    const runtimeBundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "runtime.bundle.json"), "utf8"));

    const { createLocalRuntimeApi } = await import(pathToFileURL(path.join(repoRoot, "mobile", "api", "local-runtime-api.js")).href);
    const discoveryStore = await import(pathToFileURL(path.join(repoRoot, "mobile", "stores", "discovery.store.js")).href);
    const api = createLocalRuntimeApi();

    assertCheck(checks, "batch_importer_imported_single_zip", importResult.importResults.length === 1, {
      imported_count: importResult.importResults.length
    });
    assertCheck(
      checks,
      "reader_digest_parser_profile_retained",
      importResult.importResults[0].parserProfile === "readers_digest_v1" &&
        importResult.importResults[0].manifest.imported_article_count === 15,
      {
        parser_profile: importResult.importResults[0].parserProfile,
        article_count: importResult.importResults[0].manifest.imported_article_count
      }
    );
    assertCheck(
      checks,
      "publication_issue_scenario_registries_present",
      publicationsRegistry.items.some((item) => item.id === "readers_digest") &&
        issuesRegistry.items.some((item) => item.issue_id === "readers_digest__12112025") &&
        scenariosRegistry.items.some((item) => item.scenario_id === "data1a_readers_digest_12112025"),
      {
        publication_count: publicationsRegistry.items.length,
        issue_count: issuesRegistry.items.length,
        scenario_count: scenariosRegistry.items.length
      }
    );
    assertCheck(
      checks,
      "scenario_selection_pointer_present",
      selectedScenario.selected_scenario_id === "data1a_readers_digest_12112025" &&
        currentMeta.selected_scenario_id === "data1a_readers_digest_12112025",
      {
        selected_scenario: selectedScenario.selected_scenario_id,
        current_meta_scenario: currentMeta.selected_scenario_id
      }
    );
    assertCheck(
      checks,
      "current_runtime_is_selected_scenario_mirror",
      currentMeta.runtime_fixture_role === "selected_scenario_mirror" &&
        runtimeBundle.metadata?.selected_scenario_id === "data1a_readers_digest_12112025",
      {
        current_meta: currentMeta
      }
    );

    const homeDiscovery = await api.getHomeDiscovery({ user_id: "user_local_stage_e0" });
    const todayNew = homeDiscovery.modules.find((module) => module.section_key === "today_new");
    const searchResponse = await api.searchContent({ query: "布鲁斯", filters: {}, limit: 20 });
    const detailQuick = await api.getContentDetail({
      article_id: "art_rd_12112025_001",
      language: "zh-CN",
      audience_segment: "general",
      reading_mode: "quick_30s"
    });
    const quotaStatus = await api.getQuotaStatus();
    const profileBenefits = await api.getProfileBenefits();

    assertCheck(
      checks,
      "app_runtime_consumes_selected_scenario",
      (todayNew?.items || []).length === 15 &&
        searchResponse.items.length === 1 &&
        detailQuick.resolved_variant?.reading_mode === "quick_30s" &&
        quotaStatus.free_quota_total === 8 &&
        Array.isArray(profileBenefits.benefit_summary),
      {
        today_new_count: (todayNew?.items || []).length,
        search_results: searchResponse.items.length,
        quota_total: quotaStatus.free_quota_total
      }
    );

    discoveryStore.resetFeedUiState();
    discoveryStore.setFeedUiState({
      activeTab: "followed",
      publicationKey: "readers_digest",
      updateType: "new_publish",
      scrollTop: 320,
      restorePending: true
    });
    const restoreState = discoveryStore.consumeFeedRestoreState();
    assertCheck(
      checks,
      "feed_search_detail_paths_not_regressed",
      restoreState.activeTab === "followed" &&
        restoreState.publicationKey === "readers_digest" &&
        restoreState.updateType === "new_publish" &&
        restoreState.scrollTop === 320,
      {
        restore_state: restoreState
      }
    );

    const registryReport = JSON.parse(fs.readFileSync(path.join(outputDir, "registry-report.json"), "utf8"));
    assertCheck(
      checks,
      "registry_report_written",
      registryReport.selected_scenario_id === "data1a_readers_digest_12112025",
      {
        registry_report: registryReport
      }
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
