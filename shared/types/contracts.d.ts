export type ReadingMode = "quick_30s" | "deep_3m";
export type AudienceSegment = "general" | "teen" | "adult";
export type PublishStatus =
  | "draft"
  | "review_pending"
  | "approved"
  | "scheduled"
  | "published"
  | "paused"
  | "archived";
export type PaymentOrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "closed";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "paused"
  | "cancelled"
  | "expired";
export type EventName =
  | "article_impression"
  | "article_open"
  | "variant_switch"
  | "read_progress"
  | "paywall_impression"
  | "paywall_dismiss"
  | "plan_select"
  | "purchase_success"
  | "purchase_fail"
  | "share_click"
  | "share_success"
  | "invite_bind_success"
  | "promo_redeem_success";
