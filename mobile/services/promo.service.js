import { runtimeGateway } from "./runtime-gateway.service.js";

export async function previewPromoCode(promoCode, pricingPlanId = null) {
  return runtimeGateway.previewPromo({
    promo_code: promoCode,
    pricing_plan_id: pricingPlanId
  });
}
