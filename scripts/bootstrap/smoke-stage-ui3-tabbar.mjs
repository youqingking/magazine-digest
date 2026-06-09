import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import baseRuntimeFixtures from "../../mobile/fixtures/runtime/index.js";
import { loadAuthSession, loadCurrentUserInfo } from "../../mobile/services/auth.service.js";
import { registerCurrentDevice } from "../../mobile/services/device.service.js";
import { loadNotificationDeliveryPreview, loadPushCapability } from "../../mobile/services/push.service.js";
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";
import { loadFeedSnapshot } from "../../mobile/services/content-sync.service.js";
import { refreshCommercialFoundation, getCommercialState } from "../../mobile/stores/commercial.store.js";
import {
  consumeFeedRestoreState,
  refreshDiscoveryHome,
  resetFeedUiState,
  setFeedUiState
} from "../../mobile/stores/discovery.store.js";
import { refreshGrowthFoundation, getGrowthState } from "../../mobile/stores/growth.store.js";
import { refreshInbox, refreshNotificationPrefs, getNotificationsState } from "../../mobile/stores/notifications.store.js";
import { getReaderState, setAudienceMode, setReadingMode } from "../../mobile/stores/reader.store.js";
import { getRuntimeState } from "../../mobile/stores/runtime.store.js";
import { resetSessionState, setRuntimeMode } from "../../mobile/stores/session.store.js";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const outputDir = path.resolve(repoRoot, "output/stage-ui3");

fs.mkdirSync(outputDir, { recursive: true });

[
  "docs/STAGE_UI3_TABBAR_AUDIT.md",
  "docs/STAGE_UI3_TABBAR_DECISIONS.md",
  "docs/STAGE_UI3_ROUTE_MAP.md",
  "docs/STAGE_UI3_ENTRYPOINTS.md"
].forEach((relativePath) => {
  assertCondition(fs.existsSync(path.resolve(repoRoot, relativePath)), `Missing Stage UI3 doc: ${relativePath}`);
});

resetSessionState();
resetFeedUiState();
setRuntimeMode("local");

await refreshDiscoveryHome();
await refreshNotificationPrefs();
await refreshInbox();
await refreshCommercialFoundation();
await refreshGrowthFoundation();
await loadAuthSession();
await loadCurrentUserInfo();

const runtime = getRuntimeState();
const notifications = getNotificationsState();
const commercial = getCommercialState();
const growth = getGrowthState();

const deviceState = await registerCurrentDevice({
  appid: runtime.remoteAppId || null
});
const pushCapability = await loadPushCapability({
  push_clientid: deviceState?.push_clientid || null,
  permission_state: deviceState?.push_clientid ? "granted" : "prompt",
  appid: runtime.pushAppId || runtime.remoteAppId || null
});
const pushPreview = await loadNotificationDeliveryPreview({
  quiet_hours_active: notifications.prefs?.quiet_hours?.enabled,
  digest_enabled: notifications.prefs?.enable_digest,
  notification_inbox_id: "stage_ui3_preview"
});

setFeedUiState({
  activeTab: "updates",
  publicationKey: "all",
  updateType: "revision",
  scrollTop: 520,
  restorePending: true,
  focus: "inbox"
});
const restoreState = consumeFeedRestoreState();
assertCondition(restoreState.activeTab === "updates", "Feed active tab must remain restorable in UI3");
assertCondition(restoreState.publicationKey === "all", "Feed publication filter must remain restorable in UI3");
assertCondition(restoreState.updateType === "revision", "Feed update filter must remain restorable in UI3");
assertCondition(restoreState.scrollTop === 520, "Feed scroll position must remain restorable in UI3");
assertCondition(consumeFeedRestoreState().restorePending === false, "Feed restore flag must clear after consume in UI3");

const feedSnapshot = await loadFeedSnapshot();
const firstReadableItem = (feedSnapshot.articles || []).find((item) => item.article_id);
assertCondition(Boolean(firstReadableItem), "UI3 smoke requires a readable article");

setAudienceMode("general");
setReadingMode("quick_30s");
const quickDetail = await runtimeGateway.getContentDetail({
  article_id: firstReadableItem.article_id,
  language: "zh-CN",
  audience_segment: getReaderState().audienceMode,
  reading_mode: getReaderState().readingMode,
  request_id: "req_stage_ui3_quick"
});
assertCondition(Boolean(quickDetail.resolved_variant?.markdown_body), "Quick reader must keep full body in UI3");

const deepFixtureEntry = Object.values(baseRuntimeFixtures.contentDetail.responses).find(
  (value) => value.resolved_variant?.reading_mode === "deep_3m" && value.resolved_variant?.markdown_body
);
assertCondition(Boolean(deepFixtureEntry), "Deep reader fixture must exist in UI3");

const pagesJson = JSON.parse(readUtf8(path.resolve(repoRoot, "mobile/pages.json")));
const topLevelPages = pagesJson.pages.map((item) => item.path);
const tabbarPages = (pagesJson.tabBar?.list || []).map((item) => item.pagePath);
const tabbarTexts = (pagesJson.tabBar?.list || []).map((item) => item.text);

assertCondition(tabbarPages.length === 3, "UI3 tabBar must contain exactly three items");
assertCondition(tabbarPages.join("|") === [
  "pages/feed/index",
  "pages/search/index",
  "pages/profile/index"
].join("|"), "UI3 tabBar routes must converge to feed/search/profile");
assertCondition(tabbarTexts[1] === "来源" || tabbarTexts[1] === "搜索", "Second tab text must remain route-safe");
assertCondition(!tabbarPages.includes("pages/paywall/index"), "Paywall must leave tabBar in UI3");
assertCondition(!tabbarPages.includes("pages/invite/index"), "Invite must leave tabBar in UI3");
assertCondition(!tabbarPages.includes("pages/settings/index"), "Settings must stay out of tabBar in UI3");
assertCondition(!tabbarPages.includes("pages/detail/index"), "Detail must stay out of tabBar in UI3");

assertCondition(topLevelPages.slice(0, 7).join("|") === [
  "pages/feed/index",
  "pages/search/index",
  "pages/detail/index",
  "pages/paywall/index",
  "pages/invite/index",
  "pages/profile/index",
  "pages/settings/index"
].join("|"), "Final 7 official pages must stay locked on mainline in UI3");

const pageSourceChecks = {
  feed: readUtf8(path.resolve(repoRoot, "mobile/pages/feed/index.vue")),
  detail: readUtf8(path.resolve(repoRoot, "mobile/pages/detail/index.vue")),
  paywall: readUtf8(path.resolve(repoRoot, "mobile/pages/paywall/index.vue")),
  invite: readUtf8(path.resolve(repoRoot, "mobile/pages/invite/index.vue")),
  profile: readUtf8(path.resolve(repoRoot, "mobile/pages/profile/index.vue")),
  settings: readUtf8(path.resolve(repoRoot, "mobile/pages/settings/index.vue")),
  inbox: readUtf8(path.resolve(repoRoot, "mobile/pages/inbox/index.vue")),
  follows: readUtf8(path.resolve(repoRoot, "mobile/pages/follows/index.vue")),
  campaign: readUtf8(path.resolve(repoRoot, "mobile/pages/campaign/index.vue"))
};

assertCondition(pageSourceChecks.feed.includes('url: "/pages/paywall/index?source=feed"'), "Feed must expose a paywall entry in UI3");
assertCondition(pageSourceChecks.feed.includes('url: "/pages/search/index"'), "Feed search handoff must remain a tab in UI3");
assertCondition(pageSourceChecks.detail.includes('url: "/pages/paywall/index?articleId='), "Detail must keep non-tab paywall entry in UI3");
assertCondition(pageSourceChecks.paywall.includes('url: "/pages/invite/index?source=paywall"'), "Paywall must expose invite entry in UI3");
assertCondition(pageSourceChecks.profile.includes('url: "/pages/paywall/index?source=profile"'), "Profile must expose paywall entry in UI3");
assertCondition(pageSourceChecks.profile.includes('url: "/pages/invite/index?source=profile"'), "Profile must expose invite entry in UI3");
assertCondition(pageSourceChecks.profile.includes('url: "/pages/settings/index"'), "Profile must expose settings entry in UI3");
assertCondition(pageSourceChecks.campaign.includes("uni.redirectTo"), "Campaign alias must stop using switchTab in UI3");
assertCondition(!pageSourceChecks.campaign.includes('uni.switchTab({\n      url: "/pages/paywall/index"'), "Campaign alias must not switchTab to paywall in UI3");
assertCondition(pageSourceChecks.follows.includes('url: "/pages/search/index"'), "Follows alias must still reach search tab in UI3");
assertCondition(pageSourceChecks.inbox.includes('url: "/pages/feed/index"'), "Inbox alias must still reach feed tab in UI3");

assertCondition(Boolean(commercial.offer), "Paywall must retain offer summary in UI3");
assertCondition(Boolean(commercial.quota), "Paywall must retain quota status in UI3");
assertCondition(Boolean(commercial.profileBenefits), "Profile must retain benefit summary in UI3");
assertCondition(Boolean(growth.referralSummary), "Invite page must retain invite summary in UI3");
assertCondition(Boolean(growth.rewardSummary), "Invite page must retain reward summary in UI3");
assertCondition(Boolean(pushPreview.inbox_truth_state), "Inbox internal surface must retain inbox truth state in UI3");
assertCondition(Boolean(pushPreview.transport_decision), "Inbox internal surface must retain delivery preview state in UI3");
assertCondition(pageSourceChecks.settings.includes("Build Audit"), "Settings must retain build audit in UI3");
assertCondition(pageSourceChecks.settings.includes("PushStateCard"), "Settings must retain push foundation in UI3");
assertCondition(pageSourceChecks.feed.includes("Runtime "), "Feed must retain low-weight runtime foundation in UI3");
assertCondition(Boolean(pushCapability), "Push capability seam must stay loadable in UI3");

const report = {
  status: "passed",
  generated_at: new Date().toISOString(),
  official_pages: topLevelPages.slice(0, 7),
  alias_pages: topLevelPages.filter((item) => ["pages/inbox/index", "pages/follows/index", "pages/campaign/index"].includes(item)),
  tabbar_pages: tabbarPages,
  tabbar_texts: tabbarTexts,
  restore_state: restoreState,
  article_id: firstReadableItem.article_id,
  reading_modes: [quickDetail.resolved_variant?.reading_mode, deepFixtureEntry.resolved_variant?.reading_mode],
  auth_session_state: (await loadAuthSession()).session_state,
  device_registration_state: deviceState?.registration_state || "unknown",
  push_preview: {
    inbox_truth_state: pushPreview.inbox_truth_state,
    transport_decision: pushPreview.transport_decision
  },
  commercial_foundation: {
    has_offer: Boolean(commercial.offer),
    has_quota: Boolean(commercial.quota),
    has_profile_benefits: Boolean(commercial.profileBenefits)
  },
  growth_foundation: {
    has_referral_summary: Boolean(growth.referralSummary),
    has_reward_summary: Boolean(growth.rewardSummary)
  }
};

fs.writeFileSync(path.join(outputDir, "tabbar-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
