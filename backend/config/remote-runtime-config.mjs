export function createRemoteRuntimeConfig(overrides = {}) {
  return {
    remoteBaseUrl: process.env.REMOTE_RUNTIME_BASE_URL || "https://placeholder.invalid/runtime",
    remoteProjectId: process.env.REMOTE_RUNTIME_PROJECT_ID || "demo-remote-project",
    remoteAppId: process.env.REMOTE_RUNTIME_APP_ID || "demo-remote-app",
    remotePushAppId: process.env.REMOTE_PUSH_APP_ID || "demo-remote-push-app",
    remoteAuthProvider: process.env.REMOTE_AUTH_PROVIDER || "uni-id",
    allowRemoteFallback: String(process.env.REMOTE_RUNTIME_ALLOW_FALLBACK || "true") !== "false",
    ...overrides
  };
}
