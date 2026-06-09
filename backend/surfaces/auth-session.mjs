function buildSessionSummary(runtimeConfig, request = {}, adapterMode, source) {
  const now = runtimeConfig.now || new Date().toISOString();
  const userId = request.user_id || "user_local_stage_e0";

  return {
    session_state: adapterMode === "remote" ? "remote_stubbed" : "active_local_stub",
    auth_provider: runtimeConfig.remoteAuthProvider || "local_stub",
    user_id: userId,
    session_id: `sess_${adapterMode}_${userId}`,
    token_state: adapterMode === "remote" ? "placeholder_required" : "local_present",
    expires_at: new Date(new Date(now).getTime() + 60 * 60 * 1000).toISOString(),
    runtime_mode: adapterMode,
    source,
    product_key: request.product_key || runtimeConfig.productKey
  };
}

export function createAuthSessionSurface({ runtimeConfig, adapterMode = "local", source = "local_fixture" }) {
  return function authSession(request = {}) {
    return buildSessionSummary(runtimeConfig, request, adapterMode, source);
  };
}
