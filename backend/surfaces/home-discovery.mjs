import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createHomeDiscoverySurface({ repository, runtimeConfig }) {
  return function homeDiscovery(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    return repository.buildHomeDiscovery(productKey, userId);
  };
}
