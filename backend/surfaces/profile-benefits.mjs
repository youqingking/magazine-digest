import { assertProductKey } from "../guards/request-guards.mjs";

export function createProfileBenefitsSurface({ repository, runtimeConfig }) {
  return function profileBenefits(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getProfileBenefits(productKey);
  };
}
