import { canonicalDiscountField, canonicalRewardField, canonicalTimezone } from "../../../shared/constants/index.js";

export function createAdminContractMap() {
  return {
    timezone: canonicalTimezone,
    discountCanonical: canonicalDiscountField,
    rewardCanonical: canonicalRewardField,
    stage: "H0",
    writesBusinessFacts: false,
    runtimeMode: "local_remote_foundation",
    remoteReady: true,
    inboxTruth: "notification_inbox",
    pushTransport: "notification_deliveries"
  };
}
