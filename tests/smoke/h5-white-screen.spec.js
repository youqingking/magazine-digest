import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-e1-h5");
const browserConsolePath = path.join(outputDir, "browser-console.json");
const pageErrorsPath = path.join(outputDir, "page-errors.json");
const reportPath = path.join(outputDir, "white-screen-report.json");
const screenshotPath = path.join(outputDir, "last-screenshot.png");
const baseUrl = process.env.H5_SMOKE_URL || "http://localhost:8080/#/";
const chromePath =
  process.env.PLAYWRIGHT_CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

function normalizeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null
  };
}

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

test("h5 white screen smoke", async () => {
  await ensureOutputDir();

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  const browserConsole = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", async (message) => {
    browserConsole.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(normalizeError(error));
  });

  page.on("requestfailed", (request) => {
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()
    });
  });

  let navigationError = null;

  try {
    await page.goto(baseUrl, {
      waitUntil: "networkidle",
      timeout: 30000
    });
  } catch (error) {
    navigationError = normalizeError(error);
  }

  await page.waitForTimeout(1500);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  const pageState = await page.evaluate(() => {
    const body = document.body;
    const appRoot = document.querySelector("#app");
    const uniAppRoot = document.querySelector("uni-app");
    const bodyText = (body?.innerText || "").trim();
    const visibleText = Array.from(document.querySelectorAll("body *"))
      .filter((node) => {
        const element = node;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const text = (element.textContent || "").trim();
        return (
          text.length > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || "1") !== 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean);

    const appChildren = appRoot ? appRoot.children.length : 0;
    const uniAppChildren = uniAppRoot ? uniAppRoot.children.length : 0;
    const appText = (appRoot?.textContent || "").trim();
    const appHtml = (appRoot?.innerHTML || "").trim();
    const uniAppText = (uniAppRoot?.textContent || "").trim();
    const firstVisibleTexts = visibleText.slice(0, 20);
    const sentinels = {
      feed: bodyText.includes("FEED_PAGE_READY"),
      detail: bodyText.includes("DETAIL_PAGE_READY"),
      paywall: bodyText.includes("PAYWALL_PAGE_READY"),
      settings: bodyText.includes("SETTINGS_PAGE_READY")
    };

    const domEmpty = !uniAppRoot && (!appRoot || appChildren === 0);
    const emptyContainerOnly =
      (Boolean(uniAppRoot) && uniAppChildren === 0 && uniAppText.length === 0) ||
      (Boolean(appRoot) && appChildren === 0 && appText.length === 0 && !uniAppRoot);
    const noVisibleText = firstVisibleTexts.length === 0;

    return {
      title: document.title,
      href: window.location.href,
      domEmpty,
      emptyContainerOnly,
      noVisibleText,
      bodyText,
      appChildren,
      uniAppChildren,
      appText,
      appHtml,
      uniAppText,
      firstVisibleTexts,
      sentinels
    };
  });

  let detailProbe = {
    status: "not_attempted",
    reason: "feed page remained blank"
  };

  if (!pageState.domEmpty && !pageState.noVisibleText) {
    try {
      const detailUrl = "http://localhost:8080/#/pages/detail/index?articleId=art_nebula_launch&readingMode=quick_30s";
      await page.goto(detailUrl, {
        waitUntil: "networkidle",
        timeout: 30000
      });
      await page.waitForTimeout(1000);
      const detailState = await page.evaluate(() => {
        const bodyText = (document.body?.innerText || "").trim();
        return {
          href: window.location.href,
          hasDetailSentinel: bodyText.includes("DETAIL_PAGE_READY"),
          hasReadableBody: bodyText.length > 0
        };
      });
      detailProbe = detailState.hasDetailSentinel || detailState.hasReadableBody
        ? {
            status: "reachable",
            ...detailState
          }
        : {
            status: "blocked",
            ...detailState
          };
    } catch (error) {
      detailProbe = {
        status: "blocked",
        error: normalizeError(error)
      };
    }
  }

  const blockingConsoleErrors = browserConsole.filter((entry) =>
    entry.type === "error" || entry.type === "warning" || entry.type === "warn"
  );
  const isWhiteScreen =
    Boolean(navigationError) ||
    pageState.domEmpty ||
    pageState.emptyContainerOnly ||
    pageState.noVisibleText;

  const report = {
    generated_at: new Date().toISOString(),
    target_url: baseUrl,
    navigation_error: navigationError,
    white_screen_detected: isWhiteScreen,
    heuristics: {
      dom_empty: pageState.domEmpty,
      empty_container_only: pageState.emptyContainerOnly,
      no_visible_text: pageState.noVisibleText
    },
    page_state: pageState,
    detail_probe: detailProbe,
    counts: {
      console_total: browserConsole.length,
      console_blocking_total: blockingConsoleErrors.length,
      pageerror_total: pageErrors.length,
      requestfailed_total: requestFailures.length
    },
    requestfailed: requestFailures,
    screenshot_path: screenshotPath
  };

  await fs.writeFile(browserConsolePath, JSON.stringify(browserConsole, null, 2) + "\n", "utf8");
  await fs.writeFile(
    pageErrorsPath,
    JSON.stringify(
      {
        pageerror: pageErrors,
        requestfailed: requestFailures
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  await browser.close();

  expect(report.white_screen_detected).toBeFalsy();
  expect(pageState.sentinels.feed).toBeTruthy();
  expect(pageErrors).toHaveLength(0);
});
