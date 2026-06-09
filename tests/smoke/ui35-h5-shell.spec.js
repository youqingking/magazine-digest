import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-ui35-h5");
const reportPath = process.env.UI35_H5_REPORT_PATH || path.join(outputDir, "h5-shell-report.json");
const screenshotPath = path.join(outputDir, "h5-shell.png");
const baseUrl = process.env.H5_SMOKE_URL || "http://127.0.0.1:18085/#/";
const rootUrl = baseUrl.split("#")[0] || baseUrl;
const currentRuntimeBundlePath = path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "runtime.bundle.json");
const manualRemaining = [
  "settings Build Audit visibility in the dev-style runtime",
  "runtime provenance re-confirmation through in-app Build Audit",
  "exact scrollTop restoration pixel value",
  "app-plus or MuMu specific runtime proof"
];

async function ensureOutputDir() {
  await fsp.mkdir(outputDir, { recursive: true });
}

function normalizeConsoleEntries(entries) {
  return entries.filter((entry) => entry.type === "error").map((entry) => entry.text);
}

function dedupe(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

async function openHash(page, hash) {
  await page.evaluate((nextHash) => {
    window.location.hash = nextHash;
  }, hash);
}

async function waitForText(page, text, timeout = 120000) {
  await page.waitForFunction(
    (expected) => Boolean(document.body) && document.body.innerText.includes(expected),
    text,
    { timeout }
  );
}

async function waitForAnyText(page, texts, timeout = 120000) {
  const candidates = texts.filter(Boolean);
  await page.waitForFunction(
    (expectedTexts) => {
      if (!document.body) {
        return false;
      }
      const bodyText = document.body.innerText || "";
      return expectedTexts.some((expected) => bodyText.includes(expected));
    },
    candidates,
    { timeout }
  );
}

async function waitForUrlIncludes(page, fragment, timeout = 120000) {
  await page.waitForFunction((expected) => window.location.href.includes(expected), fragment, {
    timeout
  });
}

async function clickExactText(page, candidates, timeout = 15000) {
  for (const candidate of candidates.filter(Boolean)) {
    const locator = page.getByText(candidate, { exact: true });
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const node = locator.nth(index);
      if (await node.isVisible().catch(() => false)) {
        await node.click({ timeout });
        return candidate;
      }
    }
  }

  throw new Error(`TEXT_CLICK_TARGET_NOT_FOUND:${candidates.join("|")}`);
}

async function collectTabbarLabels(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("uni-tabbar .uni-tabbar__label, uni-tabbar text"))
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean);
  });
}

async function collectActiveChipLabels(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll(".chip.active"))
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean);
  });
}

async function collectModeTabStates(page, groupIndex = 0) {
  return page.evaluate((index) => {
    const groups = Array.from(document.querySelectorAll(".mode-tabs"));
    const group = groups[index];
    if (!group) {
      return [];
    }

    return Array.from(group.querySelectorAll(".mode-tab")).map((button) => ({
      label: (button.textContent || "").trim(),
      style: button.getAttribute("style") || ""
    }));
  }, groupIndex);
}

function extractActiveModeLabels(states) {
  return states
    .filter((state) => {
      const style = state.style || "";
      return !/background:\s*transparent/i.test(style) || !/border-color:\s*transparent/i.test(style);
    })
    .map((state) => state.label);
}

async function setFeedUpdateLabel(page, targetLabel) {
  const labels = ["全部更新", "新发布", "修订", "摘要更新"];

  for (let attempt = 0; attempt < labels.length + 1; attempt += 1) {
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes(targetLabel)) {
      return;
    }

    const currentLabel = labels.find((label) => bodyText.includes(label));
    if (!currentLabel) {
      throw new Error("FEED_UPDATE_LABEL_NOT_FOUND");
    }

    await clickExactText(page, [currentLabel]);
    await page.waitForFunction(
      (previousLabel) => Boolean(document.body) && !document.body.innerText.includes(previousLabel),
      currentLabel,
      { timeout: 10000 }
    );
  }

  throw new Error(`FEED_UPDATE_LABEL_TARGET_NOT_REACHED:${targetLabel}`);
}

test("ui3.5 h5 shell smoke", async () => {
  test.setTimeout(240000);
  await ensureOutputDir();
  const currentRuntimeBundle = JSON.parse(await fsp.readFile(currentRuntimeBundlePath, "utf8"));
  const detailArticleId = currentRuntimeBundle?.discoveryCatalog?.items?.[0]?.article_id || "art_s18_promo_preview";

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
  const pageErrors = [];
  const automatedChecks = {
    tabbar_count: { status: "pending" },
    tabbar_routes: { status: "pending" },
    search_tab_route: { status: "pending" },
    profile_tab_route: { status: "pending" },
    feed_paywall_entry: { status: "pending" },
    profile_paywall_entry: { status: "pending" },
    profile_invite_entry: { status: "pending" },
    paywall_invite_entry: { status: "pending" },
    profile_settings_entry: { status: "pending" },
    campaign_alias_entry: { status: "pending" },
    detail_default_quick: { status: "pending" },
    detail_deep_switch: { status: "pending" },
    feed_restore_state_partial: { status: "pending" },
    settings_foundation: { status: "pending" },
    build_audit_visible: { status: "manual_remaining" }
  };
  let fatalError = "";

  page.on("console", (message) => {
    consoleEntries.push({
      type: message.type(),
      text: message.text()
    });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message || String(error));
  });

  try {
    await page.goto(rootUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });
    await waitForText(page, "效率阅读");

    await openHash(page, "#/pages/settings/index");
    await waitForUrlIncludes(page, "#/pages/settings/index");
    await waitForText(page, "运行方式");
    await clickExactText(page, ["本地", "Local"]);
    await waitForAnyText(page, ["模式 local", "Mode local", "当前是本地优先模式"]);

    await openHash(page, "#/");
    await waitForText(page, "效率阅读");

    const tabbarLabels = dedupe(await collectTabbarLabels(page));
    const searchTabLabel = tabbarLabels.includes("来源")
      ? "来源"
      : tabbarLabels.includes("搜索")
        ? "搜索"
        : "";

    automatedChecks.tabbar_count = {
      status: tabbarLabels.length === 3 ? "passed" : "failed",
      labels: tabbarLabels
    };
    automatedChecks.tabbar_routes = {
      status:
        tabbarLabels.length === 3 &&
        tabbarLabels.includes("首页") &&
        tabbarLabels.includes("我的") &&
        Boolean(searchTabLabel) &&
        !tabbarLabels.includes("订阅") &&
        !tabbarLabels.includes("邀请") &&
        !tabbarLabels.includes("设置")
          ? "passed"
          : "failed",
      labels: tabbarLabels
    };

    if (!searchTabLabel) {
      throw new Error("SEARCH_TAB_LABEL_MISSING");
    }

    await clickExactText(page, [searchTabLabel]);
    await waitForUrlIncludes(page, "#/pages/search/index");
    await waitForAnyText(page, ["关注杂志", "来源结果"]);
    automatedChecks.search_tab_route = {
      status: page.url().includes("#/pages/search/index") ? "passed" : "failed",
      label: searchTabLabel,
      url: page.url()
    };

    await clickExactText(page, ["我的"]);
    await waitForUrlIncludes(page, "#/pages/profile/index");
    await waitForAnyText(page, ["我的摘要", "阅读用户"]);
    automatedChecks.profile_tab_route = {
      status: page.url().includes("#/pages/profile/index") ? "passed" : "failed",
      url: page.url()
    };

    await clickExactText(page, ["查看订阅"]);
    await waitForUrlIncludes(page, "#/pages/paywall/index");
    await waitForAnyText(page, ["先了解权益，再决定是否订阅", "邀请与奖励"]);
    automatedChecks.profile_paywall_entry = {
      status: page.url().includes("#/pages/paywall/index") ? "passed" : "failed",
      url: page.url()
    };

    await clickExactText(page, ["查看邀请奖励"]);
    await waitForUrlIncludes(page, "#/pages/invite/index");
    await waitForText(page, "邀请与兑换");
    automatedChecks.paywall_invite_entry = {
      status: page.url().includes("#/pages/invite/index") ? "passed" : "failed",
      url: page.url()
    };

    await openHash(page, "#/pages/profile/index");
    await waitForUrlIncludes(page, "#/pages/profile/index");
    await waitForAnyText(page, ["我的摘要", "阅读用户"]);
    await clickExactText(page, ["邀请奖励"]);
    await waitForUrlIncludes(page, "#/pages/invite/index");
    await waitForText(page, "邀请与兑换");
    automatedChecks.profile_invite_entry = {
      status: page.url().includes("#/pages/invite/index") ? "passed" : "failed",
      url: page.url()
    };

    await openHash(page, "#/pages/profile/index");
    await waitForUrlIncludes(page, "#/pages/profile/index");
    await waitForAnyText(page, ["我的摘要", "阅读用户"]);
    await clickExactText(page, ["打开设置"]);
    await waitForUrlIncludes(page, "#/pages/settings/index");
    await waitForText(page, "运行方式");
    const settingsText = await page.locator("body").innerText();
    automatedChecks.profile_settings_entry = {
      status: page.url().includes("#/pages/settings/index") ? "passed" : "failed",
      url: page.url()
    };
    automatedChecks.settings_foundation = {
      status:
        settingsText.includes("运行方式") &&
        settingsText.includes("账号状态") &&
        settingsText.includes("设备状态") &&
        settingsText.includes("推送状态")
          ? "passed"
          : "failed",
      build_audit_visible: settingsText.includes("Build Audit")
    };
    automatedChecks.build_audit_visible = {
      status: settingsText.includes("Build Audit") ? "passed" : "manual_remaining",
      visible: settingsText.includes("Build Audit")
    };

    await openHash(page, "#/");
    await waitForText(page, "效率阅读");
    await clickExactText(page, ["益"]);
    await waitForUrlIncludes(page, "#/pages/paywall/index");
    await waitForAnyText(page, ["先了解权益，再决定是否订阅", "邀请与奖励"]);
    automatedChecks.feed_paywall_entry = {
      status: page.url().includes("#/pages/paywall/index") ? "passed" : "failed",
      url: page.url()
    };

    await openHash(page, "#/pages/campaign/index");
    await waitForUrlIncludes(page, "#/pages/paywall/index?focus=campaign");
    await waitForAnyText(page, ["订阅 / 活动", "活动信息会在这里一并展示"]);
    automatedChecks.campaign_alias_entry = {
      status:
        page.url().includes("#/pages/paywall/index") && page.url().includes("focus=campaign")
          ? "passed"
          : "failed",
      url: page.url()
    };

    await openHash(page, `#/pages/detail/index?articleId=${detailArticleId}&readingMode=quick_30s&source=feed`);
    await waitForUrlIncludes(page, "#/pages/detail/index");
    await waitForAnyText(page, ["阅读操作", "阅读权益"]);
    const defaultAudienceStates = await collectModeTabStates(page, 0);
    const defaultAudienceLabels = extractActiveModeLabels(defaultAudienceStates);
    automatedChecks.detail_default_quick = {
      status:
        page.url().includes("#/pages/detail/index") && defaultAudienceLabels.length > 0
          ? "passed"
          : "failed",
      active_labels: defaultAudienceLabels,
      url: page.url()
    };

    await clickExactText(page, ["青少年"]);
    await page.waitForFunction(() => {
      const firstGroup = document.querySelectorAll(".mode-tabs")[0];
      if (!firstGroup) {
        return false;
      }

      return Array.from(firstGroup.querySelectorAll(".mode-tab")).some((button) => {
        const label = (button.textContent || "").trim();
        const style = button.getAttribute("style") || "";
        return label === "青少年" && !/background:\s*transparent/i.test(style);
      });
    }, null, {
      timeout: 120000
    });
    const switchedAudienceStates = await collectModeTabStates(page, 0);
    const switchedAudienceLabels = extractActiveModeLabels(switchedAudienceStates);
    automatedChecks.detail_deep_switch = {
      status: switchedAudienceLabels.includes("青少年") ? "passed" : "failed",
      active_labels: switchedAudienceLabels
    };

    await openHash(page, "#/");
    await waitForText(page, "效率阅读");
    await clickExactText(page, ["消息摘要"]);
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll(".chip.active")).some((node) =>
        (node.textContent || "").includes("消息摘要")
      );
    }, null, {
      timeout: 30000
    });
    await setFeedUpdateLabel(page, "修订");
    await openHash(page, `#/pages/detail/index?articleId=${detailArticleId}&readingMode=quick_30s&source=feed`);
    await waitForUrlIncludes(page, "#/pages/detail/index");
    await waitForAnyText(page, ["阅读操作", "阅读权益"]);
    await clickExactText(page, ["返"]);
    await waitForText(page, "效率阅读");
    const activeChipLabels = await collectActiveChipLabels(page);
    const feedBodyText = await page.locator("body").innerText();
    const hasVisibleUpdateFilterLabel = feedBodyText.includes("修订") || feedBodyText.includes("全部更新");
    automatedChecks.feed_restore_state_partial = {
      status:
        activeChipLabels.includes("消息摘要") && hasVisibleUpdateFilterLabel
          ? "passed"
          : "failed",
      active_chips: activeChipLabels,
      update_label_visible: hasVisibleUpdateFilterLabel
    };
  } catch (error) {
    fatalError = error.message || String(error);
    throw error;
  } finally {
    const report = {
      generated_at: new Date().toISOString(),
      status: Object.values(automatedChecks).every((item) => item.status === "passed" || item.status === "manual_remaining")
        ? "passed"
        : "failed",
      target_url: baseUrl,
      automated_checks: automatedChecks,
      manual_remaining: manualRemaining,
      console_errors: normalizeConsoleEntries(consoleEntries),
      page_errors: pageErrors,
      fatal_error: fatalError,
      final_url: page.url(),
      screenshot_path: screenshotPath
    };

    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    }).catch(() => {});
    await fsp.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    await browser.close();
  }

  const report = JSON.parse(await fsp.readFile(reportPath, "utf8"));
  expect(report.status).toBe("passed");
  expect(automatedChecks.tabbar_count.status).toBe("passed");
  expect(automatedChecks.tabbar_routes.status).toBe("passed");
  expect(automatedChecks.search_tab_route.status).toBe("passed");
  expect(automatedChecks.profile_tab_route.status).toBe("passed");
  expect(automatedChecks.feed_paywall_entry.status).toBe("passed");
  expect(automatedChecks.profile_paywall_entry.status).toBe("passed");
  expect(automatedChecks.profile_invite_entry.status).toBe("passed");
  expect(automatedChecks.paywall_invite_entry.status).toBe("passed");
  expect(automatedChecks.profile_settings_entry.status).toBe("passed");
  expect(automatedChecks.campaign_alias_entry.status).toBe("passed");
  expect(automatedChecks.detail_default_quick.status).toBe("passed");
  expect(automatedChecks.detail_deep_switch.status).toBe("passed");
  expect(automatedChecks.feed_restore_state_partial.status).toBe("passed");
  expect(automatedChecks.settings_foundation.status).toBe("passed");
});
