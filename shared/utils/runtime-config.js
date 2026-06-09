import {
  canonicalDiscountField,
  canonicalMoneyUnit,
  canonicalRewardField,
  canonicalTimezone
} from "../constants/index.js";

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
