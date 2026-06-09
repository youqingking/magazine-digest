import { loadDiscoveryHome, loadPublishBatchSummary } from "../services/discovery.service.js";
import { buildUiStateCacheKey, getCachedValue, setCachedValue } from "../services/cache.service.js";

const feedUiDefaults = {
  activeTab: "curated",
  publicationKey: "all",
  issueKey: "all",
  updateType: "all",
  scrollTop: 0,
  restorePending: false,
  focus: ""
};

function readFeedUiState() {
  return {
    ...feedUiDefaults,
    ...(getCachedValue(buildUiStateCacheKey("feed-ui1")) || {})
  };
}

function persistFeedUiState() {
  setCachedValue(buildUiStateCacheKey("feed-ui1"), state.feedUi);
}

const state = {
  status: "idle",
  home: null,
  batchSummary: null,
  errorMessage: "",
  feedUi: readFeedUiState()
};

export function getDiscoveryState() {
  return state;
}

export async function refreshDiscoveryHome() {
  state.status = "loading";
  state.errorMessage = "";

  try {
    state.home = await loadDiscoveryHome();
    state.status = "ready";
    return state.home;
  } catch (error) {
    state.status = "error";
    state.errorMessage = error.message;
    throw error;
  }
}

export async function loadDiscoveryBatchSummary(publishBatchId) {
  state.batchSummary = await loadPublishBatchSummary(publishBatchId);
  return state.batchSummary;
}

export function setFeedUiState(patch = {}) {
  state.feedUi = {
    ...state.feedUi,
    ...patch
  };
  persistFeedUiState();
  return state.feedUi;
}

export function consumeFeedRestoreState() {
  const currentState = {
    ...state.feedUi
  };

  if (state.feedUi.restorePending) {
    state.feedUi.restorePending = false;
    persistFeedUiState();
  }

  return currentState;
}

export function resetFeedUiState() {
  state.feedUi = {
    ...feedUiDefaults
  };
  persistFeedUiState();
  return state.feedUi;
}
