export function createRemoteRuntimeAdapter({ runtimeConfig, localAdapter }) {
  const source = "remote_config_stub";

  function wrapSurface(surfaceName) {
    const localSurface = localAdapter.surfaces[surfaceName];

    return function remoteSurface(request = {}) {
      const baseResponse = typeof localSurface === "function" ? localSurface(request) : {};
      return {
        ...baseResponse,
        runtime_mode: "remote",
        runtime_source: source,
        remote_base_url: runtimeConfig.remoteBaseUrl,
        remote_project_id: runtimeConfig.remoteProjectId,
        remote_app_id: runtimeConfig.remoteAppId,
        remote_ready: false,
        fallback_used: true
      };
    };
  }

  return {
    repository: localAdapter.repository,
    mode: "remote",
    source,
    surfaces: Object.fromEntries(
      Object.keys(localAdapter.surfaces).map((surfaceName) => [surfaceName, wrapSurface(surfaceName)])
    )
  };
}
