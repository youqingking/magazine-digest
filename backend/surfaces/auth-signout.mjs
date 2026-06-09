export function createAuthSignoutSurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function authSignout(request = {}) {
    return {
      signout_state: "cleared",
      session_state: "signed_out",
      cleared_at: runtimeConfig.now || new Date().toISOString(),
      runtime_mode: adapterMode,
      source,
      product_key: request.product_key || runtimeConfig.productKey
    };
  };
}
