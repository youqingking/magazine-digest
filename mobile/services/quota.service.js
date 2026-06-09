import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadQuotaStatus() {
  return runtimeGateway.getQuotaStatus();
}
