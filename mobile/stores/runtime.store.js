import { buildSettingsCacheKey, getCachedValue, setCachedValue } from "../services/cache.service.js";
import { isLoopbackRemoteRuntimeBaseUrl, normalizeRemoteRuntimeBaseUrl } from "../services/remote-runtime-url.service.js";

const defaultRemoteBaseUrl =
  normalizeRemoteRuntimeBaseUrl(
    process.env.VUE_APP_MOBILE_REMOTE_RUNTIME_BASE_URL ||
    process.env.VUE_APP_REMOTE_RUNTIME_BASE_URL ||
    "http://8.136.215.40/magazine-runtime"
  );
const defaultRemoteChannel =
  String(process.env.VUE_APP_MOBILE_REMOTE_RUNTIME_CHANNEL || process.env.VUE_APP_REMOTE_RUNTIME_CHANNEL || "dev").trim() || "dev";
const defaultRemoteProjectId =
  String(process.env.VUE_APP_MOBILE_REMOTE_PROJECT_ID || "magazine-digest-dev").trim() || "magazine-digest-dev";
const defaultRemoteAppId =
  String(process.env.VUE_APP_MOBILE_REMOTE_APP_ID || "__UNI__005A993").trim() || "__UNI__005A993";
const defaultPushAppId =
  String(process.env.VUE_APP_MOBILE_PUSH_APP_ID || "NEED_HUMAN_UNI_PUSH_APP_ID").trim() || "NEED_HUMAN_UNI_PUSH_APP_ID";

const defaultState = {
  runtimeMode: isLoopbackRemoteRuntimeBaseUrl(defaultRemoteBaseUrl) ? "local" : "hybrid",
  adapterLabel: "本地优先",
  remoteBaseUrl: defaultRemoteBaseUrl,
  remoteChannel: defaultRemoteChannel,
  remoteProjectId: defaultRemoteProjectId,
  remoteAppId: defaultRemoteAppId,
  pushAppId: defaultPushAppId,
  lastSwitchAt: null,
  lastVisibleStatus: "当前使用本地数据"
};

const cachedSettings = getCachedValue(buildSettingsCacheKey()) || {};
const hasExplicitRuntimeModeSelection = cachedSettings.runtime_mode_user_selected === true;

function normalizeRuntimeMode(runtimeMode, remoteBaseUrl) {
  const normalizedMode = ["local", "remote", "hybrid"].includes(runtimeMode) ? runtimeMode : "local";
  const normalizedBaseUrl = normalizeRemoteRuntimeBaseUrl(remoteBaseUrl);
  const isLoopbackBaseUrl = isLoopbackRemoteRuntimeBaseUrl(normalizedBaseUrl);
  const isH5 =
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    /^https?:/i.test(window.location.protocol || "");

  if ((normalizedMode === "remote" || normalizedMode === "hybrid") && (!normalizedBaseUrl || (isLoopbackBaseUrl && !isH5))) {
    return "local";
  }
  return normalizedMode;
}

const state = {
  ...defaultState,
  remoteBaseUrl: normalizeRemoteRuntimeBaseUrl(cachedSettings.remote_base_url || defaultState.remoteBaseUrl),
  remoteChannel: cachedSettings.remote_channel || defaultState.remoteChannel,
  remoteProjectId: cachedSettings.remote_project_id || defaultState.remoteProjectId,
  remoteAppId: cachedSettings.remote_app_id || defaultState.remoteAppId,
  pushAppId: cachedSettings.push_app_id || defaultState.pushAppId,
  adapterLabel: cachedSettings.adapter_label || defaultState.adapterLabel,
  lastSwitchAt: cachedSettings.runtime_switched_at || null
};

state.runtimeMode = normalizeRuntimeMode(
  hasExplicitRuntimeModeSelection ? (cachedSettings.runtime_mode || defaultState.runtimeMode) : defaultState.runtimeMode,
  state.remoteBaseUrl
);

function persist() {
  const settings = getCachedValue(buildSettingsCacheKey()) || {};
  setCachedValue(buildSettingsCacheKey(), {
    ...settings,
    runtime_mode: state.runtimeMode,
    remote_base_url: state.remoteBaseUrl,
    remote_channel: state.remoteChannel,
    remote_project_id: state.remoteProjectId,
    remote_app_id: state.remoteAppId,
    push_app_id: state.pushAppId,
    runtime_mode_user_selected: settings.runtime_mode_user_selected === true,
    adapter_label: state.adapterLabel,
    runtime_switched_at: state.lastSwitchAt
  });
}

function syncLabel() {
  state.adapterLabel =
    state.runtimeMode === "remote"
      ? "远端接缝"
      : state.runtimeMode === "hybrid"
        ? "远端优先，失败回落本地"
        : "本地优先";
  state.lastVisibleStatus =
    state.runtimeMode === "remote"
      ? "当前使用远端接缝"
      : state.runtimeMode === "hybrid"
        ? "当前使用混合模式"
        : "当前使用本地数据";
}

syncLabel();

export function getRuntimeState() {
  return state;
}

export function setRuntimeModeState(runtimeMode, options = {}) {
  state.runtimeMode = ["local", "remote", "hybrid"].includes(runtimeMode) ? runtimeMode : "local";
  state.lastSwitchAt = new Date().toISOString();
  syncLabel();
  const settings = getCachedValue(buildSettingsCacheKey()) || {};
  setCachedValue(buildSettingsCacheKey(), {
    ...settings,
    runtime_mode_user_selected: options.userSelected !== false
  });
  persist();
}

export function setRemoteRuntimeConfig(update = {}) {
  state.remoteBaseUrl = normalizeRemoteRuntimeBaseUrl(update.remoteBaseUrl || state.remoteBaseUrl);
  state.remoteChannel = update.remoteChannel || state.remoteChannel;
  state.remoteProjectId = update.remoteProjectId || state.remoteProjectId;
  state.remoteAppId = update.remoteAppId || state.remoteAppId;
  state.pushAppId = update.pushAppId || state.pushAppId;
  state.runtimeMode = normalizeRuntimeMode(state.runtimeMode, state.remoteBaseUrl);
  syncLabel();
  persist();
}
