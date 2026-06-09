import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h0_5-android");
const outFile = path.join(outDir, "android-device-smoke.json");

fs.mkdirSync(outDir, { recursive: true });

function writeReport(report) {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

const adbPath = process.env.ADB_PATH || "adb";
const configuredPackageName = process.env.H0_5_ANDROID_PACKAGE || "";
const activityName = process.env.H0_5_ANDROID_ACTIVITY || "";
const targetSerial = process.env.H0_5_ANDROID_SERIAL || "";

function listThirdPartyPackages(adbExecutable, serial) {
  const packageOutput = execFileSync(adbExecutable, ["-s", serial, "shell", "cmd", "package", "list", "packages", "-3"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });

  return packageOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("package:"))
    .map((line) => line.slice("package:".length));
}

try {
  const deviceList = execFileSync(adbPath, ["devices"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const connectedDevices = deviceList
    .split(/\r?\n/)
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split("\t")[0]);

  if (connectedDevices.length === 0) {
    writeReport({
      status: "blocked",
      layer: "android_device_smoke",
      blocking_reason: "ADB_DEVICE_MISSING",
      connected_devices: []
    });
    process.exit(0);
  }

  if (targetSerial && !connectedDevices.includes(targetSerial)) {
    writeReport({
      status: "blocked",
      layer: "android_device_smoke",
      blocking_reason: "ADB_TARGET_DEVICE_MISSING",
      target_serial: targetSerial,
      connected_devices: connectedDevices
    });
    process.exit(0);
  }

  const selectedSerial = targetSerial || connectedDevices[0];
  const adbBaseArgs = ["-s", selectedSerial];
  const detectedPackages = listThirdPartyPackages(adbPath, selectedSerial);
  const packageName = configuredPackageName || (detectedPackages.length === 1 ? detectedPackages[0] : "");

  if (!packageName) {
    writeReport({
      status: "blocked",
      layer: "android_device_smoke",
      blocking_reason: "ANDROID_PACKAGE_UNRESOLVED",
      target_serial: selectedSerial,
      connected_devices: connectedDevices,
      detected_packages: detectedPackages
    });
    process.exit(0);
  }

  const launchArgs = activityName
    ? [...adbBaseArgs, "shell", "am", "start", "-n", `${packageName}/${activityName}`]
    : [...adbBaseArgs, "shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"];
  const launchOutput = execFileSync(adbPath, launchArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const logcatOutput = execFileSync(adbPath, [...adbBaseArgs, "logcat", "-d", "-t", "120"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });

  writeReport({
    status: "ok",
    layer: "android_device_smoke",
    target_serial: selectedSerial,
    connected_devices: connectedDevices,
    detected_packages: detectedPackages,
    package_name: packageName,
    launch_output: launchOutput.trim(),
    collected_log_lines: logcatOutput.split(/\r?\n/).slice(-20),
    blocking_reason: ""
  });
} catch (error) {
  writeReport({
    status: "blocked",
    layer: "android_device_smoke",
    blocking_reason: error.message || "ADB_UNAVAILABLE",
    connected_devices: []
  });
}
