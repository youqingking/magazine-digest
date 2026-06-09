import baseRuntimeFixtures from "../fixtures/runtime/index.js";

let currentRuntimeBundleCache = null;
let currentRuntimeMetaCache = null;

function isH5Runtime() {
  return typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    /^https?:/i.test(window.location.protocol || "");
}

function unwrapModule(moduleValue, fallback) {
  return moduleValue?.default || moduleValue || fallback;
}

export function getBaseRuntimeFixtures() {
  return baseRuntimeFixtures;
}

export function getCurrentRuntimeMeta() {
  if (currentRuntimeMetaCache) {
    return currentRuntimeMetaCache;
  }
  try {
    currentRuntimeMetaCache = unwrapModule(require("../fixtures/runtime/current/scenario-meta.json"), {});
  } catch (error) {
    currentRuntimeMetaCache = {};
  }
  return currentRuntimeMetaCache;
}

export function getCurrentRuntimeFixtures() {
  if (currentRuntimeBundleCache) {
    return currentRuntimeBundleCache;
  }
  try {
    if (isH5Runtime()) {
      currentRuntimeBundleCache = unwrapModule(require("../fixtures/runtime/current/runtime.bundle.json"), null);
    } else {
      currentRuntimeBundleCache = unwrapModule(require("../fixtures/runtime/current/index.js"), null);
    }
  } catch (error) {
    currentRuntimeBundleCache = null;
  }
  return currentRuntimeBundleCache;
}

export function getRuntimeFixturesDebugSummary() {
  const currentMeta = getCurrentRuntimeMeta();
  const currentFixtures = getCurrentRuntimeFixtures();
  const baseFixtures = getBaseRuntimeFixtures();
  return {
    current_meta_loaded: Object.keys(currentMeta || {}).length > 0,
    current_meta_scenario_id: currentMeta?.scenario_id || null,
    current_fixture_loaded: Boolean(currentFixtures),
    current_discovery_count: currentFixtures?.discoveryCatalog?.items?.length || 0,
    current_sync_items_count: currentFixtures?.contentSyncDelta?.response?.items?.length || 0,
    base_discovery_count: baseFixtures?.discoveryCatalog?.items?.length || 0,
    base_sync_items_count: baseFixtures?.contentSyncDelta?.response?.items?.length || 0
  };
}
