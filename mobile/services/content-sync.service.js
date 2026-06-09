import { runtimeGateway } from "./runtime-gateway.service.js";
import {
  buildBootstrapCacheKey,
  buildFeedCacheKey,
  getCachedValue,
  setCachedValue
} from "./cache.service.js";
import { getSessionState, setSyncCursor } from "../stores/session.store.js";

const CONTENT_SYNC_TIMEOUT_MS = 1500;

function withTimeout(promise, label, timeoutMs = CONTENT_SYNC_TIMEOUT_MS) {
  let timer = null;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`${label}_TIMEOUT`);
        error.code = `${label}_TIMEOUT`;
        reject(error);
      }, timeoutMs);
    })
  ]);
}

function groupFeedItems(syncDelta) {
  const articleMap = new Map();

  (syncDelta.items || []).forEach((item) => {
    if (item.entity_type === "article") {
      articleMap.set(item.article_id, {
        article_id: item.article_id,
        article_key: item.article_key,
        publication_id: item.publication_id,
        title: item.title,
        summary: item.summary,
        status: item.status,
        updated_at: item.updated_at,
        available_modes: [],
        available_audiences: []
      });
      return;
    }

    if (item.entity_type !== "article_variant" || item.is_deleted) {
      return;
    }

    const articleEntry = articleMap.get(item.article_id);
    if (!articleEntry) {
      return;
    }

    if (!articleEntry.available_modes.includes(item.reading_mode)) {
      articleEntry.available_modes.push(item.reading_mode);
    }

    if (!articleEntry.available_audiences.includes(item.audience_segment)) {
      articleEntry.available_audiences.push(item.audience_segment);
    }
  });

  return Array.from(articleMap.values());
}

export async function loadFeedSnapshot() {
  const session = getSessionState();
  const cacheKey = buildFeedCacheKey(session.productKey);
  const bootstrapCacheKey = buildBootstrapCacheKey(session.productKey);

  try {
    const bootstrapConfig = await withTimeout(runtimeGateway.getBootstrapConfig(), "BOOTSTRAP_CONFIG");
    const syncDelta = await withTimeout(runtimeGateway.getContentSyncDelta({
      last_sync_cursor: session.syncCursor,
      limit: 50
    }), "CONTENT_SYNC_DELTA");
    const articles = groupFeedItems(syncDelta);
    const payload = {
      source: "runtime",
      bootstrapConfig,
      syncDelta,
      articles,
      state: articles.length ? "ready" : "empty"
    };

    setSyncCursor(syncDelta.server_cursor || session.syncCursor);
    setCachedValue(bootstrapCacheKey, bootstrapConfig);
    setCachedValue(cacheKey, payload);
    return payload;
  } catch (error) {
    const cachedPayload = getCachedValue(cacheKey);

    if (cachedPayload) {
      return {
        ...cachedPayload,
        source: "cache",
        state: cachedPayload.articles && cachedPayload.articles.length ? "cached" : "empty",
        fallback_reason: error.message
      };
    }

    return {
      source: "error",
      bootstrapConfig: null,
      syncDelta: null,
      articles: [],
      state: "error",
      error_message: error.message
    };
  }
}

export function createContentSyncStub() {
  return {
    capability: "content.syncDelta",
    contractStatus: "local_runtime_first"
  };
}
