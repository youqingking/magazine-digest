import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createContentResumeSurface({ repository, runtimeConfig }) {
  return function contentResume(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    return {
      items: repository.getContentResume(productKey, userId, Number(request.limit || 5)),
      server_time: runtimeConfig.now
    };
  };
}
