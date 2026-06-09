import { createLocalRuntimeApi } from "./local-runtime-api.js";
import { createFixtureRuntimeApi } from "./fixture-runtime-api.js";
import { recordObservabilityEvent } from "../services/observability.service.js";
import {
  peekResolvedRemoteChannelBundle,
  resolveRemoteChannelBundle,
  warmRemoteChannelBundle
} from "../services/remote-runtime.service.js";
import { getRuntimeSourceSummary } from "../services/runtime-source.service.js";
import { getRuntimeState } from "../stores/runtime.store.js";

const REMOTE_READ_METHODS = new Set([
  "getBootstrapConfig",
  "getContentSyncDelta",
  "getContentDetail",
  "getHomeDiscovery",
  "searchContent",
  "getFollowCatalog",
  "getContentResume",
  "getPublishBatchSummary",
  "getNotificationInbox"
]);

const EVENT_TTL_MS = 5000;

function wrapResponse(baseResponse, runtimeMode, overrides = {}) {
  return {
    ...baseResponse,
    runtime_mode: runtimeMode,
    runtime_source: overrides.runtime_source || (runtimeMode === "hybrid" ? "hybrid_remote_with_local_fallback" : "remote_channel_head"),
    remote_ready: overrides.remote_ready === true,
    fallback_used: overrides.fallback_used === true,
    remote_base_url: overrides.remote_base_url || getRuntimeState().remoteBaseUrl,
    remote_channel: overrides.remote_channel || null,
    remote_release_id: overrides.remote_release_id || null
  };
}

function buildRuntimeCacheKey(remoteBaseUrl, remoteChannel, suffix = "default") {
  return `${remoteBaseUrl || "none"}::${remoteChannel || "dev"}::${suffix}`;
}

export function createRemoteRuntimeApi(runtimeMode = "remote") {
  const localApi = createLocalRuntimeApi();
  const recentEvents = new Map();
  const fixtureApiCache = new Map();

  async function recordDedupedEvent(key, payload) {
    const now = Date.now();
    const lastAt = recentEvents.get(key) || 0;
    if (now - lastAt < EVENT_TTL_MS) {
      return;
    }
    recentEvents.set(key, now);
    await recordObservabilityEvent(payload);
  }

  function getRemoteFixtureApi(remoteBundle, remoteChannel) {
    const fixtureCacheKey = buildRuntimeCacheKey(remoteBundle.remoteBaseUrl, remoteChannel, remoteBundle.releaseManifest.release_id);
    let remoteApi = fixtureApiCache.get(fixtureCacheKey);
    if (!remoteApi) {
      remoteApi = createFixtureRuntimeApi(remoteBundle.fixtures, {
        runtimeMode,
        runtimeSource: "remote_channel_head",
        remoteReady: true,
        fallbackUsed: false,
        remoteBaseUrl: remoteBundle.remoteBaseUrl,
        channel: remoteChannel,
        releaseId: remoteBundle.releaseManifest.release_id
      });
      fixtureApiCache.set(fixtureCacheKey, remoteApi);
    }
    return remoteApi;
  }

  async function recordRemoteBundleLoaded(remoteBundle, remoteChannel) {
    await recordDedupedEvent(buildRuntimeCacheKey(remoteBundle.remoteBaseUrl, remoteChannel, "resolved"), {
      event_type: "remote_channel_resolved",
      source_surface: "runtime",
      details: {
        remote_base_url: remoteBundle.remoteBaseUrl,
        resolved_manifest_url: remoteBundle.resolvedManifestUrl
      }
    });
    await recordDedupedEvent(buildRuntimeCacheKey(remoteBundle.remoteBaseUrl, remoteChannel, `release:${remoteBundle.releaseManifest.release_id}`), {
      event_type: "remote_release_loaded",
      source_surface: "runtime",
      details: {
        release_id: remoteBundle.releaseManifest.release_id,
        resolved_bundle_url: remoteBundle.resolvedBundleUrl
      }
    });
  }

  async function recordRemoteBundleFailure(remoteBaseUrl, remoteChannel, source, error) {
    await recordDedupedEvent(buildRuntimeCacheKey(remoteBaseUrl, remoteChannel, `fetch_failed:${error.code || error.message}`), {
      event_type: "remote_channel_fetch_failed",
      severity: "error",
      source_surface: "runtime",
      error_code: error.code || "OBS1_REMOTE_CHANNEL_FETCH_FAILED",
      error_message: error.message || String(error),
      details: {
        remote_base_url: remoteBaseUrl,
        remote_channel: remoteChannel
      }
    });
    await recordDedupedEvent(buildRuntimeCacheKey(remoteBaseUrl, remoteChannel, `fallback:${error.code || error.message}`), {
      event_type: "remote_fallback_applied",
      severity: "warning",
      source_surface: "runtime",
      error_code: "OBS1_REMOTE_FALLBACK_APPLIED",
      error_message: error.message || String(error),
      details: {
        remote_base_url: remoteBaseUrl,
        remote_channel: remoteChannel,
        fallback_target: source.fallbackTarget || "current_mirror"
      }
    });
  }

  function scheduleHybridWarmup(remoteBaseUrl, remoteChannel, source) {
    void warmRemoteChannelBundle({
      channel: remoteChannel,
      remoteBaseUrl
    })
      .then((remoteBundle) => recordRemoteBundleLoaded(remoteBundle, remoteChannel))
      .catch((error) => recordRemoteBundleFailure(remoteBaseUrl, remoteChannel, source, error));
  }

  return Object.fromEntries(
    Object.keys(localApi).map((key) => [
      key,
      async (...args) => {
        const request = args[0] || {};
        const source = getRuntimeSourceSummary();
        const runtimeState = getRuntimeState();
        const remoteChannel = request.channel || runtimeState.remoteChannel || source.channel || "dev";
        const remoteBaseUrl = runtimeState.remoteBaseUrl;

        if (!REMOTE_READ_METHODS.has(key)) {
          const response = await localApi[key](...args);
          return wrapResponse(response, runtimeMode, {
            runtime_source: "remote_passthrough_local_mutation",
            remote_ready: false,
            fallback_used: true,
            remote_base_url: remoteBaseUrl,
            remote_channel: remoteChannel
          });
        }

        if (runtimeMode === "hybrid") {
          const cachedRemoteBundle = peekResolvedRemoteChannelBundle({
            channel: remoteChannel,
            remoteBaseUrl
          });
          if (cachedRemoteBundle) {
            await recordRemoteBundleLoaded(cachedRemoteBundle, remoteChannel);
            const remoteApi = getRemoteFixtureApi(cachedRemoteBundle, remoteChannel);
            const response = await remoteApi[key](...args);
            return wrapResponse(response, runtimeMode, {
              runtime_source: "hybrid_cached_remote_channel_head",
              remote_ready: true,
              fallback_used: false,
              remote_base_url: cachedRemoteBundle.remoteBaseUrl,
              remote_channel: remoteChannel,
              remote_release_id: cachedRemoteBundle.releaseManifest.release_id
            });
          }

          scheduleHybridWarmup(remoteBaseUrl, remoteChannel, source);
          const response = await localApi[key](...args);
          return wrapResponse(response, runtimeMode, {
            runtime_source: "hybrid_local_immediate_background_refresh",
            remote_ready: false,
            fallback_used: false,
            remote_base_url: remoteBaseUrl,
            remote_channel: remoteChannel,
            remote_release_id: source.releaseId || null
          });
        }

        try {
          const remoteBundle = await resolveRemoteChannelBundle({
            channel: remoteChannel,
            remoteBaseUrl
          });
          await recordRemoteBundleLoaded(remoteBundle, remoteChannel);
          const remoteApi = getRemoteFixtureApi(remoteBundle, remoteChannel);
          const response = await remoteApi[key](...args);
          return wrapResponse(response, runtimeMode, {
            runtime_source: "remote_channel_head",
            remote_ready: true,
            fallback_used: false,
            remote_base_url: remoteBundle.remoteBaseUrl,
            remote_channel: remoteChannel,
            remote_release_id: remoteBundle.releaseManifest.release_id
          });
        } catch (error) {
          await recordRemoteBundleFailure(remoteBaseUrl, remoteChannel, source, error);
          const response = await localApi[key](...args);
          return wrapResponse(response, runtimeMode, {
            runtime_source: "remote_channel_head_with_local_fallback",
            remote_ready: false,
            fallback_used: true,
            remote_base_url: remoteBaseUrl,
            remote_channel: remoteChannel,
            remote_release_id: source.releaseId || null
          });
        }
      }
    ])
  );
}
