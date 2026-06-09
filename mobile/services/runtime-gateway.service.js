import { createLocalRuntimeApi } from "../api/local-runtime-api.js";
import { createRemoteRuntimeApi } from "../api/remote-runtime-api.js";
import { getSessionState } from "../stores/session.store.js";
import { getRuntimeState } from "../stores/runtime.store.js";

const adapters = {
  local: createLocalRuntimeApi(),
  remote: createRemoteRuntimeApi("remote"),
  hybrid: createRemoteRuntimeApi("hybrid")
};

function pickAdapter(runtimeMode) {
  return adapters[runtimeMode] || adapters.local;
}

function withRuntimeDefaults(request = {}) {
  const session = getSessionState();

  return {
    product_key: session.productKey,
    installation_id: session.installationId,
    user_id: session.userId,
    runtime_mode: getRuntimeState().runtimeMode,
    ...request
  };
}

export const runtimeGateway = {
  async getBootstrapConfig() {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getBootstrapConfig(withRuntimeDefaults());
  },

  async getContentSyncDelta(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getContentSyncDelta(withRuntimeDefaults(request));
  },

  async getContentDetail(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getContentDetail(withRuntimeDefaults(request));
  },

  async getEntitlementSnapshot(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getEntitlementSnapshot(withRuntimeDefaults(request));
  },

  async getPricingPreviewCatalog(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getPricingPreviewCatalog(withRuntimeDefaults(request));
  },

  async getExperimentAssignment(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getExperimentAssignment(withRuntimeDefaults(request));
  },

  async getHomeDiscovery(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getHomeDiscovery(withRuntimeDefaults(request));
  },

  async searchContent(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).searchContent(withRuntimeDefaults(request));
  },

  async getFollowCatalog(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getFollowCatalog(withRuntimeDefaults(request));
  },

  async toggleFollow(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).toggleFollow(withRuntimeDefaults(request));
  },

  async getNotificationInbox(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getNotificationInbox(withRuntimeDefaults(request));
  },

  async getNotificationPrefs(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getNotificationPrefs(withRuntimeDefaults(request));
  },

  async updateNotificationPrefs(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).updateNotificationPrefs(withRuntimeDefaults(request));
  },

  async markInboxRead(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).markInboxRead(withRuntimeDefaults(request));
  },

  async getContentResume(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getContentResume(withRuntimeDefaults(request));
  },

  async saveForLater(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).saveForLater(withRuntimeDefaults(request));
  },

  async getPublishBatchSummary(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getPublishBatchSummary(withRuntimeDefaults(request));
  },

  async getCommercialOffer(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getCommercialOffer(withRuntimeDefaults(request));
  },

  async getQuotaStatus(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getQuotaStatus(withRuntimeDefaults(request));
  },

  async previewPromo(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).previewPromo(withRuntimeDefaults(request));
  },

  async getReferralSummary(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getReferralSummary(withRuntimeDefaults(request));
  },

  async getRewardSummary(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getRewardSummary(withRuntimeDefaults(request));
  },

  async getCampaignLanding(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getCampaignLanding(withRuntimeDefaults(request));
  },

  async getProfileBenefits(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getProfileBenefits(withRuntimeDefaults(request));
  },

  async ingestEvent(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).ingestEvent(withRuntimeDefaults(request));
  },

  async getAuthSession(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getAuthSession(withRuntimeDefaults(request));
  },

  async refreshAuthSession(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).refreshAuthSession(withRuntimeDefaults(request));
  },

  async signOutAuthSession(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).signOutAuthSession(withRuntimeDefaults(request));
  },

  async registerDevice(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).registerDevice(withRuntimeDefaults(request));
  },

  async getPushCapability(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getPushCapability(withRuntimeDefaults(request));
  },

  async getNotificationDeliveryPreview(request = {}) {
    const session = getSessionState();
    return pickAdapter(session.runtimeMode).getNotificationDeliveryPreview(withRuntimeDefaults(request));
  }
};
