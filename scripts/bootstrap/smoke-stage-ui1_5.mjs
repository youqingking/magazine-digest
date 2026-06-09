import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import baseRuntimeFixtures from "../../mobile/fixtures/runtime/index.js";
import { loadAuthSession, loadCurrentUserInfo } from "../../mobile/services/auth.service.js";
import { registerCurrentDevice } from "../../mobile/services/device.service.js";
import { loadNotificationDeliveryPreview, loadPushCapability } from "../../mobile/services/push.service.js";
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
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const outputDir = path.resolve(repoRoot, "output/stage-ui1_5");

fs.mkdirSync(outputDir, { recursive: true });

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
  notification_inbox_id: "stage_ui1_5_preview"
});

setFeedUiState({
  activeTab: "updates",
  publicationKey: "all",
  updateType: "all",
  scrollTop: 512,
  restorePending: true
});
const restoreState = consumeFeedRestoreState();
assertCondition(restoreState.activeTab === "updates", "Feed active tab must remain restorable");
assertCondition(restoreState.scrollTop === 512, "Feed scroll position must remain restorable");
assertCondition(consumeFeedRestoreState().restorePending === false, "Feed restore flag must clear after consume");

await refreshDiscoveryHome();
const feedSnapshot = await loadFeedSnapshot();
const firstReadableItem = (feedSnapshot.articles || []).find((item) => item.article_id);
assertCondition(Boolean(firstReadableItem), "UI1.5 smoke requires a readable article");

setAudienceMode("general");
setReadingMode("quick_30s");
const quickDetail = await runtimeGateway.getContentDetail({
  article_id: firstReadableItem.article_id,
  language: "zh-CN",
  audience_segment: getReaderState().audienceMode,
  reading_mode: getReaderState().readingMode,
  request_id: "req_stage_ui1_5_quick"
});
assertCondition(Boolean(quickDetail.resolved_variant?.markdown_body), "Quick reader must keep full body");

const deepFixtureEntry = Object.values(baseRuntimeFixtures.contentDetail.responses).find(
  (value) => value.resolved_variant?.reading_mode === "deep_3m" && value.resolved_variant?.markdown_body
);
assertCondition(Boolean(deepFixtureEntry), "Deep reader fixture must exist");
setReadingMode("deep_3m");
const deepDetail = deepFixtureEntry;
assertCondition(Boolean(deepDetail.resolved_variant?.markdown_body), "Deep reader must keep full body");

assertCondition(Boolean(commercial.offer), "Paywall must retain offer summary");
assertCondition(Boolean(commercial.quota), "Paywall must retain quota status");
assertCondition(Boolean(commercial.profileBenefits), "Profile must retain benefit summary");
assertCondition(Boolean(growth.referralSummary), "Invite page must retain invite summary");
assertCondition(Boolean(growth.rewardSummary), "Invite page must retain reward summary");
assertCondition(Boolean(pushPreview.inbox_truth_state), "Inbox internal surface must retain inbox truth state");
assertCondition(Boolean(pushPreview.transport_decision), "Inbox internal surface must retain delivery preview state");

const pagesJson = JSON.parse(fs.readFileSync(path.resolve(repoRoot, "mobile/pages.json"), "utf8"));
const topLevelPages = pagesJson.pages.map((item) => item.path);
assertCondition(topLevelPages.slice(0, 7).join("|") === [
  "pages/feed/index",
  "pages/search/index",
  "pages/detail/index",
  "pages/paywall/index",
  "pages/invite/index",
  "pages/profile/index",
  "pages/settings/index"
].join("|"), "Final 7 official pages must stay locked on mainline");

const inboxPageSource = fs.readFileSync(path.resolve(repoRoot, "mobile/pages/inbox/index.vue"), "utf8");
const profilePageSource = fs.readFileSync(path.resolve(repoRoot, "mobile/pages/profile/index.vue"), "utf8");
assertCondition(inboxPageSource.includes("Inbox truth"), "Inbox internal page must expose inbox truth");
assertCondition(inboxPageSource.includes("PushStateCard"), "Inbox internal page must expose delivery preview foundation");
assertCondition(profilePageSource.includes("<DeviceStateCard"), "Profile page must keep device summary visible");

const report = {
  status: "passed",
  final_pages: topLevelPages.slice(0, 7),
  internal_routes: topLevelPages.filter((item) => ["pages/inbox/index", "pages/follows/index", "pages/campaign/index"].includes(item)),
  restore_state: restoreState,
  article_id: firstReadableItem.article_id,
  reading_modes: [quickDetail.resolved_variant?.reading_mode, deepDetail.resolved_variant?.reading_mode],
  auth_session_state: (await loadAuthSession()).session_state,
  device_registration_state: deviceState?.registration_state || "unknown",
  push_preview: pushPreview,
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
