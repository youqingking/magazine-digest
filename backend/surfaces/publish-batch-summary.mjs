import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createPublishBatchSummarySurface({ repository, runtimeConfig }) {
  return function publishBatchSummary(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const publishBatchId = assertRequiredString("publish_batch_id", request.publish_batch_id);
    const userId = assertRequiredString("user_id", request.user_id);
    return repository.getPublishBatchSummary(productKey, publishBatchId, userId);
  };
}
