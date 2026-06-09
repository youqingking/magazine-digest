import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const mobileProjectRoot = path.join(repoRoot, "mobile");
const outDir = path.join(repoRoot, "output", "stage-h0_5-hbuilderx");
const outFile = path.join(outDir, "android-compile.json");

fs.mkdirSync(outDir, { recursive: true });

function writeReport(report) {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

function firstExistingPath(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "";
}

function normalizeRootCandidate(candidate) {
  if (!candidate) {
    return "";
  }
  if (/\.exe$/i.test(candidate)) {
    return path.dirname(candidate);
  }
  return candidate;
}

function resolveHBuilderXCliPath() {
  const rootCandidates = [
    process.env.H0_5_HBUILDERX_ROOT,
    normalizeRootCandidate(process.env.HBUILDERX_CLI_PATH),
    normalizeRootCandidate(process.env.HBUILDERX_EXE),
    normalizeRootCandidate(process.env.HBUILDERX_PATH),
    "D:/HBuilderX0",
    "D:/HBuilderX",
    "C:/Program Files/HBuilderX",
    "C:/Program Files (x86)/HBuilderX",
    "D:/Program Files/HBuilderX"
  ];

  const cliCandidates = [
    process.env.HBUILDERX_CLI_PATH,
    ...rootCandidates.map((root) => (root ? path.join(root, "cli.exe") : ""))
  ];

  return firstExistingPath(cliCandidates);
}

function resolveAdbPath() {
  return firstExistingPath([
    process.env.ADB_PATH,
    "D:/Program Files/Netease/MuMu/nx_main/adb.exe",
    "adb"
  ]);
}

function run(executable, args, options = {}) {
  return execFileSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
    ...options
  });
}

const cliPath = resolveHBuilderXCliPath();
const adbPath = resolveAdbPath();

if (!cliPath) {
  writeReport({
    status: "blocked",
    layer: "hbuilderx_android_compile",
    blocking_reason: "HBUILDERX_CLI_MISSING",
    hbuilderx_cli_path: null,
    adb_path: adbPath || null
  });
  process.exit(0);
}

try {
  const cliVersion = run(cliPath, ["version"]).trim();
  const projectList = run(cliPath, ["project", "list"]).trim();
  let deviceList = "";
  let adbDevices = "";

  try {
    deviceList = run(cliPath, ["devices", "list", "--platform", "android"]).trim();
  } catch (error) {
    deviceList = error.message || "HBUILDERX_DEVICES_LIST_FAILED";
  }

  if (adbPath) {
    try {
      adbDevices = run(adbPath, ["devices"]).trim();
    } catch (error) {
      adbDevices = error.message || "ADB_DEVICES_FAILED";
    }
  }

  const compileOutput = run(cliPath, [
    "launch",
    "app-android",
    "--project",
    mobileProjectRoot,
    "--compile",
    "true",
    "--continue-on-error",
    "true"
  ]);

  const compileLines = compileOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const compileSucceeded = compileLines.some((line) => line.includes("编译成功"));

  writeReport({
    status: compileSucceeded ? "ok" : "blocked",
    layer: "hbuilderx_android_compile",
    blocking_reason: compileSucceeded ? "" : "HBUILDERX_ANDROID_COMPILE_FAILED",
    hbuilderx_cli_path: cliPath,
    adb_path: adbPath || null,
    cli_version: cliVersion,
    project_list: projectList.split(/\r?\n/).filter(Boolean),
    android_devices_raw: deviceList,
    adb_devices_raw: adbDevices,
    compile_succeeded: compileSucceeded,
    compile_log_tail: compileLines.slice(-40)
  });
} catch (error) {
  writeReport({
    status: "blocked",
    layer: "hbuilderx_android_compile",
    blocking_reason: error.message || "HBUILDERX_ANDROID_COMPILE_FAILED",
    hbuilderx_cli_path: cliPath,
    adb_path: adbPath || null
  });
}
