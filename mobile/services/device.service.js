import { runtimeGateway } from "./runtime-gateway.service.js";
import { getAuthState, setAuthDeviceDiagnostics } from "../stores/auth.store.js";
import { getSessionState } from "../stores/session.store.js";
import { getRuntimeState } from "../stores/runtime.store.js";

let uniIdCo = null;
let deviceSyncCo = null;

function buildDeviceId() {
  const session = getSessionState();
  return `device_${session.installationId}`;
}

function getUniIdCloudObject() {
  if (uniIdCo) {
    return uniIdCo;
  }

  if (typeof uniCloud === "undefined" || typeof uniCloud.importObject !== "function") {
    return null;
  }

  try {
    uniIdCo = uniCloud.importObject("uni-id-co", {
      customUI: true
    });
  } catch (error) {
    uniIdCo = null;
  }

  return uniIdCo;
}

function getDeviceSyncCloudObject() {
  if (deviceSyncCo) {
    return deviceSyncCo;
  }

  if (typeof uniCloud === "undefined" || typeof uniCloud.importObject !== "function") {
    return null;
  }

  try {
    deviceSyncCo = uniCloud.importObject("device-sync-co", {
      customUI: true
    });
  } catch (error) {
    deviceSyncCo = null;
  }

  return deviceSyncCo;
}

function getCurrentUid() {
  if (typeof uniCloud === "undefined" || typeof uniCloud.getCurrentUserInfo !== "function") {
    return null;
  }

  try {
    return uniCloud.getCurrentUserInfo()?.uid || null;
  } catch (error) {
    return null;
  }
}

function normalizeRemoteDeviceRecord(update = {}, runtime = getRuntimeState()) {
  const session = getSessionState();
  const auth = getAuthState();

  return {
    registration_state: "registered",
    installation_id: session.installationId,
    device_id: update.device_id || buildDeviceId(),
    push_clientid: Object.prototype.hasOwnProperty.call(update, "push_clientid") ? update.push_clientid : null,
    appid: update.appid || runtime.remoteAppId || null,
    product_key: session.productKey,
    user_id: getCurrentUid(),
    last_seen_at: update.last_seen_at || new Date().toISOString(),
    runtime_mode: runtime.runtimeMode,
    source: "uni-id-co.setPushCid",
    auth_state: auth.session?.session_state || "unknown",
    token_state: auth.session?.token_state || "unknown",
    cloud_method: "setPushCid",
    attempted_with_cid: Boolean(update.push_clientid),
    remote_error_message: "",
    last_attempt_at: new Date().toISOString()
  };
}

function buildPrecheckDiagnostics(update = {}) {
  const auth = getAuthState();
  const currentUser = auth.currentUserInfo || {};
  const cachedPushClientId = auth.deviceDiagnostics?.push_clientid || null;
  const effectivePushClientId = update.push_clientid || cachedPushClientId || null;
  const uid = currentUser.uid || getCurrentUid();
  const hasValidToken = auth.session?.token_state === "token_present";
  const hasUid = Boolean(uid);
  const requiresCid = Boolean(update.requires_cid);
  const hasCid = Boolean(effectivePushClientId);
  const reason = !hasUid
    ? "AUTH_UID_MISSING"
    : !hasValidToken
      ? "AUTH_EXPIRED_RELOGIN_REQUIRED"
      : requiresCid && !hasCid
        ? "PUSH_CID_MISSING"
        : "";

  return {
    uid: uid || null,
    auth_state: auth.session?.session_state || "unknown",
    token_state: auth.session?.token_state || "unknown",
    push_clientid: effectivePushClientId,
    device_sync_source: "precheck",
    last_remote_error: reason,
    last_attempt_at: new Date().toISOString(),
    cloud_method: "setPushCid",
    attempted_with_cid: Boolean(update.push_clientid),
    can_attempt_remote: hasUid && hasValidToken && (!requiresCid || hasCid),
    reason
  };
}

function syncDiagnostics(record = {}) {
  const diagnostics = {
    uid: record.user_id || record.uid || null,
    auth_state: record.auth_state || "unknown",
    token_state: record.token_state || "unknown",
    push_clientid: record.push_clientid || null,
    device_sync_source: record.source || "unknown",
    last_remote_error: record.remote_error_message || "",
    last_attempt_at: record.last_attempt_at || new Date().toISOString(),
    cloud_method: record.cloud_method || "setPushCid",
    attempted_with_cid: Boolean(record.attempted_with_cid),
    registration_state: record.registration_state || "pending"
  };
  setAuthDeviceDiagnostics(diagnostics);
  return diagnostics;
}

async function tryRegisterViaUniIdCo(update = {}) {
  const runtime = getRuntimeState();
  const cloudObject = getUniIdCloudObject();
  const currentUid = getCurrentUid();

  if (!cloudObject || !currentUid) {
    return null;
  }

  const pushClientId = typeof update.push_clientid === "string" ? update.push_clientid : "";
  await cloudObject.setPushCid({
    pushClientId
  });

  return normalizeRemoteDeviceRecord(
    {
      ...update,
      push_clientid: pushClientId
    },
    runtime
  );
}

async function tryRegisterViaDeviceSyncCo(update = {}) {
  const runtime = getRuntimeState();
  const cloudObject = getDeviceSyncCloudObject();
  const currentUid = getCurrentUid();

  if (!cloudObject || !currentUid || typeof cloudObject.registerDevice !== "function") {
    return null;
  }

  const response = await cloudObject.registerDevice({
    pushClientId: typeof update.push_clientid === "string" ? update.push_clientid : ""
  });

  return {
    ...normalizeRemoteDeviceRecord(update, runtime),
    source: response?.source || "device-sync-co.registerDevice",
    push_clientid: Object.prototype.hasOwnProperty.call(update, "push_clientid") ? update.push_clientid || null : null
  };
}

export async function registerCurrentDevice(update = {}) {
  const session = getSessionState();
  const runtime = getRuntimeState();
  const precheck = buildPrecheckDiagnostics(update);

  if (!precheck.can_attempt_remote) {
    const blockedRecord = {
      ...(await runtimeGateway.registerDevice({
        installation_id: session.installationId,
        device_id: update.device_id || buildDeviceId(),
        push_clientid: update.push_clientid || null,
        appid: update.appid || runtime.remoteAppId || "NEED_HUMAN_DCLOUD_APP_ID",
        last_seen_at: new Date().toISOString()
      })),
      registration_state: "precheck_blocked",
      remote_error_message: precheck.reason,
      source: "runtimeGateway.registerDevice",
      auth_state: precheck.auth_state,
      token_state: precheck.token_state,
      cloud_method: precheck.cloud_method,
      attempted_with_cid: precheck.attempted_with_cid,
      last_attempt_at: precheck.last_attempt_at,
      user_id: precheck.uid
    };
    syncDiagnostics(blockedRecord);
    return blockedRecord;
  }

  try {
    const remoteRecord = precheck.push_clientid
      ? await tryRegisterViaUniIdCo({
          installation_id: session.installationId,
          device_id: update.device_id || buildDeviceId(),
          push_clientid: precheck.push_clientid || "",
          appid: update.appid || runtime.remoteAppId || "NEED_HUMAN_DCLOUD_APP_ID",
          last_seen_at: new Date().toISOString()
        })
      : await tryRegisterViaDeviceSyncCo({
          installation_id: session.installationId,
          device_id: update.device_id || buildDeviceId(),
          push_clientid: "",
          appid: update.appid || runtime.remoteAppId || "NEED_HUMAN_DCLOUD_APP_ID",
          last_seen_at: new Date().toISOString()
        });

    if (remoteRecord) {
      syncDiagnostics(remoteRecord);
      return remoteRecord;
    }
  } catch (error) {
    const fallbackRecord = {
      ...(await runtimeGateway.registerDevice({
        installation_id: session.installationId,
        device_id: update.device_id || buildDeviceId(),
        push_clientid: update.push_clientid || null,
        appid: update.appid || runtime.remoteAppId || "NEED_HUMAN_DCLOUD_APP_ID",
        last_seen_at: new Date().toISOString()
      })),
      registration_state: "fallback_after_remote_error",
      remote_error_message: error?.message || error?.errMsg || "setPushCid failed",
      source: "runtimeGateway.registerDevice",
      auth_state: precheck.auth_state,
      token_state: precheck.token_state,
      cloud_method: precheck.cloud_method,
      attempted_with_cid: precheck.attempted_with_cid,
      last_attempt_at: precheck.last_attempt_at,
      user_id: precheck.uid
    };
    syncDiagnostics(fallbackRecord);
    return fallbackRecord;
  }

  const fallbackRecord = await runtimeGateway.registerDevice({
    installation_id: session.installationId,
    device_id: update.device_id || buildDeviceId(),
    push_clientid: update.push_clientid || null,
    appid: update.appid || runtime.remoteAppId || "NEED_HUMAN_DCLOUD_APP_ID",
    last_seen_at: new Date().toISOString()
  });
  syncDiagnostics({
    ...fallbackRecord,
    auth_state: precheck.auth_state,
    token_state: precheck.token_state,
    cloud_method: precheck.cloud_method,
    attempted_with_cid: precheck.attempted_with_cid,
    last_attempt_at: precheck.last_attempt_at,
    user_id: precheck.uid
  });
  return fallbackRecord;
}

export async function setPushCidForCurrentDevice(pushClientId, update = {}) {
  return registerCurrentDevice({
    ...update,
    push_clientid: pushClientId || null,
    requires_cid: true
  });
}

export async function verifyCurrentDeviceRecords() {
  const cloudObject = getDeviceSyncCloudObject();

  if (!cloudObject || typeof cloudObject.verifyCurrentDeviceRecords !== "function") {
    return {
      status: "blocked",
      blocking_reason: "DEVICE_SYNC_VERIFY_UNAVAILABLE",
      device_found: false,
      user_device_found: false,
      device_id: null,
      push_clientid: null,
      appid: null,
      updated_at: null,
      uid: null
    };
  }

  try {
    const response = await cloudObject.verifyCurrentDeviceRecords();
    return {
      status: "ok",
      blocking_reason: "",
      device_found: Boolean(response?.device_found),
      user_device_found: Boolean(response?.user_device_found),
      device_id: response?.device_id || null,
      push_clientid: response?.push_clientid || null,
      appid: response?.appid || null,
      updated_at: response?.updated_at || null,
      uid: response?.uid || null
    };
  } catch (error) {
    return {
      status: "blocked",
      blocking_reason: error?.message || error?.errMsg || "DEVICE_SYNC_VERIFY_FAILED",
      device_found: false,
      user_device_found: false,
      device_id: null,
      push_clientid: null,
      appid: null,
      updated_at: null,
      uid: null
    };
  }
}
