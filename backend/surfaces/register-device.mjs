export function createRegisterDeviceSurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function registerDevice(request = {}) {
    return {
      registration_state: "registered",
      installation_id: request.installation_id || "inst_local_stub",
      device_id: request.device_id || request.installation_id || "device_local_stub",
      push_clientid: request.push_clientid || null,
      appid: request.appid || runtimeConfig.remoteAppId || "demo-mobile-app",
      product_key: request.product_key || runtimeConfig.productKey,
      last_seen_at: request.last_seen_at || runtimeConfig.now || new Date().toISOString(),
      runtime_mode: adapterMode,
      source
    };
  };
}
