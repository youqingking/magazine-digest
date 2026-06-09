import runtimeSource from "../fixtures/runtime/runtime-source.js";
import { getBaseRuntimeFixtures, getCurrentRuntimeFixtures, getCurrentRuntimeMeta } from "./runtime-fixtures.service.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let runtimeSourceRegistryCache = null;

function supportsRegistryBackedSources() {
  return typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    /^https?:/i.test(window.location.protocol || "");
}

function getRuntimeSourceRegistry() {
  if (runtimeSourceRegistryCache) {
    return runtimeSourceRegistryCache;
  }

  if (!supportsRegistryBackedSources()) {
    runtimeSourceRegistryCache = { scenarios: {}, channels: {}, releases: {} };
    return runtimeSourceRegistryCache;
  }

  try {
    // #ifdef H5
    const moduleValue = require("../fixtures/runtime/source-registry.js");
    runtimeSourceRegistryCache = moduleValue?.default || moduleValue || { scenarios: {}, channels: {}, releases: {} };
    // #endif
    // #ifndef H5
    runtimeSourceRegistryCache = { scenarios: {}, channels: {}, releases: {} };
    // #endif
  } catch (error) {
    runtimeSourceRegistryCache = { scenarios: {}, channels: {}, releases: {} };
  }

  return runtimeSourceRegistryCache;
}

function buildEffectiveRuntimeSourceState() {
  const state = getRuntimeSourceState();
  if (!supportsRegistryBackedSources()) {
    return state;
  }
  const metadata = getCurrentRuntimeMeta();
  if (metadata.dev_preview_source_mode) {
    return {
      ...state,
      mode: metadata.dev_preview_source_mode,
      scenario_id: metadata.dev_preview_source_scenario_id || metadata.selected_scenario_id || state.scenario_id || null,
      channel: metadata.dev_preview_source_channel || state.channel || null,
      release_id: metadata.dev_preview_source_release_id || state.release_id || null,
      selection_reason: metadata.selection_source || state.selection_reason || null
    };
  }
  return state;
}

function resolveScenarioPreview(scenarioId) {
  return getRuntimeSourceRegistry()?.scenarios?.[scenarioId]?.bundle || null;
}

function resolveChannelHead(channel) {
  const registry = getRuntimeSourceRegistry();
  const manifest = registry?.channels?.[channel] || null;
  const releaseId = manifest?.current_release_id || runtimeSource.release_id || null;
  return releaseId ? registry?.releases?.[releaseId]?.bundle || null : null;
}

function resolveRemoteChannelFallback(channel) {
  return resolveChannelHead(channel) || getCurrentRuntimeFixtures() || getBaseRuntimeFixtures();
}

export function getRuntimeSourceState() {
  return clone(runtimeSource || {});
}

export function resolveRuntimeFixtures() {
  const state = buildEffectiveRuntimeSourceState();
  const canUseRegistryBackedSources = supportsRegistryBackedSources();
  const currentRuntimeFixtures = getCurrentRuntimeFixtures();
  const baseRuntimeFixtures = getBaseRuntimeFixtures();

  if (!canUseRegistryBackedSources) {
    return currentRuntimeFixtures || baseRuntimeFixtures;
  }

  if (state.mode === "scenario_preview" && state.scenario_id) {
    return resolveScenarioPreview(state.scenario_id) || currentRuntimeFixtures || baseRuntimeFixtures;
  }
  if (state.mode === "channel_head" && state.channel) {
    return resolveChannelHead(state.channel) || currentRuntimeFixtures || baseRuntimeFixtures;
  }
  if (state.mode === "remote_channel_head" && state.channel) {
    return resolveRemoteChannelFallback(state.channel);
  }
  const currentRuntimeMeta = getCurrentRuntimeMeta();
  if (
    currentRuntimeMeta?.runtime_fixture_role === "selected_scenario_mirror" ||
    currentRuntimeMeta?.source_kind === "synthetic_test_pack" ||
    currentRuntimeMeta?.source_kind === "real_content_pilot"
  ) {
    return currentRuntimeFixtures || baseRuntimeFixtures;
  }
  return baseRuntimeFixtures;
}

export function getRuntimeSourceSummary() {
  const state = buildEffectiveRuntimeSourceState();
  const fixtures = resolveRuntimeFixtures();
  const metadata = fixtures?.metadata || {};
  const currentRuntimeMeta = getCurrentRuntimeMeta();
  const registry = state.channel && supportsRegistryBackedSources() ? getRuntimeSourceRegistry() : null;
  const channel = state.channel ? registry?.channels?.[state.channel] || null : null;
  const fallbackTarget = state.mode === "remote_channel_head" && supportsRegistryBackedSources()
    ? (resolveChannelHead(state.channel) ? "local_channel_head" : "current_mirror")
    : null;
  const visiblePublications = Array.from(new Set(
    ((fixtures?.discoveryCatalog?.items || fixtures?.contentSyncDelta?.response?.items || [])
      .map((item) => item.publication_key)
      .filter(Boolean))
  ));
  return {
    mode: state.mode || "current_mirror",
    scenarioId: state.scenario_id || metadata.scenario_id || null,
    channel: state.channel || null,
    releaseId: state.release_id || channel?.current_release_id || null,
    remoteBaseUrl: state.remote_base_url || null,
    fallbackTarget,
    selectionReason: state.selection_reason || null,
    fixtureRole: metadata.runtime_fixture_role || null,
    currentMirrorScenarioId: currentRuntimeMeta?.selected_scenario_id || null,
    visiblePublications
  };
}
