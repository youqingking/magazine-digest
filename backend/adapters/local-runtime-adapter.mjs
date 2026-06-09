import { FixtureRepository } from "./fixture-repository.mjs";
import { createBootstrapConfigSurface } from "../surfaces/bootstrap-config.mjs";
import { createCampaignLandingSurface } from "../surfaces/campaign-landing.mjs";
import { createCommercialOfferSurface } from "../surfaces/commercial-offer.mjs";
import { createContentDetailSurface } from "../surfaces/content-detail.mjs";
import { createContentResumeSurface } from "../surfaces/content-resume.mjs";
import { createContentSyncDeltaSurface } from "../surfaces/content-sync-delta.mjs";
import { createEntitlementSnapshotSurface } from "../surfaces/entitlement-snapshot.mjs";
import { createEventIngestSurface } from "../surfaces/event-ingest.mjs";
import { createExperimentAssignSurface } from "../surfaces/experiment-assign.mjs";
import { createFollowCatalogSurface } from "../surfaces/follow-catalog.mjs";
import { createFollowToggleSurface } from "../surfaces/follow-toggle.mjs";
import { createHomeDiscoverySurface } from "../surfaces/home-discovery.mjs";
import { createMarkInboxReadSurface } from "../surfaces/mark-inbox-read.mjs";
import { createNotificationInboxSurface } from "../surfaces/notification-inbox.mjs";
import { createNotificationPrefsSurface } from "../surfaces/notification-prefs.mjs";
import { createPricingPreviewSurface } from "../surfaces/pricing-preview.mjs";
import { createProfileBenefitsSurface } from "../surfaces/profile-benefits.mjs";
import { createPromoPreviewSurface } from "../surfaces/promo-preview.mjs";
import { createPublishBatchSummarySurface } from "../surfaces/publish-batch-summary.mjs";
import { createQuotaStatusSurface } from "../surfaces/quota-status.mjs";
import { createReferralSummarySurface } from "../surfaces/referral-summary.mjs";
import { createRewardSummarySurface } from "../surfaces/reward-summary.mjs";
import { createSaveForLaterSurface } from "../surfaces/save-for-later.mjs";
import { createSearchContentSurface } from "../surfaces/search-content.mjs";
import { createAuthRefreshSurface } from "../surfaces/auth-refresh.mjs";
import { createAuthSessionSurface } from "../surfaces/auth-session.mjs";
import { createAuthSignoutSurface } from "../surfaces/auth-signout.mjs";
import { createNotificationDeliveryPreviewSurface } from "../surfaces/notification-delivery-preview.mjs";
import { createPushCapabilitySurface } from "../surfaces/push-capability.mjs";
import { createRegisterDeviceSurface } from "../surfaces/register-device.mjs";

export function createLocalRuntimeAdapter(runtimeConfig) {
  const repository = new FixtureRepository(runtimeConfig);
  const source = "local_fixture";
  const adapterMode = "local";

  return {
    repository,
    mode: adapterMode,
    source,
    surfaces: {
      "bootstrap-config": createBootstrapConfigSurface({ repository, runtimeConfig }),
      "content-sync-delta": createContentSyncDeltaSurface({ repository, runtimeConfig }),
      "content-detail": createContentDetailSurface({ repository, runtimeConfig }),
      "entitlement-snapshot": createEntitlementSnapshotSurface({ runtimeConfig }),
      "pricing-preview": createPricingPreviewSurface({ repository, runtimeConfig }),
      "experiment-assign": createExperimentAssignSurface({ repository, runtimeConfig }),
      "event-ingest": createEventIngestSurface({ repository, runtimeConfig }),
      "home-discovery": createHomeDiscoverySurface({ repository, runtimeConfig }),
      "search-content": createSearchContentSurface({ repository, runtimeConfig }),
      "follow-catalog": createFollowCatalogSurface({ repository, runtimeConfig }),
      "follow-toggle": createFollowToggleSurface({ repository, runtimeConfig }),
      "notification-inbox": createNotificationInboxSurface({ repository, runtimeConfig }),
      "notification-prefs": createNotificationPrefsSurface({ repository, runtimeConfig }),
      "mark-inbox-read": createMarkInboxReadSurface({ repository, runtimeConfig }),
      "content-resume": createContentResumeSurface({ repository, runtimeConfig }),
      "save-for-later": createSaveForLaterSurface({ repository, runtimeConfig }),
      "publish-batch-summary": createPublishBatchSummarySurface({ repository, runtimeConfig }),
      "commercial-offer": createCommercialOfferSurface({ repository, runtimeConfig }),
      "quota-status": createQuotaStatusSurface({ repository, runtimeConfig }),
      "promo-preview": createPromoPreviewSurface({ repository, runtimeConfig }),
      "referral-summary": createReferralSummarySurface({ repository, runtimeConfig }),
      "reward-summary": createRewardSummarySurface({ repository, runtimeConfig }),
      "campaign-landing": createCampaignLandingSurface({ repository, runtimeConfig }),
      "profile-benefits": createProfileBenefitsSurface({ repository, runtimeConfig }),
      "auth-session": createAuthSessionSurface({ runtimeConfig, adapterMode, source }),
      "auth-refresh": createAuthRefreshSurface({ runtimeConfig, adapterMode, source }),
      "auth-signout": createAuthSignoutSurface({ runtimeConfig, adapterMode, source }),
      "register-device": createRegisterDeviceSurface({ runtimeConfig, adapterMode, source }),
      "push-capability": createPushCapabilitySurface({ runtimeConfig, adapterMode, source }),
      "notification-delivery-preview": createNotificationDeliveryPreviewSurface({ runtimeConfig, adapterMode, source })
    }
  };
}
