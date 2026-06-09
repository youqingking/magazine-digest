import { assertProductKey } from "../guards/request-guards.mjs";

export function createCampaignLandingSurface({ repository, runtimeConfig }) {
  return function campaignLanding(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getCampaignLanding(productKey);
  };
}
