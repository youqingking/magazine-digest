import { runtimeGateway } from "./runtime-gateway.service.js";
import { buildUiStateCacheKey, getCachedValue, setCachedValue } from "./cache.service.js";
import { buildPersistedFollowSet, matchesFollowSelectionForContent } from "./follow-state.service.js";
import { isLoopbackRemoteRuntimeBaseUrl, normalizeRemoteRuntimeBaseUrl } from "./remote-runtime-url.service.js";
import { getRuntimeState } from "../stores/runtime.store.js";
import { getSessionState } from "../stores/session.store.js";

const releaseUpdateCacheKey = buildUiStateCacheKey("release-updates-v1");

const state = {
  status: "idle",
  checkedAt: null,
  releaseId: null,
  remoteChannel: null,
  runtimeSource: null,
  updateItems: [],
  errorMessage: ""
};

function persistState() {
  setCachedValue(releaseUpdateCacheKey, {
    checkedAt: state.checkedAt,
    releaseId: state.releaseId,
    remoteChannel: state.remoteChannel,
    runtimeSource: state.runtimeSource,
    updateItems: state.updateItems,
    errorMessage: state.errorMessage
  });
}

function hydrateState() {
  const cached = getCachedValue(releaseUpdateCacheKey) || {};
  state.checkedAt = cached.checkedAt || null;
  state.releaseId = cached.releaseId || null;
  state.remoteChannel = cached.remoteChannel || null;
  state.runtimeSource = cached.runtimeSource || null;
  state.updateItems = Array.isArray(cached.updateItems) ? cached.updateItems : [];
  state.errorMessage = cached.errorMessage || "";
}

function latestTimestamp(current, candidate, fallbackValue) {
  const values = [current, candidate, fallbackValue].filter(Boolean).map((value) => new Date(value).toISOString());
  return values.sort().slice(-1)[0] || fallbackValue || new Date().toISOString();
}

function dedupeArticles(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const articleId = item?.article_id || null;
    if (!articleId) {
      return true;
    }
    if (seen.has(articleId)) {
      return false;
    }
    seen.add(articleId);
    return true;
  });
}

function formatBatchReason(group) {
  if (group.updateTypes.has("new_publish")) {
    return "新发布";
  }
  if (group.updateTypes.has("revision")) {
    return "修订";
  }
  if (group.updateTypes.has("highlight_refresh")) {
    return "摘要更新";
  }
  return "内容更新";
}

function buildSyntheticUpdateItemsFromHome(home = {}) {
  const followedSet = buildPersistedFollowSet(getSessionState().userId);
  const groups = new Map();
  const items = dedupeArticles(
    (home.modules || [])
      .flatMap((section) => section.items || [])
      .filter((item) => item.publish_batch_id)
      .filter((item) => matchesFollowSelectionForContent(item, followedSet))
  );

  items.forEach((item) => {
    const publishBatchId = item.publish_batch_id;
    if (!groups.has(publishBatchId)) {
      groups.set(publishBatchId, {
        publishBatchId,
        publicationName: item.publication_name || item.publication_key || "内容",
        publicationKey: item.publication_key || null,
        articleCount: 0,
        articleIds: new Set(),
        primaryArticleId: item.article_id || null,
        primaryTitle: item.title || null,
        latestAt: home.server_time || new Date().toISOString(),
        updateTypes: new Set()
      });
    }
    const group = groups.get(publishBatchId);
    if (item.article_id && !group.articleIds.has(item.article_id)) {
      group.articleIds.add(item.article_id);
      group.articleCount += 1;
    }
    if (!group.primaryArticleId && item.article_id) {
      group.primaryArticleId = item.article_id;
    }
    if (!group.primaryTitle && item.title) {
      group.primaryTitle = item.title;
    }
    group.latestAt = latestTimestamp(group.latestAt, item.available_from || item.updated_at, home.server_time);
    if (item.update_type) {
      group.updateTypes.add(item.update_type);
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => String(right.latestAt || "").localeCompare(String(left.latestAt || "")))
    .map((group) => ({
      _id: `publish_batch:${group.publishBatchId}`,
      publish_batch_id: group.publishBatchId,
      type: "publish_batch",
      source_type: "publish_batch",
      title: `${group.publicationName} 已更新`,
      body: `${group.articleCount} 篇内容已同步${group.primaryTitle ? ` · ${group.primaryTitle}` : ""}`,
      reason: formatBatchReason(group),
      target: group.primaryArticleId || null,
      publication_key: group.publicationKey,
      created_at: group.latestAt,
      updated_at: group.latestAt,
      is_read: false,
      synthetic: true
    }));
}

function buildSyntheticUpdateItemsFromBatches(summary = {}) {
  const followedSet = buildPersistedFollowSet(getSessionState().userId);
  const publishBatches = Array.isArray(summary.publish_batches) ? summary.publish_batches : [];
  return publishBatches
    .filter((batch) => matchesFollowSelectionForContent(batch, followedSet))
    .slice()
    .sort((left, right) => String(right.updated_at || "").localeCompare(String(left.updated_at || "")))
    .map((batch) => ({
      _id: `publish_batch:${batch._id}`,
      publish_batch_id: batch._id,
      type: "publish_batch",
      source_type: "publish_batch",
      title: `${batch.publication_key || batch.title || "内容"} 已更新`,
      body: `${batch.article_count || 0} 篇内容已同步${batch.title ? ` · ${batch.title}` : ""}`,
      reason: "新发布",
      target: null,
      publication_key: batch.publication_key || null,
      created_at: batch.updated_at || batch.created_at || new Date().toISOString(),
      updated_at: batch.updated_at || batch.created_at || new Date().toISOString(),
      is_read: false,
      synthetic: true
    }));
}

export function getReleaseUpdateState() {
  return state;
}

export function isRemoteBridgeReady() {
  const runtime = getRuntimeState();
  const baseUrl = normalizeRemoteRuntimeBaseUrl(runtime.remoteBaseUrl || "");
  const isLoopback = isLoopbackRemoteRuntimeBaseUrl(baseUrl);
  const isH5 =
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    /^https?:/i.test(window.location.protocol || "");

  if (runtime.runtimeMode === "local") {
    return false;
  }
  if (!baseUrl) {
    return false;
  }
  if (isLoopback && !isH5) {
    return false;
  }
  return true;
}

export async function refreshReleaseUpdateSummary() {
  state.status = "loading";
  state.errorMessage = "";
  try {
    const home = await runtimeGateway.getHomeDiscovery();
    let updateItems = buildSyntheticUpdateItemsFromHome(home);
    if (!updateItems.length) {
      const publishBatchSummary = await runtimeGateway.getPublishBatchSummary({});
      updateItems = buildSyntheticUpdateItemsFromBatches(publishBatchSummary);
    }
    state.checkedAt = new Date().toISOString();
    state.releaseId = home.remote_release_id || null;
    state.remoteChannel = home.remote_channel || getRuntimeState().remoteChannel || null;
    state.runtimeSource = home.runtime_source || null;
    state.updateItems = updateItems;
    state.status = "ready";
    persistState();
    return {
      checked_at: state.checkedAt,
      release_id: state.releaseId,
      remote_channel: state.remoteChannel,
      runtime_source: state.runtimeSource,
      items: state.updateItems
    };
  } catch (error) {
    state.checkedAt = new Date().toISOString();
    state.errorMessage = error.message || String(error);
    state.status = "error";
    persistState();
    throw error;
  }
}

hydrateState();
