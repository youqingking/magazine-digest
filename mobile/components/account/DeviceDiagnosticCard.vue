<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="Foundation" title="设备诊断" description="保留 H0.5 诊断摘要，但降低可见噪音。" compact />
    <MetaRow :items="metaItems" />
    <view class="diagnostic-summary">
      <text selectable="true" class="diagnostic-summary-text">{{ summaryText }}</text>
    </view>
    <view v-if="showCopy" class="diagnostic-actions">
      <AppButton label="复制诊断摘要" tone="secondary" @click="copySummary" />
    </view>
  </AppCard>
</template>

<script>
import AppButton from "../ui/AppButton.vue";
import AppCard from "../ui/AppCard.vue";
import MetaRow from "../ui/MetaRow.vue";
import SectionHeader from "../ui/SectionHeader.vue";

export default {
  components: {
    AppButton,
    AppCard,
    MetaRow,
    SectionHeader
  },
  props: {
    diagnostics: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    metaItems() {
      const diagnostics = this.diagnostics || {};
      return [
        "账号标识 " + (diagnostics.uid || "none"),
        "凭证状态 " + (diagnostics.token_state || "unknown"),
        "推送标识 " + (diagnostics.push_clientid || "missing"),
        "同步来源 " + (diagnostics.device_sync_source || "unknown"),
        "最近错误 " + (diagnostics.last_remote_error || "none"),
        "最近尝试 " + (diagnostics.last_attempt_at || "never")
      ];
    },
    summaryText() {
      const diagnostics = this.diagnostics || {};
      return [
        "uid=" + (diagnostics.uid || "none"),
        "token=" + (diagnostics.token_state || "unknown"),
        "cid=" + (diagnostics.push_clientid || "missing"),
        "source=" + (diagnostics.device_sync_source || "unknown"),
        "error=" + (diagnostics.last_remote_error || "none"),
        "attempted_with_cid=" + (diagnostics.attempted_with_cid ? "yes" : "no"),
        "time=" + (diagnostics.last_attempt_at || "never")
      ].join(" | ");
    },
    showCopy() {
      return typeof uni !== "undefined" && typeof uni.setClipboardData === "function";
    }
  },
  methods: {
    copySummary() {
      if (!this.showCopy) {
        return;
      }
      uni.setClipboardData({
        data: this.summaryText,
        success: () => {
          uni.showToast({
            title: "诊断摘要已复制",
            icon: "none"
          });
        }
      });
    }
  }
};
</script>

<style>
.diagnostic-summary {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border: 1rpx dashed #c1c6d6;
  border-radius: 18rpx;
  background: #f7f9fc;
}

.diagnostic-summary-text {
  color: #3b4658;
  font-size: 24rpx;
  line-height: 1.5;
}

.diagnostic-actions {
  margin-top: 20rpx;
}
</style>
