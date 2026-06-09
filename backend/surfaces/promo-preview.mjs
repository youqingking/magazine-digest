import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createPromoPreviewSurface({ repository, runtimeConfig }) {
  return function promoPreview(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const promoCode = assertRequiredString("promo_code", request.promo_code);
    return repository.previewPromo(productKey, promoCode, request.pricing_plan_id || null);
  };
}
