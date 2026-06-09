import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

import { resetRuntimeCache } from "../../mobile/services/cache.service.js";
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";
import { createFixtureRuntimeApi } from "../../mobile/api/fixture-runtime-api.js";
import { getSessionState, resetSessionState, setRuntimeMode } from "../../mobile/stores/session.store.js";
import { getRuntimeState } from "../../mobile/stores/runtime.store.js";
import { getDiscoveryState, refreshDiscoveryHome, resetFeedUiState } from "../../mobile/stores/discovery.store.js";
import { getNotificationsState, refreshInbox } from "../../mobile/stores/notifications.store.js";
import { getReleaseUpdateState, refreshReleaseUpdateSummary } from "../../mobile/services/release-update.service.js";
import { loadFollowCatalog, toggleFollowSubject } from "../../mobile/services/follow.service.js";

const require = createRequire(import.meta.url);
const fixturesModule = require("../../mobile/fixtures/runtime/current/index.js");
const fixtures = fixturesModule.default || fixturesModule;

const reportPath = path.resolve("output/stage-ui35/follow-updates-report.json");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function summarizePublicationKeys(items = []) {
  return Array.from(
    new Set(
      items
        .map((item) => item.publication_key || item.publication_id || null)
        .filter(Boolean)
    )
  ).sort();
}

function filterPublicationScopedInbox(items = []) {
  return items.filter((item) => {
    const sourceType = item.source_type || item.type || "";
    return sourceType === "publish_batch" || Boolean(item.publication_key);
  });
}

function pickSection(home, sectionKey) {
  return (home.modules || []).find((section) => section.section_key === sectionKey) || { items: [] };
}

function patchRuntimeGateway(adapter) {
  const patchedMethods = [
    "getHomeDiscovery",
    "getNotificationInbox",
    "getPublishBatchSummary",
    "getFollowCatalog",
    "toggleFollow",
    "getContentResume",
    "markInboxRead"
  ];
  const originals = Object.fromEntries(
    patchedMethods.map((methodName) => [methodName, runtimeGateway[methodName]])
  );

  const withDefaults = (request = {}) => {
    const session = getSessionState();
    return {
      product_key: session.productKey,
      installation_id: session.installationId,
      user_id: session.userId,
      runtime_mode: getRuntimeState().runtimeMode,
      ...request
    };
  };

  patchedMethods.forEach((methodName) => {
    runtimeGateway[methodName] = (request = {}) => adapter[methodName](withDefaults(request));
  });

  runtimeGateway.markInboxRead = async () => ({
    updated_count: 0,
    unread_count: getNotificationsState().unreadCount
  });

  return () => {
    patchedMethods.forEach((methodName) => {
      runtimeGateway[methodName] = originals[methodName];
    });
  };
}

export async function runFollowUpdatesTest() {
  resetRuntimeCache();
  resetSessionState();
  setRuntimeMode("local");
  resetFeedUiState();

  const adapter = createFixtureRuntimeApi(fixtures, {
    runtimeMode: "local",
    runtimeSource: "current_mirror"
  });
  const restoreGateway = patchRuntimeGateway(adapter);
  const userId = getSessionState().userId;

  try {
    const initialCatalog = await loadFollowCatalog("publication");
    const initialFollowed = initialCatalog.subjects.filter((item) => item.is_followed);
    await refreshDiscoveryHome();
    await refreshInbox();
    const initialHome = getDiscoveryState().home;
    const initialFollowedSection = pickSection(initialHome, "followed_updates");
    const initialReleaseState = await refreshReleaseUpdateSummary();

    assert.equal(initialCatalog.subjects.length, 5, "expected five publication follow subjects");
    assert.equal(initialFollowed.length, 0, "expected zero default followed publications");
    assert.equal(initialFollowedSection.items.length, 0, "expected no followed updates before follow");
    assert.equal((initialReleaseState.items || []).length, 0, "expected no synthetic updates before follow");

    await toggleFollowSubject("publication", "science", "followed");
    const afterFollowCatalog = await loadFollowCatalog("publication");
    await refreshDiscoveryHome();
    await refreshInbox();
    const afterFollowHome = getDiscoveryState().home;
    const afterFollowSection = pickSection(afterFollowHome, "followed_updates");
    const afterFollowReleaseState = await refreshReleaseUpdateSummary();
    const afterFollowNotifications = getNotificationsState();
    const afterFollowInboxScoped = filterPublicationScopedInbox(afterFollowNotifications.inbox);

    assert.equal(
      afterFollowCatalog.subjects.find((item) => item.publication_key === "science")?.is_followed,
      true,
      "science should be marked followed"
    );
    assert.ok(afterFollowSection.items.length > 0, "expected followed updates after following science");
    assert.deepEqual(
      summarizePublicationKeys(afterFollowSection.items),
      ["science"],
      "followed updates should only contain science"
    );
    assert.ok((afterFollowReleaseState.items || []).length > 0, "expected followed synthetic updates for science");
    assert.deepEqual(
      summarizePublicationKeys(afterFollowReleaseState.items),
      ["science"],
      "synthetic updates should only contain science"
    );
    assert.deepEqual(
      summarizePublicationKeys(afterFollowInboxScoped),
      ["science"],
      "notification inbox should only contain followed publication updates"
    );

    await toggleFollowSubject("publication", "science", "removed");
    const afterUnfollowCatalog = await loadFollowCatalog("publication");
    await refreshDiscoveryHome();
    await refreshInbox();
    const afterUnfollowHome = getDiscoveryState().home;
    const afterUnfollowSection = pickSection(afterUnfollowHome, "followed_updates");
    const afterUnfollowReleaseState = await refreshReleaseUpdateSummary();
    const afterUnfollowNotifications = filterPublicationScopedInbox(getNotificationsState().inbox);

    assert.equal(
      afterUnfollowCatalog.subjects.find((item) => item.publication_key === "science")?.is_followed,
      false,
      "science should be removable from followed publications"
    );
    assert.equal(afterUnfollowSection.items.length, 0, "expected no followed updates after unfollow");
    assert.equal((afterUnfollowReleaseState.items || []).length, 0, "expected no synthetic updates after unfollow");
    assert.equal(afterUnfollowNotifications.length, 0, "expected no publication-scoped inbox items after unfollow");

    const report = {
      generated_at: new Date().toISOString(),
      status: "passed",
      user_id: userId,
      initial: {
        follow_subject_count: initialCatalog.subjects.length,
        followed_publications: initialFollowed.map((item) => item.publication_key),
        followed_updates_count: initialFollowedSection.items.length,
        synthetic_update_count: (initialReleaseState.items || []).length
      },
      after_follow: {
        followed_publications: afterFollowCatalog.subjects
          .filter((item) => item.is_followed)
          .map((item) => item.publication_key),
        followed_updates_publications: summarizePublicationKeys(afterFollowSection.items),
        synthetic_update_publications: summarizePublicationKeys(afterFollowReleaseState.items),
        inbox_publications: summarizePublicationKeys(afterFollowInboxScoped),
        unread_count: afterFollowNotifications.unreadCount
      },
      after_unfollow: {
        followed_publications: afterUnfollowCatalog.subjects
          .filter((item) => item.is_followed)
          .map((item) => item.publication_key),
        followed_updates_count: afterUnfollowSection.items.length,
        synthetic_update_count: (afterUnfollowReleaseState.items || []).length,
        inbox_publication_count: afterUnfollowNotifications.length,
        unread_count: getNotificationsState().unreadCount
      },
      release_update_state: getReleaseUpdateState()
    };

    writeJson(reportPath, report);
    return report;
  } catch (error) {
    const report = {
      generated_at: new Date().toISOString(),
      status: "failed",
      error: error.message || String(error)
    };
    writeJson(reportPath, report);
    throw error;
  } finally {
    restoreGateway();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runFollowUpdatesTest();
  console.log(JSON.stringify(report, null, 2));
}
