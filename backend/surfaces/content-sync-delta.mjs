import {
  assertProductKey,
  assertRequiredInteger
} from "../guards/request-guards.mjs";

export function createContentSyncDeltaSurface({ repository, runtimeConfig }) {
  return function contentSyncDelta(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const limit = assertRequiredInteger("limit", request.limit, 1);
    const allChanges = repository.listContentChanges(productKey, request.last_sync_cursor);
    const changes = allChanges.slice(0, limit);
    const lastItem = changes.at(-1);
    const serverCursor = lastItem
      ? lastItem.updated_at + "|" + lastItem._id
      : request.last_sync_cursor ?? runtimeConfig.now + "|sync_empty";

    return {
      server_cursor: serverCursor,
      has_more: allChanges.length > changes.length,
      items: changes.map((item) => item.payload),
      tombstones: []
    };
  };
}
