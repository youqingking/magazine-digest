function inferPreviewState(request = {}) {
  if (request.force_digest || request.digest_enabled) {
    return {
      preview_state: "digest_queued",
      transport_decision: "digest_queued",
      suppression_reason: null
    };
  }

  if (request.dedupe_hit) {
    return {
      preview_state: "deduped",
      transport_decision: "deduped",
      suppression_reason: "delivery_key_reused"
    };
  }

  if (request.quiet_hours_active) {
    return {
      preview_state: "suppressed",
      transport_decision: "suppressed_by_quiet_hours",
      suppression_reason: "quiet_hours"
    };
  }

  return {
    preview_state: "eligible",
    transport_decision: "eligible_for_delivery",
    suppression_reason: null
  };
}

export function createNotificationDeliveryPreviewSurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function notificationDeliveryPreview(request = {}) {
    const decision = inferPreviewState(request);

    return {
      ...decision,
      inbox_truth_state: "durable",
      delivery_channel: request.delivery_channel || "push",
      notification_inbox_id: request.notification_inbox_id || null,
      product_key: request.product_key || runtimeConfig.productKey,
      user_id: request.user_id || "user_local_stage_e0",
      publish_batch_id: request.publish_batch_id || null,
      article_id: request.article_id || null,
      runtime_mode: adapterMode,
      source
    };
  };
}
