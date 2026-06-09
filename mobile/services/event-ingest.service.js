import { runtimeGateway } from "./runtime-gateway.service.js";
import { getSessionState } from "../stores/session.store.js";

const eventQueue = [];

function buildDedupKey(eventName, payload) {
  const session = getSessionState();
  const articleId = payload && payload.article_id ? payload.article_id : "none";
  const variantId = payload && payload.article_variant_id ? payload.article_variant_id : "none";
  const step = payload && payload.progress_percent ? payload.progress_percent : "0";

  return [
    session.productKey,
    eventName,
    session.installationId,
    articleId,
    variantId,
    step
  ].join(":");
}

export async function ingestRuntimeEvent(eventName, payload = {}) {
  const session = getSessionState();
  const request = {
    event_name: eventName,
    request_id: "req_mobile_" + Date.now().toString(36),
    dedup_key: buildDedupKey(eventName, payload),
    occurred_at: new Date().toISOString(),
    payload: {
      platform: "android_local_runtime",
      runtime_mode: session.runtimeMode,
      product_key: session.productKey,
      ...payload
    }
  };
  const response = await runtimeGateway.ingestEvent(request);

  eventQueue.push({
    request,
    response
  });

  return response;
}

export function listQueuedEvents() {
  return eventQueue.slice();
}

export function getLastQueuedEvent() {
  return eventQueue.length ? eventQueue[eventQueue.length - 1] : null;
}

export function createEventIngestStub() {
  return {
    capability: "event.ingest",
    contractStatus: "local_runtime_first"
  };
}
