import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h0_5-readiness");
const outFile = path.join(outDir, "device-readiness.json");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  expect(fs.existsSync(fullPath), `MISSING:${relativePath}`);
  return fs.readFileSync(fullPath, "utf8");
}

const settingsText = read("mobile/pages/settings/index.vue");
const authTestText = read("mobile/pages/auth-test/index.vue");
const profileText = read("mobile/pages/profile/index.vue");
const authServiceText = read("mobile/services/auth.service.js");
const deviceServiceText = read("mobile/services/device.service.js");
const diagnosticCardText = read("mobile/components/account/DeviceDiagnosticCard.vue");
const deviceSyncCoText = read("mobile/uniCloud-aliyun/cloudfunctions/device-sync-co/index.obj.js");

[
  "AUTH_EXPIRED_RELOGIN_REQUIRED",
  "PUSH_CID_MISSING",
  "DEVICE_SYNC_REMOTE_FAILED",
  "DEVICE_SYNC_OK",
  "DeviceDiagnosticCard",
  "Copy diagnostic summary"
].forEach((symbol) => {
  expect(
    settingsText.includes(symbol) || authTestText.includes(symbol) || profileText.includes(symbol) || diagnosticCardText.includes(symbol),
    `READINESS_MISSING:${symbol}`
  );
});

["token_state", "source", "session_state"].forEach((symbol) =>
  expect(authServiceText.includes(symbol), `AUTH_READINESS_MISSING:${symbol}`)
);

[
  "precheck_blocked",
  "fallback_after_remote_error",
  "attempted_with_cid",
  "cloud_method",
  "last_remote_error",
  "last_attempt_at",
  "device-sync-co"
].forEach((symbol) => expect(deviceServiceText.includes(symbol), `DEVICE_READINESS_MISSING:${symbol}`));

["registerDevice", "opendb-device", "uni-id-device"].forEach((symbol) =>
  expect(deviceSyncCoText.includes(symbol), `DEVICE_SYNC_CO_MISSING:${symbol}`)
);

fs.mkdirSync(outDir, { recursive: true });

const report = {
  status: "ok",
  stage: "H0.5",
  readiness: "device-wiring",
  checked_pages: 3,
  checked_services: 2,
  checked_component: 1,
  checked_cloudobjects: 1,
  blocking_reason: ""
};

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
