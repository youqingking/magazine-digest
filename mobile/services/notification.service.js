import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadNotificationInbox(statusFilter = "all") {
  return runtimeGateway.getNotificationInbox({
    status_filter: statusFilter
  });
}

export async function loadNotificationPrefs() {
  return runtimeGateway.getNotificationPrefs();
}

export async function updateNotificationPrefs(update) {
  return runtimeGateway.updateNotificationPrefs({
    update
  });
}

export async function markInboxItemsRead(inboxIds = [], markAllBefore = null) {
  return runtimeGateway.markInboxRead({
    inbox_ids: inboxIds,
    mark_all_before: markAllBefore
  });
}
