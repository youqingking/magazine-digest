import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadReferralSummary() {
  return runtimeGateway.getReferralSummary();
}
