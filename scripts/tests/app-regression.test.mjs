import {
  currentRuntimePath,
  readJson,
  stageTest1OutputPath,
  writeJson
} from "./content-contract.fixtures.mjs";
import {
  publishScenarioToCurrent
} from "../import/lib/content-pipeline.mjs";
import * as discoveryStore from "../../mobile/stores/discovery.store.js";

export async function runAppRegressionTests() {
  const selectedBefore = readJson(currentRuntimePath("scenario-meta.json"));
  const baselineScenarioId = selectedBefore.selected_scenario_id || "data1a_readers_digest_12112025";

  try {
    publishScenarioToCurrent({
      scenarioId: baselineScenarioId,
      selectionSource: "test1_app_baseline"
    });
    const baselineBundle = readJson(currentRuntimePath("runtime.bundle.json"));

    publishScenarioToCurrent({
      scenarioId: "data1c_three_release_mixed_preview",
      selectionSource: "test1_app_mixed"
    });
    const mixedBundle = readJson(currentRuntimePath("runtime.bundle.json"));

    discoveryStore.resetFeedUiState();
    discoveryStore.setFeedUiState({
      activeTab: "followed",
      publicationKey: "the_economist",
      updateType: "new_publish",
      scrollTop: 600,
      restorePending: true
    });
    const restoreState = discoveryStore.consumeFeedRestoreState();

    const baselineAssertions = {
      feed_count: baselineBundle.discoveryCatalog.items.length,
      search_count: baselineBundle.discoveryCatalog.items.filter((item) => item.publication_key === "readers_digest").length,
      detail_quick: Boolean(baselineBundle.contentDetail.responses["art_rd_12112025_001|zh-CN|general|quick_30s"]),
      paywall_quota: baselineBundle.stageG.quotaStatus.response.free_quota_total,
      profile_benefits: Array.isArray(baselineBundle.stageG.profileBenefits.response.benefit_summary)
    };

    const mixedAssertions = {
      multi_publication_count: new Set(mixedBundle.discoveryCatalog.items.map((item) => item.publication_key)).size,
      barrons_count: mixedBundle.discoveryCatalog.items.filter((item) => item.publication_key === "barrons").length,
      atlantic_count: mixedBundle.discoveryCatalog.items.filter((item) => item.publication_key === "the_atlantic").length,
      economist_count: mixedBundle.discoveryCatalog.items.filter((item) => item.publication_key === "the_economist").length,
      detail_general_quick: Boolean(mixedBundle.contentDetail.responses["art_the_atlantic_012026_002|zh-CN|general|quick_30s"]),
      detail_teen_deep: Boolean(mixedBundle.contentDetail.responses["art_the_economist_20260314_024|zh-CN|teen|deep_3m"]),
      quota_total: mixedBundle.stageG.quotaStatus.response.free_quota_total,
      profile_benefits: Array.isArray(mixedBundle.stageG.profileBenefits.response.benefit_summary)
    };

    const report = {
      generated_at: new Date().toISOString(),
      status:
        baselineAssertions.feed_count === 15 &&
        baselineAssertions.search_count === 15 &&
        baselineAssertions.detail_quick &&
        baselineAssertions.paywall_quota === 8 &&
        baselineAssertions.profile_benefits &&
        mixedAssertions.multi_publication_count === 3 &&
        mixedAssertions.barrons_count === 17 &&
        mixedAssertions.atlantic_count === 10 &&
        mixedAssertions.economist_count === 51 &&
        mixedAssertions.detail_general_quick &&
        mixedAssertions.detail_teen_deep &&
        mixedAssertions.quota_total === 8 &&
        mixedAssertions.profile_benefits &&
        restoreState.publicationKey === "the_economist"
          ? "passed"
          : "failed",
      assertions: {
        baseline: baselineAssertions,
        mixed: mixedAssertions,
        restore_state: restoreState,
        provenance_before: selectedBefore.selected_scenario_id,
        provenance_after_mixed: mixedBundle.metadata.selected_scenario_id
      }
    };

    writeJson(stageTest1OutputPath("app-regression-report.json"), report);
    if (report.status !== "passed") {
      throw new Error("TEST1_APP_REGRESSION_FAILED");
    }
    return report;
  } finally {
    publishScenarioToCurrent({
      scenarioId: baselineScenarioId,
      selectionSource: "test1_app_restore"
    });
  }
}
