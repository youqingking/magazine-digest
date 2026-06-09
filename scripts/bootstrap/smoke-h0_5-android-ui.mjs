import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const mobileProjectRoot = path.join(repoRoot, "mobile");
const outDir = path.join(repoRoot, "output", "stage-h0_5-android-ui");
const outFile = path.join(outDir, "android-device-ui-smoke.json");
const runLogSuffix = String(Date.now());
const runStdoutPath = path.join(outDir, `hbuilderx-run.${runLogSuffix}.stdout.log`);
const runStderrPath = path.join(outDir, `hbuilderx-run.${runLogSuffix}.stderr.log`);

fs.mkdirSync(outDir, { recursive: true });

const adbPath = process.env.ADB_PATH || "adb";
const configuredPackageName = process.env.H0_5_ANDROID_PACKAGE || "";
const targetSerial = process.env.H0_5_ANDROID_SERIAL || "";
const username = process.env.H0_5_TEST_USERNAME || "qqqq";
const password = process.env.H0_5_TEST_PASSWORD || "1111qqqq";

const coords = {
  authTestScroll: { startX: 960, startY: 930, endX: 960, endY: 500, durationMs: 280 }
};

function writeReport(report) {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

function firstExistingPath(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    if (candidate === "adb") {
      return candidate;
    }
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

  return firstExistingPath([
    process.env.HBUILDERX_CLI_PATH,
    ...rootCandidates.map((root) => (root ? path.join(root, "cli.exe") : ""))
  ]);
}

function runAdb(args, options = {}) {
  return execFileSync(adbPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...options
  });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function listConnectedDevices() {
  const deviceList = runAdb(["devices"]);
  return deviceList
    .split(/\r?\n/)
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split("\t")[0]);
}

function listThirdPartyPackages(serial) {
  const packageOutput = runAdb(["-s", serial, "shell", "cmd", "package", "list", "packages", "-3"]);
  return packageOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("package:"))
    .map((line) => line.slice("package:".length));
}

function captureScreen(serial, name) {
  const destination = path.join(outDir, `${name}.png`);
  const binary = execFileSync(adbPath, ["-s", serial, "exec-out", "screencap", "-p"], {
    cwd: repoRoot,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024
  });
  fs.writeFileSync(destination, binary);
  return destination;
}

function dumpUi(serial, name) {
  const remotePath = `/sdcard/${name}.xml`;
  runAdb(["-s", serial, "shell", "uiautomator", "dump", remotePath]);
  const localPath = path.join(outDir, `${name}.xml`);
  runAdb(["-s", serial, "pull", remotePath, localPath]);
  return localPath;
}

function readUiDump(serial, name) {
  return fs.readFileSync(dumpUi(serial, name), "utf8");
}

function dumpContainsText(serial, name, text) {
  return readUiDump(serial, name).includes(text);
}

function tap(serial, point) {
  runAdb(["-s", serial, "shell", "input", "tap", String(point.x), String(point.y)]);
}

function swipe(serial, action) {
  runAdb([
    "-s",
    serial,
    "shell",
    "input",
    "swipe",
    String(action.startX),
    String(action.startY),
    String(action.endX),
    String(action.endY),
    String(action.durationMs)
  ]);
}

function inputText(serial, value) {
  runAdb(["-s", serial, "shell", "input", "text", value]);
}

function pressBack(serial) {
  runAdb(["-s", serial, "shell", "input", "keyevent", "4"]);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findTextBounds(uiText, label) {
  const matcher = new RegExp(`text="${escapeRegex(label)}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
  const match = uiText.match(matcher);
  if (!match) {
    return null;
  }

  const left = Number(match[1]);
  const top = Number(match[2]);
  const right = Number(match[3]);
  const bottom = Number(match[4]);

  if (![left, top, right, bottom].every(Number.isFinite)) {
    return null;
  }

  return {
    left,
    top,
    right,
    bottom,
    centerX: Math.round((left + right) / 2),
    centerY: Math.round((top + bottom) / 2)
  };
}

function findLabeledEditTextBounds(uiText, label) {
  const matcher = new RegExp(
    `text="${escapeRegex(label)}"[\\s\\S]{0,400}?class="android\\.widget\\.EditText"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`
  );
  const match = uiText.match(matcher);
  if (!match) {
    return null;
  }

  const left = Number(match[1]);
  const top = Number(match[2]);
  const right = Number(match[3]);
  const bottom = Number(match[4]);

  return {
    left,
    top,
    right,
    bottom,
    centerX: Math.round((left + right) / 2),
    centerY: Math.round((top + bottom) / 2)
  };
}

function tapByVisibleText(serial, name, label) {
  const uiText = readUiDump(serial, name);
  const bounds = findTextBounds(uiText, label);

  if (!bounds) {
    return {
      tapped: false,
      uiText,
      bounds: null
    };
  }

  tap(serial, {
    x: bounds.centerX,
    y: bounds.centerY
  });

  return {
    tapped: true,
    uiText,
    bounds
  };
}

function waitForDumpText(serial, text, timeoutMs = 180000, intervalMs = 2500) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const uiText = readUiDump(serial, `wait-${text.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
    if (uiText.includes(text)) {
      return {
        matched: true,
        uiText
      };
    }
    sleep(intervalMs);
  }

  return {
    matched: false,
    uiText: ""
  };
}

function parseAutomationSummary(uiText) {
  const match = uiText.match(/AUTOMATION_SUMMARY[^\r\n<"]+/);
  return match ? match[0].trim() : "";
}

function tailFile(filePath, count = 120) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-count);
}

function startHBuilderXRun(serial, cliPath) {
  const stdout = fs.openSync(runStdoutPath, "a");
  const stderr = fs.openSync(runStderrPath, "a");
  const child = spawn(
    cliPath,
    [
      "launch",
      "app-android",
      "--project",
      mobileProjectRoot,
      "--deviceId",
      serial,
      "--playground",
      "standard",
      "--pagePath",
      "pages/auth-test/index",
      "--pageQuery",
      `automation_mode=full&automation_username=${username}&automation_password=${password}`
    ],
    {
      cwd: repoRoot,
      detached: false,
      stdio: ["ignore", stdout, stderr]
    }
  );

  return child;
}

function waitForHBuilderMarker(marker, timeoutMs = 420000, intervalMs = 3000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const stdoutTail = tailFile(runStdoutPath, 160).join("\n");
    const stderrTail = tailFile(runStderrPath, 60).join("\n");
    if (stdoutTail.includes(marker) || stderrTail.includes(marker)) {
      return true;
    }
    sleep(intervalMs);
  }

  return false;
}

function waitForAutomationSummary(serial, timeoutMs = 180000, intervalMs = 3000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const uiText = readUiDump(serial, "wait-automation-summary");
    const summary = parseAutomationSummary(uiText);
    if (summary && !/\blogin=idle\b/.test(summary) && !/\bdb=idle\b/.test(summary)) {
      return {
        matched: true,
        uiText,
        summary
      };
    }
    sleep(intervalMs);
  }

  return {
    matched: false,
    uiText: "",
    summary: ""
  };
}

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        cwd: repoRoot,
        stdio: "ignore"
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch (error) {
  }
}

function ensureVisibleLoginSection(serial, steps) {
  swipe(serial, coords.authTestScroll);
  sleep(1200);
  steps.push({
    step: "scroll_to_login_form",
    screenshot: path.basename(captureScreen(serial, "02-login-form"))
  });
}

function fillCredentialFields(serial, steps) {
  const usernameUi = readUiDump(serial, "03-username-field");
  const usernameBounds = findLabeledEditTextBounds(usernameUi, "Test username");
  if (!usernameBounds) {
    throw new Error("USERNAME_FIELD_MISSING");
  }
  tap(serial, {
    x: usernameBounds.centerX,
    y: usernameBounds.centerY
  });
  sleep(500);
  inputText(serial, username);
  sleep(500);
  const passwordUi = readUiDump(serial, "03-password-field");
  const passwordBounds = findLabeledEditTextBounds(passwordUi, "Test password");
  if (!passwordBounds) {
    throw new Error("PASSWORD_FIELD_MISSING");
  }
  tap(serial, {
    x: passwordBounds.centerX,
    y: passwordBounds.centerY
  });
  sleep(500);
  inputText(serial, password);
  sleep(900);

  steps.push({
    step: "fill_credentials",
    screenshot: path.basename(captureScreen(serial, "03-credentials-filled")),
    bounds: {
      username: usernameBounds,
      password: passwordBounds
    }
  });
}

function tapVisibleButton(serial, label, dumpName, screenshotName, steps) {
  const result = tapByVisibleText(serial, dumpName, label);

  if (!result.tapped) {
    steps.push({
      step: `missing_${label}`,
      screenshot: path.basename(captureScreen(serial, screenshotName))
    });
    return false;
  }

  sleep(1800);
  steps.push({
    step: label,
    screenshot: path.basename(captureScreen(serial, screenshotName)),
    bounds: result.bounds
  });
  return true;
}

let runProcess = null;

try {
  const connectedDevices = listConnectedDevices();

  if (connectedDevices.length === 0) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "ADB_DEVICE_MISSING",
      connected_devices: []
    });
    process.exit(0);
  }

  if (targetSerial && !connectedDevices.includes(targetSerial)) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "ADB_TARGET_DEVICE_MISSING",
      target_serial: targetSerial,
      connected_devices: connectedDevices
    });
    process.exit(0);
  }

  const selectedSerial = targetSerial || connectedDevices[0];
  const detectedPackages = listThirdPartyPackages(selectedSerial);
  const cliPath = resolveHBuilderXCliPath();
  const packageName = configuredPackageName || (detectedPackages.length === 1 ? detectedPackages[0] : "");

  if (!cliPath) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "HBUILDERX_CLI_MISSING",
      target_serial: selectedSerial,
      connected_devices: connectedDevices,
      detected_packages: detectedPackages
    });
    process.exit(0);
  }

  const steps = [];

  runProcess = startHBuilderXRun(selectedSerial, cliPath);
  const runReady = waitForHBuilderMarker("应用【mobile】已启动");

  if (!runReady) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "HBUILDERX_APP_LAUNCH_TIMEOUT",
      target_serial: selectedSerial,
      connected_devices: connectedDevices,
      detected_packages: detectedPackages,
      package_name: packageName || "io.dcloud.HBuilder",
      hbuilderx_cli_path: cliPath,
      hbuilderx_stdout_tail: tailFile(runStdoutPath, 120),
      hbuilderx_stderr_tail: tailFile(runStderrPath, 80)
    });
    process.exit(0);
  }

  const authPageReady = waitForDumpText(selectedSerial, "AUTH_TEST_PAGE_READY", 120000, 3000);

  if (!authPageReady.matched) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "AUTH_TEST_PAGE_NOT_READY",
      target_serial: selectedSerial,
      connected_devices: connectedDevices,
      detected_packages: detectedPackages,
      package_name: packageName || "io.dcloud.HBuilder",
      hbuilderx_cli_path: cliPath,
      hbuilderx_stdout_tail: tailFile(runStdoutPath, 120),
      hbuilderx_stderr_tail: tailFile(runStderrPath, 80)
    });
    process.exit(0);
  }

  steps.push({
    step: "launch_auth_test_page",
    screenshot: path.basename(captureScreen(selectedSerial, "01-auth-test-ready"))
  });

  steps.push({
    step: "await_automation_summary",
    screenshot: path.basename(captureScreen(selectedSerial, "02-await-automation"))
  });

  const automationResult = waitForAutomationSummary(selectedSerial, 240000, 4000);
  if (!automationResult.matched) {
    writeReport({
      status: "blocked",
      layer: "android_device_ui_smoke",
      blocking_reason: "AUTOMATION_SUMMARY_TIMEOUT",
      target_serial: selectedSerial,
      connected_devices: connectedDevices,
      detected_packages: detectedPackages,
      package_name: packageName || "io.dcloud.HBuilder",
      hbuilderx_cli_path: cliPath,
      credentials_used: {
        username,
        password_present: Boolean(password)
      },
      steps,
      hbuilderx_stdout_tail: tailFile(runStdoutPath, 120),
      hbuilderx_stderr_tail: tailFile(runStderrPath, 80)
    });
    process.exit(0);
  }

  const finalUi = automationResult.uiText;
  const finalScreenshot = path.basename(captureScreen(selectedSerial, "03-final-ui"));
  const automationSummary = parseAutomationSummary(finalUi);
  const loginSuccess = /\blogin=success\b/.test(automationSummary);
  const dbOk = /\bdb=ok\b/.test(automationSummary);
  const deviceFound = /\bdevice_found=yes\b/.test(automationSummary);
  const userDeviceFound = /\buser_device_found=yes\b/.test(automationSummary);

  writeReport({
    status: loginSuccess && dbOk && deviceFound && userDeviceFound ? "ok" : "blocked",
    layer: "android_device_ui_smoke",
    target_serial: selectedSerial,
    connected_devices: connectedDevices,
    detected_packages: detectedPackages,
    package_name: packageName || "io.dcloud.HBuilder",
    hbuilderx_cli_path: cliPath,
    credentials_used: {
      username,
      password_present: Boolean(password)
    },
    steps,
    automation_summary: automationSummary,
    ui_summary: {
      has_auth_test_ready: finalUi.includes("AUTH_TEST_PAGE_READY"),
      has_auto_login: finalUi.includes("Auto login"),
      has_verify_device_records: finalUi.includes("Verify device records"),
      has_automation_summary: finalUi.includes("AUTOMATION_SUMMARY"),
      login_success: loginSuccess,
      db_verification_ok: dbOk,
      device_found: deviceFound,
      user_device_found: userDeviceFound
    },
    coordinates_used: coords,
    final_screenshot: finalScreenshot,
    hbuilderx_stdout_tail: tailFile(runStdoutPath, 120),
    hbuilderx_stderr_tail: tailFile(runStderrPath, 80),
    blocking_reason:
      loginSuccess && dbOk && deviceFound && userDeviceFound
        ? ""
        : automationSummary || "AUTOMATION_SUMMARY_MISSING_OR_INCOMPLETE"
  });
} catch (error) {
  writeReport({
    status: "blocked",
    layer: "android_device_ui_smoke",
    blocking_reason: error.message || "ANDROID_UI_SMOKE_FAILED",
    hbuilderx_stdout_tail: tailFile(runStdoutPath, 120),
    hbuilderx_stderr_tail: tailFile(runStderrPath, 80)
  });
} finally {
  stopProcess(runProcess);
}
