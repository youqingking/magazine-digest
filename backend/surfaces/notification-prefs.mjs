import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createNotificationPrefsSurface({ repository, runtimeConfig }) {
  return function notificationPrefs(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);

    if (request.update) {
      const updated = repository.updateNotificationPrefs(productKey, userId, request.update);
      return normalizePrefs(updated);
    }

    return normalizePrefs(repository.getNotificationPrefs(productKey, userId));
  };
}

function normalizePrefs(record) {
  return {
    ...record,
    enable_instant: Boolean(record.push_enabled),
    enable_digest: Boolean(record.digest_enabled),
    quiet_hours: {
      enabled: Boolean(record.quiet_hours_enabled),
      start_minute: record.quiet_hours_start_minute ?? 0,
      end_minute: record.quiet_hours_end_minute ?? 0
    },
    max_daily_push: record.max_daily_push ?? 3,
    followed_only: record.follow_alert_level === "immediate" || record.follow_alert_level === "digest_only"
  };
}
