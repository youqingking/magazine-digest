import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createNotificationInboxSurface({ repository, runtimeConfig }) {
  return function notificationInbox(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    const items = repository.listNotificationInbox(productKey, userId, request.status_filter || "all");

    return {
      items: items.map((item) => ({
        ...item,
        type: item.source_type,
        body: item.body_preview || "",
        reason: item.change_summary || item.source_type,
        target: item.action_target || null,
        is_read: item.status === "read"
      })),
      unread_count: repository.listNotificationInbox(productKey, userId, "unread").length,
      cursor: null,
      has_more: false
    };
  };
}
