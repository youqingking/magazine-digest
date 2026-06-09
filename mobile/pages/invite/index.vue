<template>
  <view :style="$theme.pageShell" class="invite-page">
    <view class="invite-hero">
      <text class="invite-eyebrow">Growth</text>
      <text class="invite-title">邀请与兑换</text>
      <text class="invite-description">只承接邀请摘要、奖励预览与兑换入口，不扩张为订阅或社交流程。</text>
    </view>

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <InviteSummaryCard v-if="growth.referralSummary" :summary="growth.referralSummary" />
        <RewardSummaryCard v-if="growth.rewardSummary" :summary="growth.rewardSummary" />
        <ReferralRuleBlock :rules="referralRules" />
      </view>
    </view>

    <view :style="$theme.pageSection">
      <AppCard tone="muted">
        <SectionHeader eyebrow="Growth" title="兑换入口" description="这里只做预览态兑换入口，不推进真实 redeem。" compact />
        <input v-model="redeemCode" class="redeem-input" placeholder="输入兑换码" />
        <view class="invite-actions">
          <AppButton label="复制邀请码" tone="secondary" @click="recordCopy" />
          <AppButton label="分享邀请" tone="secondary" @click="recordShare" />
          <AppButton label="预览兑换" tone="subtle" @click="previewRedeem" />
        </view>
        <text class="redeem-note">{{ redeemMessage }}</text>
      </AppCard>
    </view>
  </view>
</template>

<script>
import InviteSummaryCard from "../../components/growth/InviteSummaryCard.vue";
import ReferralRuleBlock from "../../components/growth/ReferralRuleBlock.vue";
import RewardSummaryCard from "../../components/growth/RewardSummaryCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { getGrowthState, refreshGrowthFoundation } from "../../stores/growth.store.js";

export default {
  components: {
    AppButton,
    AppCard,
    InviteSummaryCard,
    ReferralRuleBlock,
    RewardSummaryCard,
    SectionHeader
  },
  data() {
    return {
      growth: getGrowthState(),
      redeemCode: "",
      redeemMessage: "兑换仅做预览，不产生真实奖励结算。"
    };
  },
  computed: {
    referralRules() {
      return this.growth.referralSummary?.reward_rule_summary || [];
    }
  },
  async onShow() {
    await refreshGrowthFoundation();
    await ingestRuntimeEvent("invite_preview_open", {
      invite_code: this.growth.referralSummary?.invite_code || null
    });
  },
  methods: {
    async recordShare() {
      await ingestRuntimeEvent("share_click", {
        surface: "invite"
      });
      await ingestRuntimeEvent("referral_share_click", {
        invite_code: this.growth.referralSummary?.invite_code || null
      });
      this.redeemMessage = "分享动作已记录为预览事件。";
    },
    async recordCopy() {
      await ingestRuntimeEvent("reward_summary_open", {
        entries: this.growth.rewardSummary?.ledger_preview ? this.growth.rewardSummary.ledger_preview.length : 0
      });
      this.redeemMessage = "邀请码复制动作已记录为预览事件。";
    },
    async previewRedeem() {
      await ingestRuntimeEvent("promo_apply_attempt", {
        promo_code: this.redeemCode || "empty_redeem_preview",
        source_surface: "invite_redeem_preview"
      });
      this.redeemMessage = this.redeemCode ? "已记录兑换码预览，不触发真实 redeem。" : "请先输入兑换码。";
    }
  }
};
</script>

<style>
.invite-page {
  display: flex;
  flex-direction: column;
}

.invite-hero {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.invite-eyebrow {
  font-size: 20rpx;
  font-weight: 700;
  color: #005bbf;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.invite-title {
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.2;
  color: #191c1e;
}

.invite-description {
  font-size: 24rpx;
  line-height: 1.65;
  color: #414754;
}

.redeem-input {
  width: 100%;
  min-height: 88rpx;
  margin-top: 16rpx;
  padding: 18rpx 22rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid #e0e3e6;
  box-sizing: border-box;
}

.invite-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.redeem-note {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #414754;
}
</style>
