import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createSaveForLaterSurface({ repository, runtimeConfig }) {
  return function saveForLater(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    const articleId = assertRequiredString("article_id", request.article_id);
    const desiredState = assertRequiredString("desired_state", request.desired_state);
    return repository.toggleSaveForLater(productKey, userId, articleId, desiredState);
  };
}
