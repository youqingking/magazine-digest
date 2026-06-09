import { assertProductKey } from "../guards/request-guards.mjs";

export function createCommercialOfferSurface({ repository, runtimeConfig }) {
  return function commercialOffer(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    return repository.getCommercialOffer(productKey);
  };
}
