import { loadCampaignLanding } from "../services/commercial.service.js";
import { loadReferralSummary } from "../services/referral.service.js";
import { loadRewardSummary } from "../services/reward.service.js";

const state = {
  status: "idle",
  referralSummary: null,
  rewardSummary: null,
  campaignLanding: null,
  errorMessage: ""
};

export function getGrowthState() {
  return state;
}

export async function refreshGrowthFoundation() {
  state.status = "loading";
  state.errorMessage = "";

  try {
    const [referralSummary, rewardSummary, campaignLanding] = await Promise.all([
      loadReferralSummary(),
      loadRewardSummary(),
      loadCampaignLanding()
    ]);

    state.referralSummary = referralSummary;
    state.rewardSummary = rewardSummary;
    state.campaignLanding = campaignLanding;
    state.status = "ready";
    return state;
  } catch (error) {
    state.status = "error";
    state.errorMessage = error.message;
    throw error;
  }
}
