export const canonicalTimezone = "Asia/Shanghai";
export const canonicalMoneyUnit = "fen";
export const canonicalDiscountField = "price_multiplier_basis_points";
export const canonicalRewardField = "vip_days";

export const audienceSegments = ["general", "teen", "adult"];
export const readingModes = ["quick_30s", "deep_3m"];
export const publishStatuses = [
  "draft",
  "review_pending",
  "approved",
  "scheduled",
  "published",
  "paused",
  "archived"
];
export const paymentOrderStatuses = [
  "created",
  "pending_payment",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "closed"
];
export const subscriptionStatuses = [
  "trial",
  "active",
  "grace",
  "paused",
  "cancelled",
  "expired"
];
export const eventNames = [
  "article_impression",
  "article_open",
  "variant_switch",
  "read_progress",
  "paywall_impression",
  "paywall_dismiss",
  "plan_select",
  "purchase_success",
  "purchase_fail",
  "share_click",
  "share_success",
  "invite_bind_success",
  "promo_redeem_success",
  "paywall_offer_impression",
  "quota_exhausted",
  "promo_apply_attempt",
  "promo_apply_success",
  "promo_apply_fail",
  "invite_preview_open",
  "referral_share_click",
  "reward_summary_open",
  "entitlement_view",
  "campaign_open",
  "auth_session_open",
  "auth_signin_placeholder",
  "auth_signout",
  "device_register",
  "push_capability_refresh",
  "push_delivery_preview",
  "runtime_mode_switch",
  "remote_adapter_fallback",
  "remote_adapter_error"
];

export function createRuntimeConfigStub(overrides = {}) {
  return {
    productKey: "demo_reader",
    timezone: canonicalTimezone,
    moneyUnit: canonicalMoneyUnit,
    discountCanonical: canonicalDiscountField,
    rewardCanonical: canonicalRewardField,
    configSource: "stage-c-shell",
    ...overrides
  };
}
