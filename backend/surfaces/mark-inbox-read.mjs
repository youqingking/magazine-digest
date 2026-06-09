import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createMarkInboxReadSurface({ repository, runtimeConfig }) {
  return function markInboxRead(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    return repository.markInboxRead(
      productKey,
      userId,
      request.inbox_ids || [],
      request.mark_all_before || null
    );
  };
}
