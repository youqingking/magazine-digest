import { loadCommercialOffer, loadCampaignLanding, loadProfileBenefits } from "../services/commercial.service.js";
import { previewPromoCode } from "../services/promo.service.js";
import { loadQuotaStatus } from "../services/quota.service.js";

const state = {
  status: "idle",
  offer: null,
  quota: null,
  promoPreview: null,
  campaignLanding: null,
  profileBenefits: null,
  errorMessage: ""
};

export function getCommercialState() {
  return state;
}

export async function refreshCommercialFoundation() {
  state.status = "loading";
  state.errorMessage = "";

  try {
    const [offer, quota, campaignLanding, profileBenefits] = await Promise.all([
      loadCommercialOffer(),
      loadQuotaStatus(),
      loadCampaignLanding(),
      loadProfileBenefits()
    ]);

    state.offer = offer;
    state.quota = quota;
    state.campaignLanding = campaignLanding;
    state.profileBenefits = profileBenefits;
    state.status = "ready";
    return state;
  } catch (error) {
    state.status = "error";
    state.errorMessage = error.message;
    throw error;
  }
}

export async function runPromoPreview(promoCode, pricingPlanId = null) {
  state.promoPreview = await previewPromoCode(promoCode, pricingPlanId);
  return state.promoPreview;
}
