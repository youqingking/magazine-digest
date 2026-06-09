import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-h0_5-h5");
const reportPath = path.join(outputDir, "device-diagnostics-report.json");
const dbReportPath = path.join(repoRoot, "output", "stage-h0_5-db", "device-db-verification.json");
const screenshotPath = path.join(outputDir, "device-diagnostics.png");
const baseUrl = process.env.H5_SMOKE_URL || "http://localhost:8080/#/";
const username = process.env.H0_5_TEST_USERNAME || "qqqq";
const password = process.env.H0_5_TEST_PASSWORD || "1111qqqq";
const rootUrl = baseUrl.split("#")[0] || baseUrl;

function buildAutomationHash() {
  const query = new URLSearchParams({
    automation_mode: "full",
    automation_username: username,
    automation_password: password
  }).toString();

  return `#/pages/auth-test/index?${query}`;
}

function buildSettingsHash() {
  return "#/pages/settings/index";
}

async function waitForAutomationSummary(page, timeoutMs = 180000) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || "";
      const match = text.match(/AUTOMATION_SUMMARY[^\r\n]+/);
      return match && !/\blogin=idle\b/.test(match[0]);
    },
    null,
    { timeout: timeoutMs }
  );
}

async function ensureOutputDir() {
  await fsp.mkdir(outputDir, { recursive: true });
  await fsp.mkdir(path.dirname(dbReportPath), { recursive: true });
}

test("h0.5 device diagnostics smoke", async () => {
  test.setTimeout(180000);
  await ensureOutputDir();

  const browserLaunchOptions = {
    headless: true,
    args: ["--disable-dev-shm-usage"]
  };

  if (process.env.PLAYWRIGHT_CHROME_PATH) {
    browserLaunchOptions.executablePath = process.env.PLAYWRIGHT_CHROME_PATH;
  } else if (process.env.PLAYWRIGHT_BROWSER_CHANNEL) {
    browserLaunchOptions.channel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;
  }

  const browser = await chromium.launch(browserLaunchOptions);
  const page = await browser.newPage({
    viewport: { width: 430, height: 1600 }
  });

  const consoleEntries = [];
  page.on("console", (message) => {
    consoleEntries.push({
      type: message.type(),
      text: message.text()
    });
  });
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message || String(error));
  });

  await page.goto(rootUrl, {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 0, null, {
    timeout: 30000
  });

  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, buildSettingsHash());
  await page.waitForFunction(() => document.body && document.body.innerText.includes("Settings"), null, {
    timeout: 120000
  });

  const settingsText = await page.locator("body").innerText();
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, buildAutomationHash());
  await page.waitForFunction(() => document.body && document.body.innerText.includes("AUTH_TEST_PAGE_READY"), null, {
    timeout: 120000
  });
  await waitForAutomationSummary(page);

  const authTestText = await page.locator("body").innerText();
  const summaryLine = authTestText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("AUTOMATION_SUMMARY"));
  const hasUid = /uid=(?!none\b)/.test(summaryLine || "");
  const dbOk = /db=ok\b/.test(summaryLine || "");
  const deviceFound = /device_found=yes\b/.test(summaryLine || "");
  const userDeviceFound = /user_device_found=yes\b/.test(summaryLine || "");
  const loginFailed = /login=failed\b/.test(summaryLine || "");
  const loginError = (summaryLine?.match(/\blogin_error=([^\s]+)/) || [])[1] || "";

  const report = {
    generated_at: new Date().toISOString(),
    status:
      username && password && hasUid && dbOk && deviceFound && userDeviceFound
        ? "ok"
        : "blocked",
    blocking_reason:
      !username || !password
        ? "H0_5_TEST_CREDENTIALS_MISSING"
        : hasUid && dbOk && deviceFound && userDeviceFound
          ? ""
          : loginFailed
            ? loginError || "H5_LOGIN_FAILED"
            : dbOk
              ? "H5_DEVICE_DB_INCOMPLETE"
              : "H5_AUTOMATION_INCOMPLETE",
    settings_has_device_diagnostics: settingsText.includes("Device diagnostics"),
    settings_has_error_token: settingsText.includes("AUTH_EXPIRED_RELOGIN_REQUIRED") || settingsText.includes("PUSH_CID_MISSING"),
    auth_test_ready: authTestText.includes("AUTH_TEST_PAGE_READY"),
    auth_test_has_device_diagnostics: authTestText.includes("Device diagnostics"),
    auth_test_has_buttons:
      authTestText.includes("Register device") &&
      authTestText.includes("Register device / setPushCid") &&
      authTestText.includes("Refresh session") &&
      authTestText.includes("Auto login") &&
      authTestText.includes("Verify device records"),
    automation_summary: summaryLine || "",
    login_error: loginError || "",
    login_success: hasUid,
    db_verification_ok: dbOk,
    device_found: deviceFound,
    user_device_found: userDeviceFound,
    console_errors: consoleEntries.filter((entry) => entry.type === "error").map((entry) => entry.text),
    page_errors: pageErrors
  };

  const dbReport = {
    status: dbOk && deviceFound && userDeviceFound ? "ok" : "blocked",
    layer: "db_verification",
    blocking_reason:
      dbOk && deviceFound && userDeviceFound
        ? ""
        : username && password
          ? "DEVICE_DB_RECORDS_MISSING"
          : "H0_5_TEST_CREDENTIALS_MISSING",
    device_found: deviceFound,
    user_device_found: userDeviceFound,
    device_id: /device_found=yes\b/.test(summaryLine || "") ? "verified_in_ui" : null,
    push_clientid: null,
    appid: null,
    updated_at: null,
    uid: hasUid ? "verified_in_ui" : null
  };

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  await fsp.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  await fsp.writeFile(dbReportPath, JSON.stringify(dbReport, null, 2) + "\n", "utf8");
  await browser.close();

  expect(report.settings_has_device_diagnostics).toBeTruthy();
  expect(report.auth_test_ready).toBeTruthy();
  expect(report.auth_test_has_device_diagnostics).toBeTruthy();
  expect(report.auth_test_has_buttons).toBeTruthy();
  expect(username).toBeTruthy();
  expect(password).toBeTruthy();
  expect(report.status).toBe("ok");
});
