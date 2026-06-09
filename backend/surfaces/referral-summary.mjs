import { assertProductKey } from "../guards/request-guards.mjs";

export function createReferralSummarySurface({ repository, runtimeConfig }) {
  return function referralSummary(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getReferralSummary(productKey);
  };
}
