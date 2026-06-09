import { assertAllowedValue } from "../../shared/utils/contract-guards.js";

export function assertRequiredString(label, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("[contract] " + label + " must be a non-empty string");
  }

  return value;
}

export function assertRequiredInteger(label, value, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error("[contract] " + label + " must be an integer >= " + minimum);
  }

  return value;
}

export function assertProductKey(request, runtimeConfig) {
  const productKey = assertRequiredString("product_key", request.product_key);

  if (productKey !== runtimeConfig.productKey) {
    throw new Error(
      "[contract] unsupported product_key for local runtime: " + productKey
    );
  }

  return productKey;
}

export function assertAudienceSegment(value) {
  return assertAllowedValue("audience_segment", value, [
    "teen",
    "general",
    "adult"
  ]);
}

export function assertReadingMode(value) {
  return assertAllowedValue("reading_mode", value, ["quick_30s", "deep_3m"]);
}
