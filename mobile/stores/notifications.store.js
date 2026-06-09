import {
  loadNotificationInbox,
  loadNotificationPrefs,
  markInboxItemsRead,
  updateNotificationPrefs
} from "../services/notification.service.js";
import { getReleaseUpdateState, refreshReleaseUpdateSummary } from "../services/release-update.service.js";
import {
  buildUiStateCacheKey,
  getCachedValue,
  setCachedValue
} from "../services/cache.service.js";

const notificationStateCacheKey = buildUiStateCacheKey("notifications-v1");

function readPersistedNotificationState() {
  const cached = getCachedValue(notificationStateCacheKey) || {};
  return {
    seenInboxIds: Array.isArray(cached.seenInboxIds) ? cached.seenInboxIds : [],
    seenPublishBatchIds: Array.isArray(cached.seenPublishBatchIds) ? cached.seenPublishBatchIds : [],
    lastSeenAt: cached.lastSeenAt || null,
    lastSeenPublishBatch: cached.lastSeenPublishBatch || null
  };
}

function persistNotificationState() {
  setCachedValue(notificationStateCacheKey, state.localState);
}

function isLocallySeen(item) {
  if (!item) {
    return false;
  }

  if (state.localState.seenInboxIds.includes(item._id)) {
    return true;
  }
  if (item.publish_batch_id && state.localState.seenPublishBatchIds.includes(item.publish_batch_id)) {
    return true;
  }
  if (state.localState.lastSeenPublishBatch && item.publish_batch_id === state.localState.lastSeenPublishBatch) {
    return true;
  }
  if (state.localState.lastSeenAt && item.created_at && item.created_at <= state.localState.lastSeenAt) {
    return true;
  }
  return false;
}

function normalizeInboxItems(items = []) {
  return items.map((item) => ({
    ...item,
    is_read: Boolean(item.is_read || isLocallySeen(item))
  }));
}

function computeUnreadCount(items = []) {
  return items.filter((item) => !item.is_read).length;
}

function sortInboxItems(items = []) {
  return items
    .slice()
    .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
}

function mergeReleaseUpdateItems(actualItems = [], releaseUpdateItems = []) {
  const batchIds = new Set(
    actualItems
      .map((item) => item.publish_batch_id)
      .filter(Boolean)
  );

  return sortInboxItems(
    actualItems.concat(
      (releaseUpdateItems || []).filter((item) => !item.publish_batch_id || !batchIds.has(item.publish_batch_id))
    )
  );
}

function markItemsSeenLocally(items = []) {
  if (!items.length) {
    return;
  }

  const seenIds = new Set(state.localState.seenInboxIds);
  const seenPublishBatchIds = new Set(state.localState.seenPublishBatchIds);
  let lastSeenAt = state.localState.lastSeenAt;
  let lastSeenPublishBatch = state.localState.lastSeenPublishBatch;

  items.forEach((item) => {
    if (item?._id) {
      seenIds.add(item._id);
    }
    if (item?.publish_batch_id) {
      seenPublishBatchIds.add(item.publish_batch_id);
    }
    if (item?.created_at && (!lastSeenAt || item.created_at > lastSeenAt)) {
      lastSeenAt = item.created_at;
    }
    if (item?.publish_batch_id) {
      lastSeenPublishBatch = item.publish_batch_id;
    }
  });

  state.localState = {
    seenInboxIds: Array.from(seenIds).slice(-80),
    seenPublishBatchIds: Array.from(seenPublishBatchIds).slice(-80),
    lastSeenAt,
    lastSeenPublishBatch
  };
  persistNotificationState();
}

const state = {
  inboxStatus: "idle",
  prefsStatus: "idle",
  inbox: [],
  unreadCount: 0,
  prefs: null,
  errorMessage: "",
  localState: readPersistedNotificationState()
};

export function getNotificationsState() {
  return state;
}

export async function refreshInbox(statusFilter = "all") {
  state.inboxStatus = "loading";
  const [response, releaseUpdates] = await Promise.all([
    loadNotificationInbox(statusFilter),
    refreshReleaseUpdateSummary().catch(() => getReleaseUpdateState())
  ]);
  state.inbox = normalizeInboxItems(
    mergeReleaseUpdateItems(response.items || [], releaseUpdates?.items || [])
  );
  state.unreadCount = computeUnreadCount(state.inbox);
  state.inboxStatus = "ready";
  return {
    ...response,
    items: state.inbox,
    unread_count: state.unreadCount
  };
}

export async function refreshNotificationPrefs() {
  state.prefsStatus = "loading";
  state.prefs = await loadNotificationPrefs();
  state.prefsStatus = "ready";
  return state.prefs;
}

export async function saveNotificationPrefs(update) {
  state.prefs = await updateNotificationPrefs(update);
  state.prefsStatus = "ready";
  return state.prefs;
}

export async function markNotificationsRead(inboxIds = [], markAllBefore = null) {
  const runtimeInboxIds = inboxIds.filter((item) => !String(item || "").startsWith("publish_batch:"));
  const response =
    runtimeInboxIds.length > 0 || markAllBefore
      ? await markInboxItemsRead(runtimeInboxIds, markAllBefore)
      : {
          updated_count: 0,
          unread_count: state.unreadCount
        };
  const matchedItems = state.inbox.filter((item) => {
    const byId = inboxIds.includes(item._id);
    const byTime = markAllBefore && item.created_at && item.created_at <= markAllBefore;
    return byId || byTime;
  });
  markItemsSeenLocally(matchedItems);
  await refreshInbox();
  return {
    ...response,
    unread_count: state.unreadCount
  };
}
