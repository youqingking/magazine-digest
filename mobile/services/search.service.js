import { runtimeGateway } from "./runtime-gateway.service.js";
import { normalizeSearchResponse } from "./content-normalizer.service.js";
import { recordObservabilityEvent } from "./observability.service.js";

export async function searchDiscoveryContent(query, filters = {}) {
  try {
    const response = normalizeSearchResponse(await runtimeGateway.searchContent({
      query,
      filters,
      limit: 20
    }));
    await recordObservabilityEvent({
      event_type: "search_loaded",
      source_surface: "app",
      canonical_section_key: filters.canonical_section_key || null,
      discovery_bucket: filters.discovery_bucket || null,
      details: {
        query,
        result_count: (response.items || []).length
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
        target: "search",
        query
      }
    });
    throw error;
  }
}
