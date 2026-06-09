<template>
  <view :style="$theme.pageShell" class="profile-page">
    <view class="profile-topbar">
      <text class="profile-topbar-title">我的</text>
    </view>

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <view class="profile-hero-grid">
          <AppCard class="profile-identity-card">
            <text class="profile-name">{{ displayName }}</text>
            <text class="profile-subtitle">{{ profileSubtitle }}</text>
            <view class="profile-badge-row">
              <EntitlementBadge :label="entitlementBadgeLabel" />
            </view>
          </AppCard>

          <AppCard class="profile-membership-card" @click="openPaywall">
            <text class="profile-membership-eyebrow">阅读权益</text>
            <text class="profile-membership-title">{{ membershipTitle }}</text>
            <text class="profile-membership-meta">{{ membershipMeta }}</text>
          </AppCard>
        </view>

        <AppCard>
          <view class="profile-stats">
            <view class="profile-stat">
              <text class="profile-stat-label">稍后再读</text>
              <text class="profile-stat-value">{{ savedItems.length }}</text>
            </view>
            <view class="profile-stat-divider" />
            <view class="profile-stat">
              <text class="profile-stat-label">未读消息</text>
              <text class="profile-stat-value">{{ notifications.unreadCount || 0 }}</text>
            </view>
            <view class="profile-stat-divider" />
            <view class="profile-stat">
              <text class="profile-stat-label">奖励天数</text>
              <text class="profile-stat-value">{{ vipDays }}</text>
            </view>
          </view>
        </AppCard>

        <view class="profile-action-grid">
          <view class="profile-action-card" @click="openSavedSummary">
            <text class="profile-action-title">稍后再读</text>
            <text class="profile-action-copy">继续上次保存的内容</text>
          </view>
          <view class="profile-action-card" @click="openInboxSummary">
            <text class="profile-action-title">消息摘要</text>
            <text class="profile-action-copy">查看首页里的消息提醒</text>
          </view>
          <view class="profile-action-card" @click="toggleDiagnostics">
            <text class="profile-action-title">设备状态</text>
            <text class="profile-action-copy">查看当前设备与会话状态</text>
          </view>
          <view class="profile-action-card" @click="openSettings">
            <text class="profile-action-title">设置中心</text>
            <text class="profile-action-copy">打开阅读与通知设置</text>
          </view>
        </view>

        <AppCard tone="muted">
          <SectionHeader eyebrow="个人" title="我的摘要" description="把保存、消息、权益与奖励集中在这里。" compact />
          <MetaRow :items="benefitMeta" />
          <view class="profile-actions">
            <AppButton label="查看订阅" tone="secondary" @click="openPaywall" />
            <AppButton label="邀请奖励" tone="secondary" @click="openInvite" />
            <AppButton label="打开设置" tone="secondary" @click="openSettings" />
            <AppButton label="设备状态" tone="subtle" @click="toggleDiagnostics" />
          </view>
        </AppCard>

        <QuotaStatusCard v-if="commercial.quota" :quota="commercial.quota" />
        <view v-if="growth.rewardSummary" @click="openInvite">
          <RewardSummaryCard :summary="growth.rewardSummary" />
        </view>
        <DiscoverySection
          title="消息摘要"
          description="消息主入口仍在首页，这里保留最近提醒摘要。"
          :items="inboxPreviewItems"
          empty-text="暂无未处理消息"
          @open="openInboxItem"
        />
        <DiscoverySection
          title="稍后再读"
          description="你保存的内容会在这里汇总。"
          :items="savedItems"
          empty-text="暂无保存内容"
          @open="openSavedItem"
        />
        <AuthStateCard :session="auth.session" :current-user-info="auth.currentUserInfo" />
        <DeviceStateCard :device="deviceState" />
        <AppCard v-if="showDiagnostics" tone="muted">
          <DeviceDiagnosticCard :diagnostics="auth.deviceDiagnostics" />
        </AppCard>
      </view>
    </view>
  </view>
</template>

<script>
import AuthStateCard from "../../components/account/AuthStateCard.vue";
import DeviceDiagnosticCard from "../../components/account/DeviceDiagnosticCard.vue";
import DeviceStateCard from "../../components/account/DeviceStateCard.vue";
import DiscoverySection from "../../components/discovery/DiscoverySection.vue";
import EntitlementBadge from "../../components/commercial/EntitlementBadge.vue";
import QuotaStatusCard from "../../components/commercial/QuotaStatusCard.vue";
import RewardSummaryCard from "../../components/growth/RewardSummaryCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { loadAuthSession, loadCurrentUserInfo } from "../../services/auth.service.js";
import { getLocalContentState } from "../../services/content-state.service.js";
import { registerCurrentDevice } from "../../services/device.service.js";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { getAuthState } from "../../stores/auth.store.js";
import { getCommercialState, refreshCommercialFoundation } from "../../stores/commercial.store.js";
import { getDiscoveryState, refreshDiscoveryHome, setFeedUiState } from "../../stores/discovery.store.js";
import { getGrowthState, refreshGrowthFoundation } from "../../stores/growth.store.js";
import { getNotificationsState, markNotificationsRead, refreshInbox } from "../../stores/notifications.store.js";
import { setCurrentArticle, setEntrySource, setReadingMode } from "../../stores/reader.store.js";

export default {
  components: {
    AppButton,
    AppCard,
    AuthStateCard,
    DeviceDiagnosticCard,
    DeviceStateCard,
    DiscoverySection,
    EntitlementBadge,
    MetaRow,
    QuotaStatusCard,
    RewardSummaryCard,
    SectionHeader
  },
  data() {
    return {
      auth: getAuthState(),
      commercial: getCommercialState(),
      growth: getGrowthState(),
      discovery: getDiscoveryState(),
      notifications: getNotificationsState(),
      deviceState: null,
      showDiagnostics: false
    };
  },
  computed: {
    entitlementBadgeLabel() {
      return this.commercial.profileBenefits?.entitlement_badge === "Free Reader"
        ? "普通读者"
        : this.commercial.profileBenefits?.entitlement_badge || "普通读者";
    },
    displayName() {
      return this.auth.currentUserInfo?.nickname || this.auth.currentUserInfo?.uid || "阅读用户";
    },
    profileSubtitle() {
      return this.auth.session?.session_state === "signed_in"
        ? "账号、设备与阅读权益在这里汇总。"
        : "当前为本地预览账号摘要。";
    },
    membershipTitle() {
      return this.commercial.profileBenefits?.subscription_status === "active" ? "已开通完整阅读" : "当前为预览版权益";
    },
    membershipMeta() {
      return this.commercial.profileBenefits?.grace_like_summary || "阅读权益和奖励信息会在这里汇总展示。";
    },
    vipDays() {
      return this.growth.rewardSummary?.vip_days_total || 0;
    },
    profileMeta() {
      const benefits = this.commercial.profileBenefits || {};
      return [
        "Subscription " + (benefits.subscription_status || "free"),
        "Entitlement " + (benefits.entitlement_status || "inactive"),
        "Inbox unread " + (benefits.inbox_unread_count || 0),
        "Auth " + (this.auth.session?.session_state || "unknown"),
        "Device " + (this.deviceState?.registration_state || "pending")
      ];
    },
    benefitMeta() {
      const benefits = this.commercial.profileBenefits || {};
      const rewardSummary = benefits.reward_summary || {};
      return [
        "稍后再读 " + this.savedItems.length,
        "未读消息 " + (this.notifications.unreadCount || 0),
        "奖励天数 " + (rewardSummary.vip_days_total || 0),
        benefits.grace_like_summary || "当前暂无额外说明"
      ];
    },
    inboxPreviewItems() {
      return (this.notifications.inbox || []).slice(0, 3).map((item) => ({
        _id: item._id,
        article_id: item.target && item.target.startsWith("art_") ? item.target : "",
        title: item.title,
        summary: item.body,
        publication_key: item.reason || item.type || "inbox"
      }));
    },
    savedItems() {
      const localState = getLocalContentState();
      const savedIds = Object.values(localState.by_article || {})
        .filter((item) => item.saved_for_later)
        .map((item) => item.article_id);
      const catalog = this.discovery.home?.modules?.flatMap((section) => section.items || []) || [];
      return catalog.filter((item) => savedIds.includes(item.article_id));
    }
  },
  async onShow() {
    await loadAuthSession();
    await loadCurrentUserInfo();
    this.deviceState = await registerCurrentDevice();
    await Promise.all([refreshCommercialFoundation(), refreshGrowthFoundation(), refreshDiscoveryHome(), refreshInbox()]);
    await ingestRuntimeEvent("auth_session_open", {
      session_state: this.auth.session?.session_state || "unknown"
    });
    await ingestRuntimeEvent("entitlement_view", {
      subscription_status: this.commercial.profileBenefits?.subscription_status || "free"
    });
  },
  methods: {
    openSettings() {
      uni.navigateTo({
        url: "/pages/settings/index"
      });
    },
    openPaywall() {
      uni.navigateTo({
        url: "/pages/paywall/index?source=profile"
      });
    },
    openInvite() {
      uni.navigateTo({
        url: "/pages/invite/index?source=profile"
      });
    },
    openInboxSummary() {
      setFeedUiState({
        activeTab: "updates",
        focus: "inbox",
        scrollTop: 0,
        restorePending: true
      });
      uni.switchTab({
        url: "/pages/feed/index"
      });
    },
    openSavedSummary() {
      if (this.savedItems.length) {
        this.openSavedItem(this.savedItems[0]);
        return;
      }
      uni.showToast({
        title: "暂无保存内容",
        icon: "none"
      });
    },
    toggleDiagnostics() {
      this.showDiagnostics = !this.showDiagnostics;
    },
    async openInboxItem(item) {
      if (!item?._id) {
        return;
      }

      await markNotificationsRead([item._id]);
      if (item.article_id) {
        this.openSavedItem(item);
      }
    },
    openSavedItem(item) {
      setCurrentArticle(item.article_id);
      setEntrySource("profile");
      setReadingMode("deep_3m");
      uni.navigateTo({
        url: `/pages/detail/index?articleId=${item.article_id}&readingMode=deep_3m&source=profile`
      });
    }
  }
};
</script>

<style>
.profile-page {
  display: flex;
  flex-direction: column;
}

.profile-topbar-title {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: #191c1e;
}

.profile-hero-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.profile-identity-card,
.profile-membership-card {
  min-height: 180rpx;
}

.profile-name {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: #191c1e;
}

.profile-subtitle,
.profile-membership-meta,
.profile-action-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #414754;
}

.profile-badge-row {
  margin-top: 16rpx;
}

.profile-membership-card {
  background: linear-gradient(160deg, #005bbf 0%, #1a73e8 100%);
  border-color: #d8e2ff;
}

.profile-membership-eyebrow {
  display: block;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.82);
  text-transform: uppercase;
}

.profile-membership-title {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.25;
  color: #ffffff;
}

.profile-membership-meta {
  color: rgba(255, 255, 255, 0.92);
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.profile-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.profile-stat-label {
  font-size: 22rpx;
  color: #727785;
}

.profile-stat-value {
  font-size: 40rpx;
  font-weight: 800;
  color: #005bbf;
}

.profile-stat-divider {
  width: 1rpx;
  align-self: stretch;
  background: #e0e3e6;
}

.profile-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.profile-action-card {
  padding: 24rpx;
  border-radius: 28rpx;
  background: #eef2f7;
  border: 1rpx solid #e0e3e6;
}

.profile-action-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #191c1e;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}
</style>
