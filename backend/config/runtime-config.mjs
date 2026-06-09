import {
  canonicalDiscountField,
  canonicalMoneyUnit,
  canonicalRewardField,
  canonicalTimezone
} from "../../shared/constants/index.js";
import { createRemoteRuntimeConfig } from "./remote-runtime-config.mjs";

export function createBackendRuntimeConfig(overrides = {}) {
  const remoteConfig = createRemoteRuntimeConfig(overrides.remote || {});

  return {
    runtimeMode: "local",
    productKey: "demo_cn_content",
    timezone: canonicalTimezone,
    moneyUnit: canonicalMoneyUnit,
    discountCanonical: canonicalDiscountField,
    rewardCanonical: canonicalRewardField,
    fixtureRoot: "fixtures/db/seed",
    now: "2026-03-17T00:00:00+08:00",
    ...remoteConfig,
    ...overrides
  };
}
