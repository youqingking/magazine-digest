import { randomUUID } from "node:crypto";
import {
  assertProductKey,
  assertRequiredString
} from "../guards/request-guards.mjs";

export function createEventIngestSurface({ repository, runtimeConfig }) {
  return function eventIngest(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const eventName = assertRequiredString("event_name", request.event_name);
    const dedupKey = assertRequiredString("dedup_key", request.dedup_key);
    const requestId = assertRequiredString("request_id", request.request_id);
    const occurredAt = assertRequiredString("occurred_at", request.occurred_at);

    const ingestResult = repository.ingestEvent({
      _id: "evt_runtime_" + randomUUID(),
      product_key: productKey,
      event_name: eventName,
      request_id: requestId,
      dedup_key: dedupKey,
      occurred_at: occurredAt,
      server_received_at: runtimeConfig.now,
      source: "client",
      payload: request.payload ?? {}
    });

    return {
      product_key: productKey,
      ingest_status: ingestResult.status,
      dedup_key: dedupKey,
      event_id: ingestResult.event._id
    };
  };
}
