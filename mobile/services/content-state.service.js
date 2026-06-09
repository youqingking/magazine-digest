import { runtimeGateway } from "./runtime-gateway.service.js";
import { getCachedValue, setCachedValue } from "./cache.service.js";
import { getSessionState } from "../stores/session.store.js";

function buildContentStateCacheKey() {
  const session = getSessionState();
  return `stage_e0_mobile:${session.productKey}:user-content-state`;
}

function readLocalState() {
  return getCachedValue(buildContentStateCacheKey()) || {
    by_article: {},
    inbox_last_seen_at: null,
    last_seen_publish_batch: null
  };
}

function writeLocalState(value) {
  setCachedValue(buildContentStateCacheKey(), value);
}

export function getLocalContentState() {
  return readLocalState();
}

export function updateLocalReadState(articleId, patch = {}) {
  const state = readLocalState();
  state.by_article[articleId] = {
    ...(state.by_article[articleId] || {}),
    ...patch,
    article_id: articleId
  };
  writeLocalState(state);
  return state.by_article[articleId];
}

export function markInboxSeen(timestamp) {
  const state = readLocalState();
  state.inbox_last_seen_at = timestamp;
  writeLocalState(state);
}

export function setLastSeenPublishBatch(publishBatchId) {
  const state = readLocalState();
  state.last_seen_publish_batch = publishBatchId;
  writeLocalState(state);
}

export async function saveForLater(articleId, shouldSave) {
  const response = await runtimeGateway.saveForLater({
    article_id: articleId,
    desired_state: shouldSave ? "saved" : "removed"
  });

  updateLocalReadState(articleId, {
    saved_for_later: response.bookmark_status === "saved",
    saved_at: response.saved_at || null
  });

  return response;
}

export async function loadContentResume(limit = 5) {
  return runtimeGateway.getContentResume({
    limit
  });
}
