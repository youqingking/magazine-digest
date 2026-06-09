import { runtimeGateway } from "./runtime-gateway.service.js";
import {
  buildPricingCacheKey,
  getCachedValue,
  setCachedValue
} from "./cache.service.js";
import { getSessionState } from "../stores/session.store.js";
import { canonicalDiscountField, canonicalMoneyUnit } from "../contracts/runtime-contract.js";
import { formatMoneyFromFen } from "../utils/format-money.js";

export function formatFenToPrice(fen) {
  return formatMoneyFromFen(fen, {
    currency: "CNY"
  });
}

export async function loadPricingPreviewCatalog() {
  const session = getSessionState();
  const cacheKey = buildPricingCacheKey(session.productKey);

  try {
    const previews = await runtimeGateway.getPricingPreviewCatalog();
    const payload = {
      previews,
      source: "runtime"
    };

    setCachedValue(cacheKey, payload);
    return payload;
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
      previews: [],
      source: "error",
      error_message: error.message
    };
  }
}

export function createPricingResolveStub() {
  return {
    capability: "pricing.resolve",
    contractStatus: "local_runtime_first",
    moneyUnit: canonicalMoneyUnit,
    discountField: canonicalDiscountField,
    valuesFromContractOnly: true
  };
}
