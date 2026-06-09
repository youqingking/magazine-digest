import { createLocalRuntimeAdapter } from "../adapters/local-runtime-adapter.mjs";
import { createRemoteRuntimeAdapter } from "../adapters/remote-runtime-adapter.mjs";
import { selectRuntimeAdapter } from "./runtime-mode-selector.mjs";

export function createBackendRuntime(runtimeConfig) {
  const localAdapter = createLocalRuntimeAdapter(runtimeConfig);
  const remoteAdapter = createRemoteRuntimeAdapter({
    runtimeConfig,
    localAdapter
  });
  const hybridAdapter = {
    ...remoteAdapter,
    mode: "hybrid",
    source: "hybrid_remote_with_local_fallback",
    surfaces: Object.fromEntries(
      Object.entries(remoteAdapter.surfaces).map(([surfaceName, surface]) => [
        surfaceName,
        (request = {}) => ({
          ...surface(request),
          runtime_mode: "hybrid"
        })
      ])
    )
  };
  const selected = selectRuntimeAdapter({
    runtimeMode: runtimeConfig.runtimeMode,
    adapters: {
      local: localAdapter,
      remote: remoteAdapter,
      hybrid: hybridAdapter
    }
  });

  return {
    repository: localAdapter.repository,
    runtimeConfig,
    mode: selected.mode,
    adapters: {
      local: localAdapter,
      remote: remoteAdapter,
      hybrid: hybridAdapter
    },
    surfaces: selected.adapter.surfaces
  };
}
