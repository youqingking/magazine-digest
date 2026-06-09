export const runtimeModes = ["local", "remote", "hybrid"];

export function normalizeRuntimeMode(runtimeMode) {
  if (runtimeModes.includes(runtimeMode)) {
    return runtimeMode;
  }

  return "local";
}

export function selectRuntimeAdapter({ runtimeMode, adapters }) {
  const normalizedMode = normalizeRuntimeMode(runtimeMode);

  if (normalizedMode === "remote") {
    return {
      mode: normalizedMode,
      adapter: adapters.remote
    };
  }

  if (normalizedMode === "hybrid") {
    return {
      mode: normalizedMode,
      adapter: adapters.hybrid || adapters.remote
    };
  }

  return {
    mode: "local",
    adapter: adapters.local
  };
}
