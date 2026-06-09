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

function readFile(relativePath) {
  return fs.readFileSync(requireFile(relativePath), "utf8");
}

[
  "docs/H0_ACCEPTANCE.md",
  "docs/STAGE_H0_DECISIONS.md",
  "docs/REMOTE_RUNTIME_FOUNDATION.md",
  "docs/IDENTITY_AND_DEVICE_FOUNDATION.md",
  "docs/PUSH_FOUNDATION.md",
  "docs/REMOTE_ENVIRONMENT_CHECKLIST.md",
  "docs/MANUAL_REMOTE_SETUP_STEPS.md"
].forEach(requireFile);

[
  "backend/config/remote-runtime-config.mjs",
  "backend/adapters/remote-runtime-adapter.mjs",
  "backend/adapters/local-runtime-adapter.mjs",
  "backend/runtime/runtime-mode-selector.mjs",
  "backend/surfaces/register-device.mjs",
  "backend/surfaces/push-capability.mjs",
  "backend/surfaces/notification-delivery-preview.mjs",
  "backend/surfaces/auth-session.mjs",
  "backend/surfaces/auth-refresh.mjs",
  "backend/surfaces/auth-signout.mjs",
  "mobile/services/auth.service.js",
  "mobile/services/device.service.js",
  "mobile/services/push.service.js",
  "mobile/stores/auth.store.js",
  "mobile/stores/runtime.store.js",
  "mobile/components/account/AuthStateCard.vue",
  "mobile/components/account/DeviceStateCard.vue",
  "mobile/components/account/PushStateCard.vue",
  "mobile/components/account/DeviceDiagnosticCard.vue",
  "mobile/pages/auth-test/index.vue",
  "mobile/uniCloud-aliyun/cloudfunctions/device-sync-co/index.obj.js",
  "mobile/uniCloud-aliyun/cloudfunctions/device-sync-co/package.json",
  "scripts/bootstrap/smoke-stage-h0.mjs",
  "scripts/bootstrap/smoke-stage-h0.ps1",
  "scripts/contracts/validate-h0_5-device-readiness.mjs",
  "scripts/contracts/validate-h0_5-device-readiness.ps1",
  "scripts/contracts/validate-stage-h0.ps1"
].forEach(requireFile);

const backendRegistryText = readFile("backend/contracts/surfaces.mjs");
["auth-session", "auth-refresh", "auth-signout", "register-device", "push-capability", "notification-delivery-preview"].forEach(
  (surface) => expect(backendRegistryText.includes(surface), `SURFACE_REGISTRY_MISSING:${surface}`)
);

const runtimeGatewayText = readFile("mobile/services/runtime-gateway.service.js");
[
  "getAuthSession",
  "refreshAuthSession",
  "signOutAuthSession",
  "registerDevice",
  "getPushCapability",
  "getNotificationDeliveryPreview"
].forEach((symbol) => expect(runtimeGatewayText.includes(symbol), `MOBILE_GATEWAY_MISSING:${symbol}`));

const settingsPageText = readFile("mobile/pages/settings/index.vue");
["hybrid", "AuthStateCard", "DeviceStateCard", "PushStateCard", "DeviceDiagnosticCard"].forEach((symbol) =>
  expect(settingsPageText.includes(symbol), `SETTINGS_FOUNDATION_MISSING:${symbol}`)
);

const profilePageText = readFile("mobile/pages/profile/index.vue");
["AuthStateCard", "DeviceStateCard", "DeviceDiagnosticCard", "auth_session_open"].forEach((symbol) =>
  expect(profilePageText.includes(symbol), `PROFILE_FOUNDATION_MISSING:${symbol}`)
);

const authTestPageText = readFile("mobile/pages/auth-test/index.vue");
[
  "AUTH_TEST_PAGE_READY",
  "DeviceDiagnosticCard",
  "AUTH_EXPIRED_RELOGIN_REQUIRED",
  "PUSH_CID_MISSING",
  "DEVICE_SYNC_REMOTE_FAILED",
  "DEVICE_SYNC_OK"
].forEach((symbol) => expect(authTestPageText.includes(symbol), `AUTH_TEST_FOUNDATION_MISSING:${symbol}`));

const deviceServiceText = readFile("mobile/services/device.service.js");
[
  "precheck_blocked",
  "AUTH_EXPIRED_RELOGIN_REQUIRED",
  "PUSH_CID_MISSING",
  "setAuthDeviceDiagnostics",
  "attempted_with_cid"
].forEach((symbol) => expect(deviceServiceText.includes(symbol), `DEVICE_SERVICE_MISSING:${symbol}`));

const inboxPageText = readFile("mobile/pages/inbox/index.vue");
["Inbox truth durable", "push_delivery_preview"].forEach((symbol) =>
  expect(inboxPageText.includes(symbol), `INBOX_FOUNDATION_MISSING:${symbol}`)
);

const feedPageText = readFile("mobile/pages/feed/index.vue");
["lastVisibleStatus", "runtimeMeta"].forEach((symbol) => expect(feedPageText.includes(symbol), `FEED_FOUNDATION_MISSING:${symbol}`));

const adminGenerated = readFile("admin/src/modules/generated/generated-registry.js");
["notification_deliveries", "device_installations"].forEach((resource) =>
  expect(adminGenerated.includes(resource), `ADMIN_GENERATED_MISSING:${resource}`)
);

const adminManual = readFile("admin/src/modules/manual/manual-registry.js");
[
  "runtime_mode_inspector",
  "push_capability_inspector",
  "delivery_preview_inspector",
  "auth_session_config_inspector"
].forEach((moduleKey) => expect(adminManual.includes(moduleKey), `ADMIN_MANUAL_MISSING:${moduleKey}`));

const eventContractText = readFile("mobile/contracts/runtime-contract.js");
[
  "auth_session_open",
  "auth_signin_placeholder",
  "auth_signout",
  "device_register",
  "push_capability_refresh",
  "push_delivery_preview",
  "runtime_mode_switch",
  "remote_adapter_fallback",
  "remote_adapter_error"
].forEach((eventName) => expect(eventContractText.includes(eventName), `EVENT_MISSING:${eventName}`));

console.log(
  JSON.stringify(
    {
      status: "ok",
      stage: "H0",
      checked_surfaces: 6,
      checked_mobile_foundations: 6,
      checked_admin_foundations: 4,
      checked_events: 9
    },
    null,
    2
  )
);
