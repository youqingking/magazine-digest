import { buildUiStateCacheKey, getCachedValue, setCachedValue } from "./cache.service.js";

function readScope(scope, defaults = {}) {
  return {
    ...defaults,
    ...(getCachedValue(buildUiStateCacheKey(scope)) || {})
  };
}

function writeScope(scope, value) {
  setCachedValue(buildUiStateCacheKey(scope), value);
  return value;
}

export function readRouteAliasState() {
  return readScope("route-alias", {
    lastAlias: null,
    target: null
  });
}

export function writeRouteAliasState(aliasName, target) {
  return writeScope("route-alias", {
    lastAlias: aliasName,
    target,
    redirected_at: new Date().toISOString()
  });
}

export function consumeRouteAliasState() {
  const current = readRouteAliasState();
  writeScope("route-alias", {
    lastAlias: null,
    target: null,
    redirected_at: null
  });
  return current;
}
