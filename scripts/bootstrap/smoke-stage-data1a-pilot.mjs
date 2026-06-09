import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-data1a-pilot");
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
    const importerModule = await import(pathToFileURL(path.join(repoRoot, "scripts", "import", "import-readers-digest-pilot.mjs")).href);
    const importResult = await importerModule.importReadersDigestPilot();
    const { createLocalRuntimeApi } = await import(pathToFileURL(path.join(repoRoot, "mobile", "api", "local-runtime-api.js")).href);
    const discoveryStore = await import(pathToFileURL(path.join(repoRoot, "mobile", "stores", "discovery.store.js")).href);
    const runtimeBundle = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "runtime.bundle.json"), "utf8")
    );
    const api = createLocalRuntimeApi();
    const userId = "user_local_stage_e0";

    const normalizedRoot = path.join(repoRoot, "data", "real-content", "readers-digest", "12112025", "normalized");
    const normalizedFiles = fs.readdirSync(normalizedRoot).filter((fileName) => /^article-\d{3}\.json$/.test(fileName)).sort();
    const normalizedRecords = normalizedFiles.map((fileName) =>
      JSON.parse(fs.readFileSync(path.join(normalizedRoot, fileName), "utf8"))
    );

    assertCheck(checks, "normalized_article_count", normalizedRecords.length === 15, {
      count: normalizedRecords.length
    });
    assertCheck(
      checks,
      "adult_merged_not_imported",
      importResult.manifest.skipped_assets.includes("Reader's Digest-12112025_adult.md") &&
        !normalizedRecords.some((record) => record.source_file_name === "Reader's Digest-12112025_adult.md"),
      {
        skipped_assets: importResult.manifest.skipped_assets
      }
    );
    assertCheck(
      checks,
      "core_content_blocks_present",
      normalizedRecords.every(
        (record) => record.quick_30s && record.deep_3m && record.teen_quick_30s && record.teen_deep_3m
      ),
      {
        missing_block_count: importResult.parseReport.missing_block_records.length
      }
    );
    assertCheck(
      checks,
      "section_and_page_from_merged_file",
      normalizedRecords.every((record) => record.section_label && Number(record.start_page) > 0),
      {
        sections: importResult.normalizedCatalog.sections
      }
    );
    assertCheck(
      checks,
      "general_runtime_compat_derivation",
      normalizedRecords.every(
        (record) =>
          record.general_variant_derivation === "derived_from_adult_for_general_runtime_compat" &&
          record.general_quick_30s === record.quick_30s &&
          record.general_deep_3m === record.deep_3m
      )
    );
    assertCheck(
      checks,
      "null_optional_fields_safe",
      normalizedRecords.every(
        (record) => record.canonical_url === null && record.cover === null && record.author === null
      )
    );

    const homeDiscovery = await api.getHomeDiscovery({ user_id: userId });
    const todayNew = homeDiscovery.modules.find((module) => module.section_key === "today_new");
    assertCheck(checks, "feed_real_content_loaded", (todayNew?.items || []).length === 15, {
      today_new_count: (todayNew?.items || []).length
    });

    const searchAll = await api.searchContent({ query: "", filters: {}, limit: 20 });
    const searchBySection = await api.searchContent({
      query: "",
      filters: { tag: "本期文章 (Articles)" },
      limit: 20
    });
    const searchByTitle = await api.searchContent({
      query: "布鲁斯",
      filters: {},
      limit: 20
    });
    assertCheck(checks, "search_publication_section_title_browse", searchAll.items.length === 15 && searchBySection.items.length > 0 && searchByTitle.items.length === 1, {
      total_results: searchAll.items.length,
      section_results: searchBySection.items.length,
      title_results: searchByTitle.items.length
    });

    const firstArticle = normalizedRecords[0];
    const detailQuick = await api.getContentDetail({
      article_id: firstArticle.article_id,
      language: "zh-CN",
      audience_segment: "general",
      reading_mode: "quick_30s"
    });
    const detailDeep = await api.getContentDetail({
      article_id: firstArticle.article_id,
      language: "zh-CN",
      audience_segment: "general",
      reading_mode: "deep_3m"
    });
    const teenDetail = await api.getContentDetail({
      article_id: firstArticle.article_id,
      language: "zh-CN",
      audience_segment: "teen",
      reading_mode: "quick_30s"
    });
    assertCheck(
      checks,
      "detail_variants_loaded",
      detailQuick.resolved_variant?.reading_mode === "quick_30s" &&
        detailDeep.resolved_variant?.reading_mode === "deep_3m" &&
        teenDetail.resolved_variant?.audience_segment === "teen",
      {
        quick_variant: detailQuick.resolved_variant?.article_variant_id,
        deep_variant: detailDeep.resolved_variant?.article_variant_id,
        teen_variant: teenDetail.resolved_variant?.article_variant_id
      }
    );

    const quotaStatus = await api.getQuotaStatus();
    const commercialOffer = await api.getCommercialOffer();
    assertCheck(
      checks,
      "paywall_runtime_rule_connected",
      quotaStatus.free_quota_total === 8 &&
        quotaStatus.free_quota_used === 8 &&
        quotaStatus.paywall_triggered === true &&
        (commercialOffer.available_plans || []).length > 0,
      {
        quota_status: quotaStatus,
        offer_plan_count: (commercialOffer.available_plans || []).length
      }
    );

    discoveryStore.resetFeedUiState();
    discoveryStore.setFeedUiState({
      activeTab: "followed",
      publicationKey: "readers_digest",
      updateType: "new_publish",
      scrollTop: 420,
      restorePending: true
    });
    const restoreState = discoveryStore.consumeFeedRestoreState();
    const afterConsume = discoveryStore.consumeFeedRestoreState();
    assertCheck(
      checks,
      "feed_return_state_restore_semantics",
      restoreState.activeTab === "followed" &&
        restoreState.publicationKey === "readers_digest" &&
        restoreState.updateType === "new_publish" &&
        restoreState.scrollTop === 420 &&
        restoreState.restorePending === true &&
        afterConsume.restorePending === false,
      {
        restore_state: restoreState,
        after_consume: afterConsume
      }
    );

    assertCheck(
      checks,
      "runtime_bundle_is_real_content_pilot",
      runtimeBundle.metadata?.source_kind === "real_content_pilot" &&
        runtimeBundle.metadata?.publication_key === "readers_digest" &&
        runtimeBundle.discoveryCatalog?.items?.length === 15,
      {
        metadata: runtimeBundle.metadata
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
