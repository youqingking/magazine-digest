import { runtimeGateway } from "./runtime-gateway.service.js";
import { getSessionState } from "../stores/session.store.js";
import { getRuntimeState } from "../stores/runtime.store.js";

export async function loadPushCapability(update = {}) {
  const session = getSessionState();
  const runtime = getRuntimeState();

  return runtimeGateway.getPushCapability({
    installation_id: session.installationId,
    push_clientid: update.push_clientid || null,
    permission_state: update.permission_state || "prompt",
    appid: update.appid || runtime.pushAppId || runtime.remoteAppId || "NEED_HUMAN_UNI_PUSH_APP_ID"
  });
}

export async function loadNotificationDeliveryPreview(update = {}) {
  return runtimeGateway.getNotificationDeliveryPreview(update);
}

export async function loadPushClientId() {
  if (typeof uni === "undefined" || typeof uni.getPushClientId !== "function") {
    return {
      supported: false,
      state: "unsupported",
      push_clientid: null,
      error_message: "uni.getPushClientId unavailable"
    };
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    try {
      uni.getPushClientId({
        success(result = {}) {
          const pushClientId = result.cid || result.clientid || null;
          finish({
            supported: true,
            state: pushClientId ? "ready" : "missing",
            push_clientid: pushClientId,
            error_message: ""
          });
        },
        fail(error) {
          finish({
            supported: true,
            state: "error",
            push_clientid: null,
            error_message: error?.errMsg || error?.message || "getPushClientId failed"
          });
        }
      });
    } catch (error) {
      finish({
        supported: true,
        state: "error",
        push_clientid: null,
        error_message: error?.message || "getPushClientId failed"
      });
    }

    setTimeout(() => {
      finish({
        supported: true,
        state: "timeout",
        push_clientid: null,
        error_message: "getPushClientId timeout"
      });
    }, 3000);
  });
}
