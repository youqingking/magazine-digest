<template>
  <view :style="$theme.pageShell" class="paywall-page">
    <text v-if="showDevVisibilitySentinel" class="dev-sentinel">PAYWALL_PAGE_READY</text>
    <view class="paywall-hero">
      <text class="paywall-eyebrow">{{ focusTarget === "campaign" ? "活动说明" : "订阅说明" }}</text>
      <text class="paywall-title">{{ pageTitle }}</text>
      <text class="paywall-description">{{ pageDescription }}</text>
    </view>

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack" class="paywall-stack">
        <AppCard class="paywall-value-card">
          <text class="paywall-value-title">先了解权益，再决定是否订阅</text>
          <text class="paywall-value-copy">这里展示套餐、额度、优惠码和活动信息，帮助你理解当前阅读权益。</text>
        </AppCard>
        <CampaignHero v-if="showCampaignFirst && commercial.campaignLanding" :landing="commercial.campaignLanding" />
        <QuotaStatusCard v-if="commercial.quota" :quota="commercial.quota" />
        <OfferSummaryCard v-if="commercial.offer" :offer="commercial.offer" />
        <CampaignHero v-if="!showCampaignFirst && commercial.campaignLanding" :landing="commercial.campaignLanding" />
      </view>
    </view>

    <view :style="$theme.pageSection">
      <PromoCodeInput v-model="promoCode" :preview="commercial.promoPreview" @submit="submitPromoPreview" />
    </view>

    <view :style="$theme.pageSection">
      <AppCard tone="muted">
        <text class="paywall-link-title">邀请与奖励</text>
        <text class="paywall-link-copy">订阅页继续保留通往邀请/兑换的正式入口，但不把邀请重新放回底部主壳。</text>
        <view class="paywall-link-actions">
          <AppButton label="查看邀请奖励" tone="secondary" @click="openInvite" />
        </view>
      </AppCard>
    </view>

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <PaywallPlanCard
          v-for="plan in plans"
          :key="plan.pricing_plan_id"
          :plan="buildPaywallPlan(plan)"
          :recommended="Boolean(plan.is_default_display)"
          cta-label="查看方案"
          @select="selectPlan(plan)"
        />
      </view>
    </view>
  </view>
</template>

<script>
import CampaignHero from "../../components/commercial/CampaignHero.vue";
import OfferSummaryCard from "../../components/commercial/OfferSummaryCard.vue";
import PromoCodeInput from "../../components/commercial/PromoCodeInput.vue";
import QuotaStatusCard from "../../components/commercial/QuotaStatusCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import PaywallPlanCard from "../../components/ui/PaywallPlanCard.vue";
import { isDevVisibilityEnabled } from "../../services/dev-visibility.service.js";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { consumeRouteAliasState } from "../../services/navigation-state.service.js";
import { getCommercialState, refreshCommercialFoundation, runPromoPreview } from "../../stores/commercial.store.js";

export default {
  components: {
    CampaignHero,
    AppButton,
    AppCard,
    OfferSummaryCard,
    PaywallPlanCard,
    PromoCodeInput,
    QuotaStatusCard
  },
  data() {
    return {
      commercial: getCommercialState(),
      focusTarget: "",
      promoCode: ""
    };
  },
  computed: {
    showDevVisibilitySentinel() {
      return isDevVisibilityEnabled();
    },
    pageTitle() {
      return this.focusTarget === "campaign" ? "订阅 / 活动" : "订阅";
    },
    pageDescription() {
      return this.focusTarget === "campaign"
        ? "活动信息会在这里一并展示，方便你对照套餐和当前权益。"
        : "在这里查看套餐、剩余额度和可用优惠。";
    },
    showCampaignFirst() {
      return this.focusTarget === "campaign";
    },
    plans() {
      return this.commercial.offer?.available_plans || [];
    }
  },
  async onLoad(query) {
    const aliasState = consumeRouteAliasState();
    this.focusTarget = query.focus || (aliasState.lastAlias === "campaign" ? "campaign" : "");
    if (this.focusTarget === "campaign") {
      await ingestRuntimeEvent("campaign_open", {
        source_surface: "campaign_alias"
      });
    }
  },
  async onShow() {
    await refreshCommercialFoundation();
    if (this.commercial.quota?.paywall_triggered) {
      await ingestRuntimeEvent("quota_exhausted", {
        quota_reason: this.commercial.quota.quota_reason
      });
    }
    await ingestRuntimeEvent("paywall_impression", {
      preview_count: this.plans.length
    });
    await ingestRuntimeEvent("paywall_offer_impression", {
      quota_reason: this.commercial.offer?.quota_reason || null,
      campaign_id: this.commercial.offer?.active_campaign_adjustment?.campaign_id || null
    });
  },
  methods: {
    buildPaywallPlan(plan) {
      const offer = this.commercial.offer || {};
      const activeCampaignAdjustment = offer.active_campaign_adjustment || {};

      return {
        pricing_plan_id: plan.pricing_plan_id,
        final_amount_fen: plan.display_amount_fen,
        original_amount_fen: plan.original_amount_fen,
        price_floor_fen: plan.price_floor_fen,
        campaign_id: activeCampaignAdjustment.campaign_id || null,
        applied_price_multiplier_basis_points: activeCampaignAdjustment.price_multiplier_basis_points || 10000
      };
    },
    async submitPromoPreview() {
      await ingestRuntimeEvent("promo_apply_attempt", {
        promo_code: this.promoCode
      });
      const firstPlan = this.plans.length ? this.plans[0] : null;
      const preview = await runPromoPreview(this.promoCode, firstPlan ? firstPlan.pricing_plan_id : null);
      await ingestRuntimeEvent(
        preview.status === "valid" || preview.status === "floor_limited" ? "promo_apply_success" : "promo_apply_fail",
        {
          promo_code: this.promoCode,
          promo_status: preview.status
        }
      );
    },
    async selectPlan(plan) {
      await ingestRuntimeEvent("plan_select", {
        pricing_plan_id: plan.pricing_plan_id,
        campaign_id: this.commercial.offer?.active_campaign_adjustment?.campaign_id || null
      });
    },
    openInvite() {
      uni.navigateTo({
        url: "/pages/invite/index?source=paywall"
      });
    }
  }
};
</script>

<style>
.paywall-page {
  display: flex;
  flex-direction: column;
}

.dev-sentinel {
  display: block;
  margin-bottom: 12rpx;
  color: #2f6b3b;
  font-size: 24rpx;
  font-weight: 700;
}

.paywall-hero {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.paywall-eyebrow {
  font-size: 20rpx;
  font-weight: 700;
  color: #005bbf;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.paywall-title {
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1.2;
  color: #191c1e;
}

.paywall-description,
.paywall-value-copy {
  font-size: 26rpx;
  line-height: 1.7;
  color: #414754;
}

.paywall-stack {
  gap: 18rpx;
}

.paywall-value-card {
  background: linear-gradient(160deg, #005bbf 0%, #1a73e8 100%);
  border-color: #d8e2ff;
}

.paywall-value-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.25;
  color: #ffffff;
}

.paywall-value-copy {
  display: block;
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.9);
}

.paywall-link-title {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.3;
  color: #191c1e;
}

.paywall-link-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.65;
  color: #414754;
}

.paywall-link-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}
</style>
