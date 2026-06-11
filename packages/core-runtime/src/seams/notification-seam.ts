import type { RuntimeServiceSeam } from "./supabase-seam.ts";

export function describeNotificationSeam(productKey: string): RuntimeServiceSeam {
  return {
    name: "Product notification seam",
    product_key: productKey,
    status: "placeholder",
    connects: false,
    note: "Reserved for future device registration, inbox state, preference state, and delivery previews."
  };
}
