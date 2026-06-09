import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadCommercialOffer() {
  return runtimeGateway.getCommercialOffer();
}

export async function loadCampaignLanding() {
  return runtimeGateway.getCampaignLanding();
}

export async function loadProfileBenefits() {
  return runtimeGateway.getProfileBenefits();
}
