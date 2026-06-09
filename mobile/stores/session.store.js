import {
  buildSessionCacheKey,
  buildSettingsCacheKey,
  getCachedValue,
  setCachedValue
} from "../services/cache.service.js";
import { getRuntimeState, setRuntimeModeState } from "./runtime.store.js";

function buildInstallationId() {
  return "inst_mobile_" + Math.random().toString(36).slice(2, 10);
}

const defaultState = {
  productKey: "demo_cn_content",
  userId: "user_local_stage_e0",
  installationId: buildInstallationId(),
  syncCursor: null,
  runtimeMode: "local",
  adapterLabel: "local-runtime-first",
  uiStage: "stage_ui1"
};

const cachedSession = getCachedValue(buildSessionCacheKey()) || {};
const cachedSettings = getCachedValue(buildSettingsCacheKey()) || {};

const sessionState = {
  ...defaultState,
  ...cachedSession,
  runtimeMode: getRuntimeState().runtimeMode || cachedSettings.runtime_mode || cachedSession.runtimeMode || defaultState.runtimeMode,
  adapterLabel: getRuntimeState().adapterLabel || defaultState.adapterLabel
};

function persistSession() {
  setCachedValue(buildSessionCacheKey(), sessionState);
}

function persistRuntimeMode() {
  const currentSettings = getCachedValue(buildSettingsCacheKey()) || {};
  setCachedValue(buildSettingsCacheKey(), {
    ...currentSettings,
    runtime_mode: sessionState.runtimeMode
  });
}

export function getSessionState() {
  return sessionState;
}

export function setSyncCursor(cursor) {
  sessionState.syncCursor = cursor;
  persistSession();
}

export function setRuntimeMode(runtimeMode) {
  setRuntimeModeState(runtimeMode);
  const runtimeState = getRuntimeState();
  sessionState.runtimeMode = runtimeState.runtimeMode;
  sessionState.adapterLabel = runtimeState.adapterLabel;
  persistSession();
  persistRuntimeMode();
}

export function setSessionUserId(userId) {
  sessionState.userId = typeof userId === "string" && userId ? userId : defaultState.userId;
  persistSession();
}

export function resetSessionState() {
  sessionState.productKey = defaultState.productKey;
  sessionState.userId = defaultState.userId;
  sessionState.installationId = buildInstallationId();
  sessionState.syncCursor = null;
  sessionState.runtimeMode = defaultState.runtimeMode;
  sessionState.adapterLabel = getRuntimeState().adapterLabel || defaultState.adapterLabel;
  persistSession();
  persistRuntimeMode();
}
