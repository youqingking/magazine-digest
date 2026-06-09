import { createBackendRuntimeConfig } from "./config/runtime-config.mjs";
import { backendSurfaceRegistry } from "./contracts/surfaces.mjs";
import { createBackendRuntime } from "./runtime/create-runtime.mjs";

export function createLocalBackendRuntime(overrides = {}) {
  const runtimeConfig = createBackendRuntimeConfig({
    runtimeMode: "local",
    ...overrides
  });
  return createBackendRuntime(runtimeConfig);
}

export function createRemoteBackendRuntime(overrides = {}) {
  const runtimeConfig = createBackendRuntimeConfig({
    runtimeMode: "remote",
    ...overrides
  });
  return createBackendRuntime(runtimeConfig);
}

export function createHybridBackendRuntime(overrides = {}) {
  const runtimeConfig = createBackendRuntimeConfig({
    runtimeMode: "hybrid",
    ...overrides
  });
  return createBackendRuntime(runtimeConfig);
}

export function listBackendSurfaces() {
  return backendSurfaceRegistry;
}

export function runBackendSmoke() {
  const runtime = createLocalBackendRuntime();
  return {
    runtime: runtime.runtimeConfig,
    surfaces: backendSurfaceRegistry,
    samples: {
      bootstrapConfig: runtime.surfaces["bootstrap-config"]({
        product_key: runtime.runtimeConfig.productKey
      }),
      contentSyncDelta: runtime.surfaces["content-sync-delta"]({
        product_key: runtime.runtimeConfig.productKey,
        installation_id: "inst_smoke_001",
        last_sync_cursor: null,
        limit: 10
      }),
      contentDetail: runtime.surfaces["content-detail"]({
        product_key: runtime.runtimeConfig.productKey,
        article_id: "art_nebula_launch",
        language: "zh-CN",
        audience_segment: "teen",
        reading_mode: "quick_30s",
        request_id: "req_smoke_content_001"
      }),
      entitlementSnapshot: runtime.surfaces["entitlement-snapshot"]({
        product_key: runtime.runtimeConfig.productKey,
        installation_id: "inst_smoke_001"
      }),
      pricingPreview: runtime.surfaces["pricing-preview"]({
        product_key: runtime.runtimeConfig.productKey,
        pricing_plan_id: "plan_demo_monthly",
        promo_code: "BETA30A001"
      }),
      experimentAssign: runtime.surfaces["experiment-assign"]({
        product_key: runtime.runtimeConfig.productKey,
        installation_id: "inst_smoke_001"
      }),
      eventIngest: runtime.surfaces["event-ingest"]({
        product_key: runtime.runtimeConfig.productKey,
        event_name: "article_open",
        request_id: "req_smoke_evt_001",
        dedup_key: "demo_cn_content:article_open:req_smoke_evt_001",
        occurred_at: "2026-03-17T00:00:00+08:00",
        payload: { platform: "android" }
      }),
      homeDiscovery: runtime.surfaces["home-discovery"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0",
        installation_id: "inst_smoke_001"
      }),
      searchContent: runtime.surfaces["search-content"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0",
        query: "政策",
        filters: {}
      }),
      notificationInbox: runtime.surfaces["notification-inbox"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0",
        status_filter: "all"
      }),
      contentResume: runtime.surfaces["content-resume"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0",
        limit: 3
      }),
      commercialOffer: runtime.surfaces["commercial-offer"]({
        product_key: runtime.runtimeConfig.productKey
      }),
      quotaStatus: runtime.surfaces["quota-status"]({
        product_key: runtime.runtimeConfig.productKey
      }),
      campaignLanding: runtime.surfaces["campaign-landing"]({
        product_key: runtime.runtimeConfig.productKey
      }),
      authSession: runtime.surfaces["auth-session"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0"
      }),
      registerDevice: runtime.surfaces["register-device"]({
        product_key: runtime.runtimeConfig.productKey,
        installation_id: "inst_smoke_001",
        device_id: "device_smoke_001",
        push_clientid: "cid_smoke_001",
        appid: "demo-mobile-app",
        last_seen_at: "2026-03-17T00:00:00+08:00"
      }),
      pushCapability: runtime.surfaces["push-capability"]({
        product_key: runtime.runtimeConfig.productKey,
        installation_id: "inst_smoke_001",
        push_clientid: "cid_smoke_001",
        permission_state: "granted"
      }),
      notificationDeliveryPreview: runtime.surfaces["notification-delivery-preview"]({
        product_key: runtime.runtimeConfig.productKey,
        user_id: "user_local_stage_e0",
        quiet_hours_active: true,
        notification_inbox_id: "inbox_smoke_001"
      })
    }
  };
}
