export function createPushCapabilitySurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function pushCapability(request = {}) {
    const hasCid = Boolean(request.push_clientid);

    return {
      capability_state: hasCid ? "cid_present" : "cid_missing",
      permission_state: request.permission_state || "prompt",
      transport_state: adapterMode === "remote" ? "remote_stubbed" : "local_stubbed",
      push_enabled: hasCid,
      push_clientid_present: hasCid,
      push_clientid: request.push_clientid || null,
      push_appid: request.appid || runtimeConfig.remotePushAppId || "demo-push-app",
      product_key: request.product_key || runtimeConfig.productKey,
      installation_id: request.installation_id || "inst_local_stub",
      source
    };
  };
}
