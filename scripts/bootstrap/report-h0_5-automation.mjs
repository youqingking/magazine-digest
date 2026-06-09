import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h0_5");
const outFile = path.join(outDir, "automation-report.json");

fs.mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return {
      status: "missing",
      blocking_reason: `MISSING:${relativePath}`
    };
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const readiness = readJson("output/stage-h0_5-readiness/device-readiness.json");
const h5Smoke = readJson("output/stage-h0_5-h5/device-diagnostics-report.json");
const hbuilderxCompile = readJson("output/stage-h0_5-hbuilderx/android-compile.json");
const androidSmoke = readJson("output/stage-h0_5-android/android-device-smoke.json");
const androidUiSmoke = readJson("output/stage-h0_5-android-ui/android-device-ui-smoke.json");
const dbVerification = readJson("output/stage-h0_5-db/device-db-verification.json");
const skipH5 = ["1", "true", "yes"].includes(String(process.env.H0_5_SKIP_H5 || "").toLowerCase());

const consideredEntries = skipH5
  ? [readiness, hbuilderxCompile, androidSmoke, androidUiSmoke, dbVerification]
  : [readiness, h5Smoke, hbuilderxCompile, androidSmoke, androidUiSmoke, dbVerification];

const blockingReasons = consideredEntries
  .map((entry) => entry.blocking_reason)
  .filter(Boolean);

const report = {
  generated_at: new Date().toISOString(),
  status: blockingReasons.length ? "needs_attention" : "ok",
  contract_readiness: readiness,
  h5_smoke: {
    ...h5Smoke,
    considered_in_status: !skipH5
  },
  hbuilderx_android_compile: hbuilderxCompile,
  android_device_smoke: androidSmoke,
  android_device_ui_smoke: androidUiSmoke,
  db_verification: dbVerification,
  blocking_reason: blockingReasons[0] || ""
};

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
