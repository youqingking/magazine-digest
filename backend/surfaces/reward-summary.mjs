import { assertProductKey } from "../guards/request-guards.mjs";

export function createRewardSummarySurface({ repository, runtimeConfig }) {
  return function rewardSummary(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getRewardSummary(productKey);
  };
}
