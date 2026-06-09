export function createAuthRefreshSurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function authRefresh(request = {}) {
    return {
      refresh_state: adapterMode === "remote" ? "remote_stubbed" : "local_stubbed",
      session_state: "refreshed",
      refreshed_at: runtimeConfig.now || new Date().toISOString(),
      token_state: adapterMode === "remote" ? "placeholder_rotated" : "local_rotated",
      runtime_mode: adapterMode,
      source,
      product_key: request.product_key || runtimeConfig.productKey
    };
  };
}
