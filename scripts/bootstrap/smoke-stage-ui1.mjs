import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import baseRuntimeFixtures from "../../mobile/fixtures/runtime/index.js";
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";
import {
  consumeFeedRestoreState,
  refreshDiscoveryHome,
  resetFeedUiState,
  setFeedUiState
} from "../../mobile/stores/discovery.store.js";
import { loadFeedSnapshot } from "../../mobile/services/content-sync.service.js";
import { getReaderState, setAudienceMode, setReadingMode } from "../../mobile/stores/reader.store.js";
import { resetSessionState, setRuntimeMode } from "../../mobile/stores/session.store.js";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "../../output/stage-ui1");

fs.mkdirSync(outputDir, { recursive: true });

resetSessionState();
resetFeedUiState();
setRuntimeMode("local");

const discovery = await refreshDiscoveryHome();
const homeModules = discovery.modules || [];
assertCondition(homeModules.length >= 3, "Stage UI1 home must expose multiple merged modules");
assertCondition(homeModules.some((item) => item.section_key === "followed_updates"), "Home must retain followed updates");
assertCondition(homeModules.some((item) => item.section_key === "saved_for_later"), "Home must retain saved for later");

const feedSnapshot = await loadFeedSnapshot();
assertCondition(feedSnapshot.articles.length > 0, "Stage UI1 smoke requires at least one article");

setFeedUiState({
  activeTab: "followed",
  publicationKey: "all",
  updateType: "revision",
  scrollTop: 640,
  restorePending: true
});
const restoreState = consumeFeedRestoreState();
assertCondition(restoreState.activeTab === "followed", "Feed tab must persist");
assertCondition(restoreState.updateType === "revision", "Feed filter must persist");
assertCondition(restoreState.scrollTop === 640, "Feed scrollTop must persist");
assertCondition(restoreState.restorePending === true, "Feed restore flag must be readable before consume reset");
assertCondition(consumeFeedRestoreState().restorePending === false, "Feed restore flag must clear after consume");

const firstArticle = feedSnapshot.articles[0].article_id;
const detailFixtureArticle = firstArticle;

setAudienceMode("general");
setReadingMode("quick_30s");
const quickDetail = await runtimeGateway.getContentDetail({
  article_id: detailFixtureArticle,
  language: "zh-CN",
  audience_segment: getReaderState().audienceMode,
  reading_mode: getReaderState().readingMode,
  request_id: "req_stage_ui1_quick"
});
assertCondition(Boolean(quickDetail.resolved_variant?.markdown_body), "Quick mode must resolve full scroll body");

setReadingMode("deep_3m");
const deepFixture = Object.values(baseRuntimeFixtures.contentDetail.responses).find(
  (item) => item.resolved_variant?.reading_mode === "deep_3m" && item.resolved_variant?.markdown_body
);
assertCondition(Boolean(deepFixture), "Deep mode fixture must expose full scroll body");

const pagesJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../mobile/pages.json"), "utf8"));
const topLevelPages = pagesJson.pages.map((item) => item.path);
assertCondition(topLevelPages.includes("pages/feed/index"), "Feed page must exist");
assertCondition(topLevelPages.includes("pages/detail/index"), "Detail page must exist");
assertCondition(topLevelPages.includes("pages/search/index"), "Search page must exist");
assertCondition(topLevelPages.includes("pages/paywall/index"), "Paywall page must exist");
assertCondition(topLevelPages.includes("pages/invite/index"), "Invite page must exist");
assertCondition(topLevelPages.includes("pages/profile/index"), "Profile page must exist");
assertCondition(topLevelPages.includes("pages/settings/index"), "Settings page must exist");
assertCondition(topLevelPages.slice(0, 7).join("|") === [
  "pages/feed/index",
  "pages/search/index",
  "pages/detail/index",
  "pages/paywall/index",
  "pages/invite/index",
  "pages/profile/index",
  "pages/settings/index"
].join("|"), "Final 7 official pages must stay locked in pages.json order");
assertCondition(topLevelPages.includes("pages/inbox/index"), "Inbox alias page must exist");
assertCondition(topLevelPages.includes("pages/follows/index"), "Follows alias page must exist");
assertCondition(topLevelPages.includes("pages/campaign/index"), "Campaign alias page must exist");
assertCondition(!topLevelPages.includes("pages/auth-test/index"), "Auth test must not stay in final IA pages");

const report = {
  status: "passed",
  home_sections: homeModules.map((item) => item.section_key),
  feed_state: feedSnapshot.state,
  feed_restore_state: restoreState,
  first_article_id: firstArticle,
  detail_fixture_article: detailFixtureArticle,
  quick_mode: quickDetail.resolved_variant?.reading_mode,
  deep_mode: deepFixture.resolved_variant?.reading_mode,
  final_pages: topLevelPages.slice(0, 7),
  alias_pages: topLevelPages.filter((item) => ["pages/inbox/index", "pages/follows/index", "pages/campaign/index"].includes(item))
};

fs.writeFileSync(path.join(outputDir, "smoke-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
