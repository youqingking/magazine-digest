import { runtimeGateway } from "./runtime-gateway.service.js";
import { normalizeDiscoveryResponse } from "./content-normalizer.service.js";
import { isDevVisibilityEnabled } from "./dev-visibility.service.js";
import { recordObservabilityEvent } from "./observability.service.js";
import { getRuntimeFixturesDebugSummary } from "./runtime-fixtures.service.js";
import { getRuntimeProofSummary } from "./runtime-proof.service.js";
import { getRuntimeState } from "../stores/runtime.store.js";

export async function loadDiscoveryHome() {
  try {
    const response = normalizeDiscoveryResponse(await runtimeGateway.getHomeDiscovery());
    if (isDevVisibilityEnabled()) {
      let syncDeltaCount = null;
      let syncDeltaError = null;
      try {
        const syncDelta = await runtimeGateway.getContentSyncDelta({
          last_sync_cursor: null,
          limit: 50
        });
        syncDeltaCount = Array.isArray(syncDelta?.items) ? syncDelta.items.length : 0;
      } catch (error) {
        syncDeltaError = error.message || String(error);
      }
      response.__debug = {
        runtime_mode: getRuntimeState().runtimeMode,
        runtime_source: getRuntimeProofSummary(),
        fixtures: getRuntimeFixturesDebugSummary(),
        module_count: (response.modules || []).length,
        discovery_count: (response.modules || []).reduce((sum, module) => sum + ((module.items || []).length), 0),
        sync_items_count: syncDeltaCount,
        sync_items_error: syncDeltaError
      };
    }
    await recordObservabilityEvent({
      event_type: "feed_loaded",
      source_surface: "app",
      details: {
        module_count: (response.modules || []).length,
        inbox_unread_count: response.inbox_unread_count || 0
      }
    });
    await recordObservabilityEvent({
      event_type: "publication_list_loaded",
      source_surface: "app",
      details: {
        publication_count: Array.from(new Set(
          (response.modules || [])
            .flatMap((module) => module.items || [])
            .map((item) => item.publication_key || item.publication_id)
            .filter(Boolean)
        )).length
      }
    });
    return response;
  } catch (error) {
    await recordObservabilityEvent({
      event_type: "content_load_failed",
      source_surface: "app",
      error_code: "OBS1_CONTENT_LOAD_FAILED",
      error_message: error.message,
      details: {
        target: "feed"
      }
    });
    throw error;
  }
}

export async function loadPublishBatchSummary(publishBatchId) {
  return runtimeGateway.getPublishBatchSummary({
    publish_batch_id: publishBatchId
  });
}
