const state = {
  status: "idle",
  session: null,
  currentUserInfo: null,
  passwordPrep: null,
  deviceDiagnostics: null,
  lastRefresh: null,
  errorMessage: ""
};

export function getAuthState() {
  return state;
}

export function setAuthPending() {
  state.status = "loading";
  state.errorMessage = "";
}

export function setAuthSession(session) {
  state.session = session;
  state.status = "ready";
  state.lastRefresh = new Date().toISOString();
}

export function setAuthCurrentUserInfo(currentUserInfo) {
  state.currentUserInfo = currentUserInfo;
  state.lastRefresh = new Date().toISOString();
}

export function setAuthPasswordPrep(passwordPrep) {
  state.passwordPrep = passwordPrep;
  state.lastRefresh = new Date().toISOString();
}

export function setAuthDeviceDiagnostics(deviceDiagnostics) {
  state.deviceDiagnostics = deviceDiagnostics;
  state.lastRefresh = new Date().toISOString();
}

export function setAuthSignedOut(response) {
  state.session = {
    session_state: response?.session_state || "signed_out",
    signout_state: response?.signout_state || "cleared",
    token_state: response?.token_state || "token_missing",
    source: response?.source || "unknown"
  };
  state.status = "ready";
  state.lastRefresh = new Date().toISOString();
}

export function setAuthError(error) {
  state.status = "error";
  state.errorMessage = error?.message || String(error);
}
