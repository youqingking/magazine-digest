import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHybridBackendRuntime, createLocalBackendRuntime, createRemoteBackendRuntime } from "../../backend/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h0");
const outFile = path.join(outDir, "smoke-stage-h0.json");

fs.mkdirSync(outDir, { recursive: true });

function sampleRuntime(runtime, mode) {
  const productKey = runtime.runtimeConfig.productKey;

  return {
    mode,
    auth_session: runtime.surfaces["auth-session"]({
      product_key: productKey,
      user_id: "user_local_stage_e0"
    }),
    register_device: runtime.surfaces["register-device"]({
      product_key: productKey,
      installation_id: "inst_h0_smoke_001",
      device_id: "device_h0_smoke_001",
      push_clientid: mode === "local" ? null : "cid_h0_smoke_001",
      appid: "demo-mobile-app",
      last_seen_at: "2026-03-18T00:00:00+08:00"
    }),
    push_capability: runtime.surfaces["push-capability"]({
      product_key: productKey,
      installation_id: "inst_h0_smoke_001",
      push_clientid: mode === "local" ? null : "cid_h0_smoke_001",
      permission_state: mode === "local" ? "prompt" : "granted"
    }),
    delivery_preview: runtime.surfaces["notification-delivery-preview"]({
      product_key: productKey,
      user_id: "user_local_stage_e0",
      quiet_hours_active: mode === "local",
      dedupe_hit: mode === "hybrid",
      force_digest: mode === "remote",
      notification_inbox_id: "inbox_h0_smoke_001"
    })
  };
}

function inspectH0_5Readiness() {
  const settingsText = fs.readFileSync(path.join(repoRoot, "mobile", "pages", "settings", "index.vue"), "utf8");
  const authTestText = fs.readFileSync(path.join(repoRoot, "mobile", "pages", "auth-test", "index.vue"), "utf8");
  const deviceServiceText = fs.readFileSync(path.join(repoRoot, "mobile", "services", "device.service.js"), "utf8");

  return {
    diagnostics_card_ready: settingsText.includes("DeviceDiagnosticCard") && authTestText.includes("DeviceDiagnosticCard"),
    stable_toasts_ready:
      authTestText.includes("AUTH_EXPIRED_RELOGIN_REQUIRED") &&
      authTestText.includes("DEVICE_SYNC_REMOTE_FAILED") &&
      settingsText.includes("PUSH_CID_MISSING"),
    device_precheck_ready:
      deviceServiceText.includes("precheck_blocked") &&
      deviceServiceText.includes("attempted_with_cid") &&
      deviceServiceText.includes("last_remote_error")
  };
}

const report = {
  status: "ok",
  generated_at: new Date().toISOString(),
  h0_5_readiness: inspectH0_5Readiness(),
  runtimes: {
    local: sampleRuntime(createLocalBackendRuntime(), "local"),
    hybrid: sampleRuntime(createHybridBackendRuntime(), "hybrid"),
    remote: sampleRuntime(createRemoteBackendRuntime(), "remote")
  }
};

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
