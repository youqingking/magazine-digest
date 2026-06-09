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
const outputDir = path.resolve(repoRoot, "output/stage-ui2");

fs.mkdirSync(outputDir, { recursive: true });

const requiredDocs = [
  "docs/STAGE_UI2_DECISIONS.md",
  "docs/STAGE_UI2_DESIGN_MAP.md",
  "docs/STAGE_UI2_CONFLICTS.md",
  "docs/STAGE_UI2_COMPONENT_MAP.md"
];

const requiredDesignInputs = [
  "docs/design-handoff/stitch-ui1_5/DESIGN.md",
  "docs/design-handoff/stitch-ui1_5/screen.html",
  "docs/design-handoff/stitch-ui1_5/screen.png",
  "docs/design-handoff/stitch-ui1_5/screen-1.html",
  "docs/design-handoff/stitch-ui1_5/screen-2.html",
  "docs/design-handoff/stitch-ui1_5/screen-3.html",
  "docs/design-handoff/stitch-ui1_5/screen-4.html",
  "docs/design-handoff/stitch-ui1_5/screen-5.html"
];

requiredDocs.forEach((relativePath) => {
  assertCondition(fs.existsSync(path.resolve(repoRoot, relativePath)), `Missing required Stage UI2 doc: ${relativePath}`);
});

requiredDesignInputs.forEach((relativePath) => {
  assertCondition(fs.existsSync(path.resolve(repoRoot, relativePath)), `Missing required extracted design handoff: ${relativePath}`);
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
  notification_inbox_id: "stage_ui2_preview"
});

setFeedUiState({
  activeTab: "updates",
  publicationKey: "all",
  updateType: "revision",
  scrollTop: 480,
  restorePending: true,
  focus: "inbox"
});
const restoreState = consumeFeedRestoreState();
assertCondition(restoreState.activeTab === "updates", "Feed active tab must remain restorable in UI2");
assertCondition(restoreState.updateType === "revision", "Feed update filter must remain restorable in UI2");
assertCondition(restoreState.scrollTop === 480, "Feed scroll position must remain restorable in UI2");
assertCondition(restoreState.focus === "inbox", "Feed inbox focus state must remain writable in UI2");
assertCondition(consumeFeedRestoreState().restorePending === false, "Feed restore flag must clear after consume in UI2");

const feedSnapshot = await loadFeedSnapshot();
const firstReadableItem = (feedSnapshot.articles || []).find((item) => item.article_id);
assertCondition(Boolean(firstReadableItem), "UI2 smoke requires a readable article");

setAudienceMode("general");
setReadingMode("quick_30s");
const quickDetail = await runtimeGateway.getContentDetail({
  article_id: firstReadableItem.article_id,
  language: "zh-CN",
  audience_segment: getReaderState().audienceMode,
  reading_mode: getReaderState().readingMode,
  request_id: "req_stage_ui2_quick"
});
assertCondition(Boolean(quickDetail.resolved_variant?.markdown_body), "Quick reader must keep full body in UI2");

const deepFixtureEntry = Object.values(baseRuntimeFixtures.contentDetail.responses).find(
  (value) => value.resolved_variant?.reading_mode === "deep_3m" && value.resolved_variant?.markdown_body
);
assertCondition(Boolean(deepFixtureEntry), "Deep reader fixture must exist in UI2");
setReadingMode("deep_3m");
assertCondition(Boolean(deepFixtureEntry.resolved_variant?.markdown_body), "Deep reader must keep full body in UI2");

assertCondition(Boolean(commercial.offer), "Paywall must retain offer summary in UI2");
assertCondition(Boolean(commercial.quota), "Paywall must retain quota status in UI2");
assertCondition(Boolean(commercial.profileBenefits), "Profile must retain benefit summary in UI2");
assertCondition(Boolean(growth.referralSummary), "Invite page must retain invite summary in UI2");
assertCondition(Boolean(growth.rewardSummary), "Invite page must retain reward summary in UI2");
assertCondition(Boolean(pushPreview.inbox_truth_state), "Inbox internal surface must retain inbox truth state in UI2");
assertCondition(Boolean(pushPreview.transport_decision), "Inbox internal surface must retain delivery preview state in UI2");

const pagesJson = JSON.parse(readUtf8(path.resolve(repoRoot, "mobile/pages.json")));
const topLevelPages = pagesJson.pages.map((item) => item.path);
assertCondition(topLevelPages.slice(0, 7).join("|") === [
  "pages/feed/index",
  "pages/search/index",
  "pages/detail/index",
  "pages/paywall/index",
  "pages/invite/index",
  "pages/profile/index",
  "pages/settings/index"
].join("|"), "Final 7 official pages must stay locked on mainline in UI2");
assertCondition(topLevelPages.includes("pages/inbox/index"), "Inbox alias page must exist in UI2");
assertCondition(topLevelPages.includes("pages/follows/index"), "Follows alias page must exist in UI2");
assertCondition(topLevelPages.includes("pages/campaign/index"), "Campaign alias page must exist in UI2");

const pageSourceChecks = {
  feed: readUtf8(path.resolve(repoRoot, "mobile/pages/feed/index.vue")),
  detail: readUtf8(path.resolve(repoRoot, "mobile/pages/detail/index.vue")),
  search: readUtf8(path.resolve(repoRoot, "mobile/pages/search/index.vue")),
  paywall: readUtf8(path.resolve(repoRoot, "mobile/pages/paywall/index.vue")),
  invite: readUtf8(path.resolve(repoRoot, "mobile/pages/invite/index.vue")),
  profile: readUtf8(path.resolve(repoRoot, "mobile/pages/profile/index.vue")),
  settings: readUtf8(path.resolve(repoRoot, "mobile/pages/settings/index.vue")),
  inbox: readUtf8(path.resolve(repoRoot, "mobile/pages/inbox/index.vue"))
};

assertCondition(pageSourceChecks.feed.includes("feed-source-row"), "Feed page must expose stitched two-layer home nav");
assertCondition(pageSourceChecks.feed.includes("消息摘要"), "Feed page must retain inbox summary surface");
assertCondition(pageSourceChecks.detail.includes("<ModeTabs"), "Detail page must keep top mode switchers");
assertCondition(pageSourceChecks.detail.includes("<ArticleBodyBlock"), "Detail page must keep full reading body renderer");
assertCondition(pageSourceChecks.search.includes("关注目录"), "Search page must keep follow catalog responsibility");
assertCondition(pageSourceChecks.paywall.includes("OfferSummaryCard"), "Paywall page must keep commercial offer surface");
assertCondition(pageSourceChecks.paywall.includes("QuotaStatusCard"), "Paywall page must keep quota surface");
assertCondition(pageSourceChecks.invite.includes("InviteSummaryCard"), "Invite page must keep invite summary surface");
assertCondition(pageSourceChecks.profile.includes("RewardSummaryCard"), "Profile page must keep reward summary surface");
assertCondition(pageSourceChecks.profile.includes("setFeedUiState"), "Profile page must route inbox summary back through feed state");
assertCondition(pageSourceChecks.settings.includes("PushStateCard"), "Settings page must keep push foundation surface");
assertCondition(pageSourceChecks.inbox.includes("PushStateCard"), "Inbox internal page must keep delivery preview foundation");

const report = {
  status: "passed",
  generated_at: new Date().toISOString(),
  official_pages: topLevelPages.slice(0, 7),
  alias_pages: topLevelPages.filter((item) => ["pages/inbox/index", "pages/follows/index", "pages/campaign/index"].includes(item)),
  tabbar_pages: (pagesJson.tabBar?.list || []).map((item) => item.pagePath),
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

fs.writeFileSync(path.join(outputDir, "smoke-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
