import {
  assertProductKey,
  assertRequiredString
} from "../guards/request-guards.mjs";

export function createPricingPreviewSurface({ repository, runtimeConfig }) {
  return function pricingPreview(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const pricingPlanId = assertRequiredString("pricing_plan_id", request.pricing_plan_id);
    const plan = repository.getPricingPlan(pricingPlanId, productKey);

    if (!plan) {
      throw new Error("[contract] pricing_plan_id not found: " + pricingPlanId);
    }

    let appliedCampaign = null;
    let multiplier = 10000;

    if (request.promo_code) {
      const promoCode = repository.getPromoCode(request.promo_code, productKey);
      if (promoCode) {
        appliedCampaign = repository.getPromoCampaign(promoCode.campaign_id, productKey);
        if (appliedCampaign?.price_multiplier_basis_points) {
          multiplier = appliedCampaign.price_multiplier_basis_points;
        }
      }
    }

    const discountedAmount = Math.floor((plan.price_fen * multiplier) / 10000);
    const finalAmount = Math.max(discountedAmount, plan.price_floor_fen);

    return {
      product_key: productKey,
      pricing_plan_id: pricingPlanId,
      original_amount_fen: plan.price_fen,
      final_amount_fen: finalAmount,
      price_floor_fen: plan.price_floor_fen,
      applied_price_multiplier_basis_points: multiplier,
      floor_applied: finalAmount !== discountedAmount,
      campaign_id: appliedCampaign?._id ?? null,
      denial_reason: null
    };
  };
}
