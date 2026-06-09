<template>
  <view :style="$theme.pageShell">
    <SectionHeader
      title="Inbox Internal"
      description="旧 inbox 不再是一级页面，但内部能力页继续保留 inbox truth 和 delivery preview 可见性。"
    />

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <AppCard>
          <SectionHeader title="Inbox truth durable" description="`notification_inbox` 仍是用户消息真相源；首页只展示摘要，这里保留内部能力视图。" />
          <MetaRow :items="inboxMeta" />
        </AppCard>

        <PushStateCard :capability="pushCapability" :preview="pushPreview" />

        <DiscoverySection
          title="消息内容"
          description="保留 delivery preview、digest queued、suppressed 等 foundation 语义的查看入口。"
          :items="inboxItems"
          empty-text="暂无 inbox 项"
          @open="openItem"
        />

        <AppCard tone="muted">
          <SectionHeader title="回到正式 IA" description="正式入口在首页消息摘要；本页仅保留内部能力可见性，不恢复一级导航。" />
          <view class="inbox-actions">
            <AppButton label="打开首页消息摘要" tone="secondary" @click="openFeedInbox" />
          </view>
        </AppCard>
      </view>
    </view>
  </view>
</template>

<script>
import DiscoverySection from "../../components/discovery/DiscoverySection.vue";
import PushStateCard from "../../components/account/PushStateCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { loadNotificationDeliveryPreview, loadPushCapability, loadPushClientId } from "../../services/push.service.js";
import { writeRouteAliasState } from "../../services/navigation-state.service.js";
import { getNotificationsState, refreshInbox, refreshNotificationPrefs } from "../../stores/notifications.store.js";
import { getRuntimeState } from "../../stores/runtime.store.js";
import { markNotificationsRead } from "../../stores/notifications.store.js";
import { setCurrentArticle, setEntrySource, setReadingMode } from "../../stores/reader.store.js";

export default {
  components: {
    AppButton,
    AppCard,
    DiscoverySection,
    MetaRow,
    PushStateCard,
    SectionHeader
  },
  data() {
    return {
      notifications: getNotificationsState(),
      runtime: getRuntimeState(),
      pushCapability: null,
      pushPreview: null
    };
  },
  computed: {
    inboxMeta() {
      return [
        "Unread " + (this.notifications.unreadCount || 0),
        "Event push_delivery_preview",
        "Preview " + (this.pushPreview?.transport_decision || "idle"),
        "Truth " + (this.pushPreview?.inbox_truth_state || "unknown"),
        "Suppression " + (this.pushPreview?.suppression_reason || "none"),
        "Runtime " + (this.pushPreview?.runtime_mode || this.runtime.runtimeMode)
      ];
    },
    inboxItems() {
      return (this.notifications.inbox || []).map((item) => ({
        _id: item._id,
        article_id: item.target && item.target.startsWith("art_") ? item.target : "",
        title: item.title,
        summary: item.body,
        publication_key: item.reason || item.type || "inbox"
      }));
    }
  },
  onLoad() {
    writeRouteAliasState("inbox", "/pages/inbox/index");
  },
  async onShow() {
    await refreshNotificationPrefs();
    await refreshInbox();
    const pushClientIdState = await loadPushClientId();
    this.pushCapability = await loadPushCapability({
      push_clientid: pushClientIdState?.push_clientid || null,
      permission_state: pushClientIdState?.push_clientid ? "granted" : "prompt",
      appid: this.runtime.pushAppId || this.runtime.remoteAppId || null
    });
    this.pushPreview = await loadNotificationDeliveryPreview({
      quiet_hours_active: this.notifications.prefs?.quiet_hours?.enabled,
      digest_enabled: this.notifications.prefs?.enable_digest,
      notification_inbox_id: "inbox_internal_preview"
    });
  },
  methods: {
    openFeedInbox() {
      writeRouteAliasState("inbox", "/pages/feed/index?focus=inbox");
      uni.switchTab({
        url: "/pages/feed/index"
      });
    },
    async openItem(item) {
      if (!item?._id) {
        return;
      }

      await markNotificationsRead([item._id]);

      if (item.article_id) {
        setCurrentArticle(item.article_id);
        setEntrySource("inbox");
        setReadingMode("deep_3m");
        uni.navigateTo({
          url: `/pages/detail/index?articleId=${item.article_id}&readingMode=deep_3m&source=inbox`
        });
      }
    }
  }
};
</script>

<style>
.inbox-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}
</style>
