import { runtimeGateway } from "./runtime-gateway.service.js";
import { setSessionUserId } from "../stores/session.store.js";
import {
  setAuthCurrentUserInfo,
  setAuthDeviceDiagnostics,
  setAuthError,
  setAuthPasswordPrep,
  setAuthPending,
  setAuthSession,
  setAuthSignedOut
} from "../stores/auth.store.js";

let uniIdCo = null;
let uniIdLoginCo = null;

function getCurrentUserInfoSupport() {
  return typeof uniCloud !== "undefined" && typeof uniCloud?.getCurrentUserInfo === "function";
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

function getUniIdLoginCloudObject() {
  if (uniIdLoginCo) {
    return uniIdLoginCo;
  }

  if (typeof uniCloud === "undefined" || typeof uniCloud.importObject !== "function") {
    return null;
  }

  try {
    const importOptions = typeof window === "undefined"
      ? {
          errorOptions: {
            type: "none"
          }
        }
      : undefined;

    uniIdLoginCo = importOptions
      ? uniCloud.importObject("uni-id-co", importOptions)
      : uniCloud.importObject("uni-id-co");
  } catch (error) {
    uniIdLoginCo = null;
  }

  return uniIdLoginCo;
}

function buildPasswordLoginPayload({ username = "", password = "" } = {}) {
  const payload = {
    password
  };

  if (/^1\d{10}$/.test(username)) {
    payload.mobile = username;
  } else if (/@/.test(username)) {
    payload.email = username;
  } else {
    payload.username = username;
  }

  return payload;
}

function normalizeCurrentUserInfo(response = {}, error = null) {
  const roles = Array.isArray(response?.role) ? response.role : [];
  const permissions = Array.isArray(response?.permission) ? response.permission : [];

  return {
    supported: getCurrentUserInfoSupport(),
    state: error ? "error" : getCurrentUserInfoSupport() ? "loaded" : "unsupported",
    uid: response?.uid || null,
    role_count: roles.length,
    permission_count: permissions.length,
    token_expired: Boolean(response?.tokenExpired),
    error_message: error?.message || error?.errMsg || "",
    raw: error ? null : response
  };
}

function buildSessionFromCurrentUser(response = {}, overrides = {}) {
  const expiresAt = typeof response?.tokenExpired === "number" ? response.tokenExpired : null;
  const hasUid = Boolean(response?.uid);
  const tokenIsFresh = expiresAt ? expiresAt > Date.now() : hasUid;

  return {
    session_state: hasUid ? (tokenIsFresh ? "active_uni_id" : "expired_uni_id") : "signed_out",
    auth_provider: hasUid ? "uni-id" : "none",
    user_id: response?.uid || null,
    session_id: hasUid ? `sess_uni_${response.uid}` : null,
    token_state: hasUid ? (tokenIsFresh ? "token_present" : "token_expired") : "token_missing",
    expires_at: expiresAt,
    runtime_mode: overrides.runtime_mode || "hybrid",
    source: overrides.source || "uniCloud.getCurrentUserInfo",
    ...overrides
  };
}

function normalizeRefreshFailure(error) {
  const message = error?.message || error?.errMsg || "refresh token failed";
  return {
    refresh_state: "refresh_failed",
    session_state: "expired_uni_id",
    token_state: "token_expired",
    source: "uni-id-co.refreshToken",
    error_message: message
  };
}

export async function loadAuthSession() {
  setAuthPending();

  try {
    if (getCurrentUserInfoSupport()) {
      const response = await uniCloud.getCurrentUserInfo();
      const session = buildSessionFromCurrentUser(response);
      setSessionUserId(response?.uid || null);
      setAuthDeviceDiagnostics(null);
      setAuthSession(session);
      return session;
    }

    const session = await runtimeGateway.getAuthSession();
    setAuthSession(session);
    return session;
  } catch (error) {
    setAuthError(error);
    throw error;
  }
}

export async function refreshAuthSession() {
  setAuthPending();

  try {
    const cloudObject = getUniIdCloudObject();

    if (cloudObject && typeof cloudObject.refreshToken === "function") {
      try {
        await cloudObject.refreshToken();
      } catch (error) {
        const response = getCurrentUserInfoSupport() ? await uniCloud.getCurrentUserInfo() : {};
        const session = {
          ...buildSessionFromCurrentUser(response, normalizeRefreshFailure(error)),
          runtime_mode: "hybrid"
        };
        setSessionUserId(response?.uid || null);
        setAuthSession(session);
        throw new Error("AUTH_EXPIRED_RELOGIN_REQUIRED");
      }
      const response = getCurrentUserInfoSupport() ? await uniCloud.getCurrentUserInfo() : {};
      const session = buildSessionFromCurrentUser(response, {
        refresh_state: "refreshed",
        refreshed_at: new Date().toISOString(),
        source: "uni-id-co.refreshToken"
      });
      setSessionUserId(response?.uid || null);
      setAuthSession(session);
      return session;
    }

    const response = await runtimeGateway.refreshAuthSession();
    setAuthSession(response);
    return response;
  } catch (error) {
    setAuthError(error);
    throw error;
  }
}

export async function signOutAuthSession() {
  setAuthPending();

  try {
    const cloudObject = getUniIdCloudObject();

    if (cloudObject && typeof cloudObject.logout === "function") {
      try {
        await cloudObject.logout();
      } catch (error) {
      }
    }

    if (typeof uni !== "undefined" && typeof uni.removeStorageSync === "function") {
      uni.removeStorageSync("uni_id_token");
      uni.setStorageSync("uni_id_token_expired", 0);
      uni.removeStorageSync("uni-id-pages-userInfo");
    }

    setSessionUserId(null);
    setAuthDeviceDiagnostics(null);
    const signedOut = {
      signout_state: "cleared",
      session_state: "signed_out",
      cleared_at: new Date().toISOString(),
      token_state: "token_missing",
      source: cloudObject ? "uni-id-co.logout" : "local_storage_clear"
    };
    setAuthSignedOut(signedOut);
    return signedOut;
  } catch (error) {
    setAuthError(error);
    throw error;
  }
}

export async function loadCurrentUserInfo() {
  if (!getCurrentUserInfoSupport()) {
    const snapshot = normalizeCurrentUserInfo();
    setAuthCurrentUserInfo(snapshot);
    return snapshot;
  }

  try {
    const response = await uniCloud.getCurrentUserInfo();
    const snapshot = normalizeCurrentUserInfo(response);
    if (snapshot.uid) {
      setSessionUserId(snapshot.uid);
    }
    setAuthDeviceDiagnostics(null);
    setAuthCurrentUserInfo(snapshot);
    return snapshot;
  } catch (error) {
    const snapshot = normalizeCurrentUserInfo({}, error);
    setAuthCurrentUserInfo(snapshot);
    return snapshot;
  }
}

export function preparePasswordAuthTest({ username = "", password = "" } = {}) {
  const passwordPrep = {
    auth_path: "username_password_only",
    username,
    username_present: Boolean(username),
    password_present: Boolean(password),
    status: username && password ? "ready_for_manual_login" : "missing_input",
    login_page_path: "/pages/auth-test/index",
    uni_id_pages_path: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
  };

  setAuthPasswordPrep(passwordPrep);
  return passwordPrep;
}

export async function loginWithPassword({ username = "", password = "" } = {}) {
  setAuthPending();

  const trimmedUsername = String(username || "").trim();
  const trimmedPassword = String(password || "");

  if (!trimmedUsername || !trimmedPassword) {
    const error = new Error("AUTH_INPUT_MISSING");
    setAuthPasswordPrep({
      auth_path: "username_password_only",
      username: trimmedUsername,
      username_present: Boolean(trimmedUsername),
      password_present: Boolean(trimmedPassword),
      status: "missing_input",
      login_page_path: "/pages/auth-test/index",
      uni_id_pages_path: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
    });
    setAuthError(error);
    throw error;
  }

  const cloudObject = getUniIdLoginCloudObject();

  if (!cloudObject || typeof cloudObject.login !== "function") {
    const error = new Error("UNI_ID_LOGIN_UNAVAILABLE");
    setAuthError(error);
    throw error;
  }

  try {
    await cloudObject.login(buildPasswordLoginPayload({
      username: trimmedUsername,
      password: trimmedPassword
    }));

    setAuthPasswordPrep({
      auth_path: "username_password_only",
      username: trimmedUsername,
      username_present: true,
      password_present: true,
      status: "logged_in",
      login_page_path: "/pages/auth-test/index",
      uni_id_pages_path: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
    });

    const session = await loadAuthSession();
    const currentUserInfo = await loadCurrentUserInfo();

    return {
      login_state: currentUserInfo?.uid ? "success" : "missing_uid",
      uid: currentUserInfo?.uid || null,
      session_state: session?.session_state || "unknown",
      token_state: session?.token_state || "unknown"
    };
  } catch (error) {
    setAuthPasswordPrep({
      auth_path: "username_password_only",
      username: trimmedUsername,
      username_present: true,
      password_present: true,
      status: error?.errCode === "uni-id-captcha-required" ? "captcha_required" : "login_failed",
      login_page_path: "/pages/auth-test/index",
      uni_id_pages_path: "/uni_modules/uni-id-pages/pages/login/login-withpwd",
      error_message: error?.message || error?.errMsg || "LOGIN_FAILED"
    });
    setAuthError(error);
    throw error;
  }
}

export async function runWebPasswordAutomation({
  username = "",
  password = "",
  installation_id = null,
  device_id = null,
  push_clientid = null,
  appid = null
} = {}) {
  const boundaryTag = "smoke_only not_production_path h0_5-web-auth-smoke";

  if (typeof window === "undefined") {
    throw new Error("WEB_AUTOMATION_UNAVAILABLE");
  }
  if (typeof uniCloud === "undefined" || typeof uniCloud.callFunction !== "function") {
    throw new Error("WEB_AUTOMATION_UNICLOUD_MISSING");
  }

  const response = await uniCloud.callFunction({
    name: "h0_5-web-auth-smoke",
    data: {
      username,
      password,
      installation_id,
      device_id,
      push_clientid,
      appid,
      boundary_tag: boundaryTag
    }
  });
  const result = response?.result || response || {};

  if (result?.errCode) {
    throw new Error(result.errMsg || "WEB_AUTOMATION_LOGIN_FAILED");
  }

  if (typeof uni !== "undefined" && typeof uni.setStorageSync === "function" && result?.token) {
    uni.setStorageSync("uni_id_token", result.token);
    uni.setStorageSync("uni_id_token_expired", result.tokenExpired || 0);
  }

  return {
    login_state: result?.login_state || "failed",
    uid: result?.uid || null,
    session_state: result?.session_state || "unknown",
    token_state: result?.token_state || "unknown",
    token: result?.token || "",
    token_expired: result?.tokenExpired || 0,
    device_record: result?.device_record || null,
    db_verification: result?.db_verification || null
  };
}
