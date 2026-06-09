import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  expect(fs.existsSync(fullPath), `MISSING:${relativePath}`);
  return fullPath;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(requireFile(relativePath), "utf8"));
}

const requiredDocs = [
  "docs/F1_ACCEPTANCE.md",
  "docs/STAGE_F1_DECISIONS.md",
  "docs/NOTIFICATION_FOUNDATION.md",
  "docs/DISCOVERY_RUNTIME.md"
];

const requiredSurfaces = [
  "backend/surfaces/home-discovery.mjs",
  "backend/surfaces/search-content.mjs",
  "backend/surfaces/follow-catalog.mjs",
  "backend/surfaces/follow-toggle.mjs",
  "backend/surfaces/notification-inbox.mjs",
  "backend/surfaces/notification-prefs.mjs",
  "backend/surfaces/mark-inbox-read.mjs",
  "backend/surfaces/content-resume.mjs",
  "backend/surfaces/save-for-later.mjs",
  "backend/surfaces/publish-batch-summary.mjs"
];

const requiredMobile = [
  "mobile/pages/inbox/index.vue",
  "mobile/pages/search/index.vue",
  "mobile/pages/follows/index.vue",
  "mobile/stores/discovery.store.js",
  "mobile/stores/notifications.store.js",
  "mobile/services/discovery.service.js",
  "mobile/services/search.service.js",
  "mobile/services/follow.service.js",
  "mobile/services/notification.service.js",
  "mobile/services/content-state.service.js",
  "mobile/components/discovery/UpdateBadge.vue",
  "mobile/components/discovery/DiscoverySection.vue",
  "mobile/components/discovery/NotificationListItem.vue",
  "mobile/components/discovery/InboxBadge.vue",
  "mobile/components/discovery/FilterChip.vue",
  "mobile/components/discovery/FollowChip.vue",
  "mobile/components/discovery/DigestCard.vue",
  "mobile/components/discovery/ResumeCard.vue"
];

const requiredScenarios = [
  "s11_new_publish_batch",
  "s12_followed_topic_alert",
  "s13_inbox_digest",
  "s14_revision_highlight",
  "s15_quiet_hours_and_dedupe"
];

requiredDocs.forEach(requireFile);
requiredSurfaces.forEach(requireFile);
requiredMobile.forEach(requireFile);

const scenarioIndex = readJson("fixtures/test-inputs/manifests/scenario-index.json");
requiredScenarios.forEach((scenarioId) => {
  expect(scenarioIndex.scenario_ids.includes(scenarioId), `SCENARIO_INDEX_MISSING:${scenarioId}`);
  requireFile(`fixtures/test-inputs/scenarios/${scenarioId}/scenario.meta.json`);
  requireFile(`fixtures/test-inputs/scenarios/${scenarioId}/expected-outcomes.json`);
});

const backendRegistry = fs.readFileSync(requireFile("backend/contracts/surfaces.mjs"), "utf8");
[
  "home-discovery",
  "search-content",
  "follow-catalog",
  "notification-inbox",
  "notification-prefs",
  "content-resume",
  "publish-batch-summary"
].forEach((surface) => expect(backendRegistry.includes(surface), `SURFACE_REGISTRY_MISSING:${surface}`));

const runtimeGatewayText = fs.readFileSync(requireFile("mobile/services/runtime-gateway.service.js"), "utf8");
[
  "getHomeDiscovery",
  "searchContent",
  "getFollowCatalog",
  "getNotificationInbox",
  "getNotificationPrefs",
  "getContentResume",
  "saveForLater",
  "getPublishBatchSummary"
].forEach((symbol) => expect(runtimeGatewayText.includes(symbol), `MOBILE_GATEWAY_MISSING:${symbol}`));

const pagesJson = readJson("mobile/pages.json");
["pages/inbox/index", "pages/search/index", "pages/follows/index"].forEach((pagePath) =>
  expect((pagesJson.pages || []).some((page) => page.path === pagePath), `PAGE_ROUTE_MISSING:${pagePath}`)
);

const generatedRegistryText = fs.readFileSync(requireFile("admin/src/modules/generated/generated-registry.js"), "utf8");
["publish_batches", "notification_campaigns"].forEach((resource) =>
  expect(generatedRegistryText.includes(resource), `ADMIN_GENERATED_MISSING:${resource}`)
);

const manualRegistryText = fs.readFileSync(requireFile("admin/src/modules/manual/manual-registry.js"), "utf8");
[
  "publish_batch_preview",
  "notification_template_preview",
  "quiet_hours_dedupe_inspector",
  "discovery_rule_inspector"
].forEach((moduleKey) => expect(manualRegistryText.includes(moduleKey), `ADMIN_MANUAL_MISSING:${moduleKey}`));

console.log(
  JSON.stringify(
    {
      status: "ok",
      stage: "F1",
      checked_docs: requiredDocs.length,
      checked_surfaces: requiredSurfaces.length,
      checked_mobile_files: requiredMobile.length,
      checked_scenarios: requiredScenarios
    },
    null,
    2
  )
);
