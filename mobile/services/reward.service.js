import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadRewardSummary() {
  return runtimeGateway.getRewardSummary();
}
