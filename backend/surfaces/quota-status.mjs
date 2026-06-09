import { assertProductKey } from "../guards/request-guards.mjs";

export function createQuotaStatusSurface({ repository, runtimeConfig }) {
  return function quotaStatus(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getQuotaStatus(productKey);
  };
}
