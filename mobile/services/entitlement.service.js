import { runtimeGateway } from "./runtime-gateway.service.js";
import {
  buildEntitlementCacheKey,
  getCachedValue,
  setCachedValue
} from "./cache.service.js";
import { getSessionState } from "../stores/session.store.js";

export async function loadEntitlementSnapshot() {
  const session = getSessionState();
  const cacheKey = buildEntitlementCacheKey(session.productKey, session.installationId);

  try {
    const payload = await runtimeGateway.getEntitlementSnapshot();
    setCachedValue(cacheKey, payload);
    return {
      ...payload,
      source: "runtime"
    };
  } catch (error) {
    const cachedPayload = getCachedValue(cacheKey);

    if (cachedPayload) {
      return {
        ...cachedPayload,
        source: "cache",
        fallback_reason: error.message
      };
    }

    return {
      product_key: session.productKey,
      subject_id: session.installationId,
      access_state: "denied",
      decision_source: "mobile_fallback",
      quota_remaining: 0,
      entitlement_snapshot: null,
      denial_reason: error.message,
      source: "error"
    };
  }
}

export function createEntitlementCheckStub() {
  return {
    capability: "access.evaluate",
    contractStatus: "local_runtime_first"
  };
}
