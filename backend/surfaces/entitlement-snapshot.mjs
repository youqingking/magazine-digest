import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createEntitlementSnapshotSurface({ runtimeConfig }) {
  return function entitlementSnapshot(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const subjectId = assertRequiredString(
      "user_id_or_installation_id",
      request.user_id ?? request.installation_id
    );

    return {
      product_key: productKey,
      subject_id: subjectId,
      access_state: "denied",
      decision_source: "local_runtime_stub",
      quota_remaining: 0,
      entitlement_snapshot: null,
      denial_reason: "LOCAL_RUNTIME_NO_BILLING_FACTS"
    };
  };
}
