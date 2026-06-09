import { getRuntimeState } from "../stores/runtime.store.js";
import { normalizeRemoteRuntimeBaseUrl } from "./remote-runtime-url.service.js";

const REMOTE_SUCCESS_TTL_MS = 5 * 60 * 1000;
const REMOTE_FAILURE_TTL_MS = 3000;
const REMOTE_DEFAULT_FETCH_TIMEOUT_MS = 8000;
const REMOTE_BUNDLE_FETCH_TIMEOUT_MS = 30000;

const resolvedBundleCache = new Map();
const inflightBundleCache = new Map();

function normalizeBaseUrl(rawUrl) {
  return normalizeRemoteRuntimeBaseUrl(rawUrl || getRuntimeState().remoteBaseUrl || "");
}

function buildCacheKey(channel, baseUrl) {
  return `${baseUrl}::${channel}`;
}

function readCachedBundle(cacheKey) {
  const entry = resolvedBundleCache.get(cacheKey);
  if (!entry) return null;
  const ttl = entry.status === "ok" ? REMOTE_SUCCESS_TTL_MS : REMOTE_FAILURE_TTL_MS;
  if (Date.now() - entry.at > ttl) {
    resolvedBundleCache.delete(cacheKey);
    return null;
  }
  return entry;
}

export function peekResolvedRemoteChannelBundle({ channel, remoteBaseUrl } = {}) {
  const baseUrl = normalizeBaseUrl(remoteBaseUrl);
  if (!baseUrl) {
    return null;
  }
  const cached = readCachedBundle(buildCacheKey(channel, baseUrl));
  return cached?.status === "ok" ? cached.value : null;
}

export function warmRemoteChannelBundle(options = {}) {
  return resolveRemoteChannelBundle(options).catch((error) => {
    throw error;
  });
}

function resolveFetchTimeoutMs(url) {
  return /\/bundle\.json(?:$|[?#])/i.test(String(url || ""))
    ? REMOTE_BUNDLE_FETCH_TIMEOUT_MS
    : REMOTE_DEFAULT_FETCH_TIMEOUT_MS;
}

function fetchJsonWithUniRequest(url, timeoutMs = resolveFetchTimeoutMs(url)) {
  return new Promise((resolve, reject) => {
    if (typeof uni === "undefined" || typeof uni.request !== "function") {
      const error = new Error("REMOTE_FETCH_UNAVAILABLE");
      error.code = "REMOTE_FETCH_UNAVAILABLE";
      error.url = url;
      reject(error);
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      if (requestTask && typeof requestTask.abort === "function") {
        requestTask.abort();
      }
      const timeoutError = new Error("REMOTE_FETCH_TIMEOUT");
      timeoutError.code = "REMOTE_FETCH_TIMEOUT";
      timeoutError.url = url;
      timeoutError.timeout_ms = timeoutMs;
      reject(timeoutError);
    }, timeoutMs);

    const requestTask = uni.request({
      url,
      method: "GET",
      timeout: timeoutMs,
      header: {
        accept: "application/json"
      },
      success(response) {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        const statusCode = Number(response?.statusCode || 0);
        if (statusCode < 200 || statusCode >= 300) {
          const error = new Error(`REMOTE_FETCH_HTTP_${statusCode || "UNKNOWN"}`);
          error.code = `REMOTE_FETCH_HTTP_${statusCode || "UNKNOWN"}`;
          error.status = statusCode || null;
          error.url = url;
          error.timeout_ms = timeoutMs;
          reject(error);
          return;
        }
        resolve(response.data);
      },
      fail(error) {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        const requestError = new Error(error?.errMsg || "REMOTE_FETCH_FAILED");
        requestError.code = "REMOTE_FETCH_FAILED";
        requestError.url = url;
        requestError.timeout_ms = timeoutMs;
        reject(requestError);
      }
    });
  });
}

async function fetchJson(url, timeoutMs = resolveFetchTimeoutMs(url)) {
  if (typeof fetch !== "function") {
    return fetchJsonWithUniRequest(url, timeoutMs);
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller?.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("REMOTE_FETCH_TIMEOUT");
      timeoutError.code = "REMOTE_FETCH_TIMEOUT";
      timeoutError.url = url;
      timeoutError.timeout_ms = timeoutMs;
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!response.ok) {
    const error = new Error(`REMOTE_FETCH_HTTP_${response.status}`);
    error.code = `REMOTE_FETCH_HTTP_${response.status}`;
    error.status = response.status;
    error.url = url;
    error.timeout_ms = timeoutMs;
    throw error;
  }
  return response.json();
}

async function readChannelHead(channelManifestUrl) {
  const channelManifest = await fetchJson(channelManifestUrl);
  if (!channelManifest?.release_id || !channelManifest?.bundle_path) {
    const error = new Error("REMOTE_CHANNEL_MANIFEST_INVALID");
    error.code = "REMOTE_CHANNEL_MANIFEST_INVALID";
    error.channelManifest = channelManifest;
    throw error;
  }
  return channelManifest;
}

export async function probeRemoteChannelBridge({ channel, remoteBaseUrl } = {}) {
  const baseUrl = normalizeBaseUrl(remoteBaseUrl);
  if (!baseUrl) {
    const error = new Error("REMOTE_BASE_URL_MISSING");
    error.code = "REMOTE_BASE_URL_MISSING";
    throw error;
  }
  const channelManifestUrl = `${baseUrl}/channels/${channel}/manifest.json`;
  const channelManifest = await readChannelHead(channelManifestUrl);
  const releaseManifestUrl = `${baseUrl}${channelManifest.release_manifest_path}`;
  const releaseManifest = await fetchJson(releaseManifestUrl);
  return {
    channelManifest,
    releaseManifest,
    remoteBaseUrl: baseUrl,
    resolvedManifestUrl: channelManifestUrl,
    resolvedReleaseManifestUrl: releaseManifestUrl,
    resolvedBundleUrl: `${baseUrl}${channelManifest.bundle_path}`
  };
}

export async function resolveRemoteChannelBundle({ channel, remoteBaseUrl } = {}) {
  const baseUrl = normalizeBaseUrl(remoteBaseUrl);
  if (!baseUrl) {
    const error = new Error("REMOTE_BASE_URL_MISSING");
    error.code = "REMOTE_BASE_URL_MISSING";
    throw error;
  }
  const cacheKey = buildCacheKey(channel, baseUrl);
  const cached = readCachedBundle(cacheKey);
  if (cached?.status === "ok") {
    return cached.value;
  }
  if (cached?.status === "error") {
    throw cached.error;
  }
  if (inflightBundleCache.has(cacheKey)) {
    return inflightBundleCache.get(cacheKey);
  }

  const channelManifestUrl = `${baseUrl}/channels/${channel}/manifest.json`;
  const promise = (async () => {
    try {
      const channelManifest = await readChannelHead(channelManifestUrl);
      const releaseManifestUrl = `${baseUrl}${channelManifest.release_manifest_path}`;
      const bundleUrl = `${baseUrl}${channelManifest.bundle_path}`;
      const releaseManifest = await fetchJson(releaseManifestUrl);
      const fixtures = await fetchJson(bundleUrl);
      if (!fixtures?.bootstrapConfig || !fixtures?.contentSyncDelta || !fixtures?.contentDetail) {
        const error = new Error("REMOTE_RELEASE_BUNDLE_INVALID");
        error.code = "REMOTE_RELEASE_BUNDLE_INVALID";
        throw error;
      }
      const value = {
        channelManifest,
        releaseManifest,
        fixtures,
        remoteBaseUrl: baseUrl,
        resolvedManifestUrl: channelManifestUrl,
        resolvedReleaseManifestUrl: releaseManifestUrl,
        resolvedBundleUrl: bundleUrl
      };
      resolvedBundleCache.set(cacheKey, {
        status: "ok",
        at: Date.now(),
        value
      });
      return value;
    } catch (error) {
      resolvedBundleCache.set(cacheKey, {
        status: "error",
        at: Date.now(),
        error
      });
      throw error;
    } finally {
      inflightBundleCache.delete(cacheKey);
    }
  })();

  inflightBundleCache.set(cacheKey, promise);
  return promise;
}
