import type { RuntimeServiceSeam } from "./supabase-seam.ts";

export function describeRevenueCatEntitlementSeam(productKey: string): RuntimeServiceSeam {
  return {
    name: "RevenueCat entitlement seam",
    product_key: productKey,
    status: "placeholder",
    connects: false,
    note: "Reserved for future entitlement snapshots; this shell does not define prices, quotas, or grants."
  };
}
