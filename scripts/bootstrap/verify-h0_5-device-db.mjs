import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h0_5-db");
const outFile = path.join(outDir, "device-db-verification.json");

fs.mkdirSync(outDir, { recursive: true });

function emit(report) {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const customCommand = process.env.H0_5_DB_VERIFY_COMMAND;

if (!customCommand) {
  const androidUiSmoke = readJson("output/stage-h0_5-android-ui/android-device-ui-smoke.json");
  const automationSummary = androidUiSmoke?.automation_summary || "";

  if (
    androidUiSmoke?.status === "ok" &&
    /\bdb=ok\b/.test(automationSummary) &&
    /\bdevice_found=yes\b/.test(automationSummary) &&
    /\buser_device_found=yes\b/.test(automationSummary)
  ) {
    emit({
      status: "ok",
      layer: "db_verification",
      blocking_reason: "",
      source: "android_device_ui_smoke",
      device_found: true,
      user_device_found: true,
      device_id: "verified_in_android_ui",
      push_clientid: null,
      appid: null,
      updated_at: null,
      uid: automationSummary.match(/\buid=([^\s]+)/)?.[1] || null
    });
    process.exit(0);
  }

  emit({
    status: "blocked",
    layer: "db_verification",
    blocking_reason: "H0_5_DB_VERIFY_COMMAND_MISSING",
    device_found: false,
    user_device_found: false,
    device_id: null,
    push_clientid: null,
    appid: null,
    updated_at: null,
    uid: null
  });
  process.exit(0);
}

try {
  const raw = execSync(customCommand, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  const parsed = JSON.parse(raw);
  emit({
    status: "ok",
    layer: "db_verification",
    blocking_reason: "",
    device_found: Boolean(parsed.device_found),
    user_device_found: Boolean(parsed.user_device_found),
    device_id: parsed.device_id || null,
    push_clientid: parsed.push_clientid || null,
    appid: parsed.appid || null,
    updated_at: parsed.updated_at || null,
    uid: parsed.uid || null
  });
} catch (error) {
  emit({
    status: "blocked",
    layer: "db_verification",
    blocking_reason: error.message || "DB_VERIFICATION_FAILED",
    device_found: false,
    user_device_found: false,
    device_id: null,
    push_clientid: null,
    appid: null,
    updated_at: null,
    uid: null
  });
}
