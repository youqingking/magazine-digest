<template>
  <view :style="$theme.pageShell" class="settings-page">
    <text v-if="showDevVisibilitySentinel" class="dev-sentinel">SETTINGS_PAGE_READY</text>
    <view class="settings-hero">
      <text class="settings-title">设置</text>
      <text class="settings-description">只保留阅读方式、通知偏好、设备与账号基础状态，不扩张成复杂后台。</text>
    </view>

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <AppCard>
          <SectionHeader eyebrow="数据来源" title="运行方式" description="这里可以切换本地、混合或远端接缝模式，方便开发预览。" compact />
          <view class="settings-block">
            <ModeTabs :tabs="runtimeTabs" :value="session.runtimeMode" @change="switchRuntime" />
          </view>
          <view class="runtime-health-banner" :class="'runtime-health-banner--' + runtimeHealthTone">
            <text class="runtime-health-title">{{ runtimeHealthTitle }}</text>
            <text class="runtime-health-body">{{ runtimeHealthHint }}</text>
          </view>
          <MetaRow :items="runtimeMeta" />
        </AppCard>

        <AppCard tone="muted">
          <SectionHeader eyebrow="远端桥接" title="内容自动更新" description="这一步只要配置一次，后续后台发布内容不需要重装客户端。" compact />
          <view class="settings-block">
            <text class="settings-field-label">Bridge Base URL</text>
            <input
              v-model="remoteBridgeDraft.remoteBaseUrl"
              class="settings-text-input"
              type="text"
              placeholder="https://runtime.example.com/runtime 或 http://8.136.215.40/magazine-runtime"
              confirm-type="done"
            />
          </view>
          <view class="settings-block">
            <text class="settings-field-label">Channel</text>
            <ModeTabs :tabs="remoteChannelTabs" :value="remoteBridgeDraft.remoteChannel" @change="switchRemoteChannel" />
          </view>
          <MetaRow :items="remoteBridgeMeta" />
          <text class="settings-helper-copy">内部发布版建议先保存一个可达的静态托管 / 对象存储 / 局域网 dist 地址，再切到混合或远端模式。后续内容发布走 channel head，不再把 app 包当内容载体。</text>
          <view class="settings-actions">
            <AppButton label="保存远端桥接" tone="secondary" @click="saveRemoteBridge" />
            <AppButton label="检测远端桥接" tone="subtle" @click="probeRemoteBridge" />
          </view>
          <text v-if="remoteBridgeProbeMessage" class="settings-helper-copy">{{ remoteBridgeProbeMessage }}</text>
        </AppCard>

        <AppCard tone="muted">
          <SectionHeader eyebrow="阅读" title="阅读默认值" description="控制默认人群。这里切到青少年后，首页与搜索里的 30 秒摘要也会跟着切换，并持续记住。" compact />
          <view class="settings-block">
            <ModeTabs :tabs="audienceTabs" :value="reader.audienceMode" @change="switchAudience" />
          </view>
          <text class="settings-helper-copy">青少年 / 通用 / 成人是全局阅读偏好，不只影响详情页，也会影响流内 30 秒摘要命中的版本。</text>
        </AppCard>

        <AppCard>
          <SectionHeader eyebrow="通知" title="通知偏好" description="在这里调整即时提醒和摘要提醒。" compact />
          <MetaRow :items="notificationMeta" />
          <view class="settings-actions">
            <AppButton label="即时通知开" tone="secondary" @click="toggleInstant(true)" />
            <AppButton label="即时通知关" tone="secondary" @click="toggleInstant(false)" />
            <AppButton label="摘要开" tone="secondary" @click="toggleDigest(true)" />
            <AppButton label="摘要关" tone="secondary" @click="toggleDigest(false)" />
          </view>
        </AppCard>

        <AuthStateCard :session="auth.session" :current-user-info="auth.currentUserInfo" />
        <DeviceStateCard :device="deviceState" />
        <PushStateCard :capability="pushCapability" :preview="pushPreview" />
        <DeviceDiagnosticCard :diagnostics="auth.deviceDiagnostics" />

        <AppCard tone="muted">
          <SectionHeader eyebrow="设备与会话" title="本地调试" description="保留开发调试需要的设备和会话状态，不影响正常使用。" compact />
          <MetaRow :items="debugMeta" />
          <view class="settings-actions">
            <AppButton label="刷新会话" tone="secondary" @click="refreshSessionCard" />
            <AppButton label="刷新设备状态" tone="secondary" @click="refreshIdentityFoundation" />
            <AppButton label="重置本地缓存" tone="subtle" @click="resetCache" />
          </view>
        </AppCard>

        <AppCard v-if="showDevVisibilitySentinel" tone="muted">
          <SectionHeader eyebrow="开发态" title="构建信息" description="仅开发态显示。这里展示最近一次写入包内的版本标记，运行 HBuilderX 前可先刷新到当前 HEAD。" compact />
          <view class="build-audit-meta">
            <text selectable="true" class="build-audit-line">分支：{{ buildMeta.branch }}</text>
            <text selectable="true" class="build-audit-line">版本标记：{{ buildMeta.shortSha }}</text>
            <text selectable="true" class="build-audit-line">描述：{{ buildMeta.describe || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">刷新时间：{{ buildMeta.buildTimestamp || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">基线标签：{{ buildMeta.baselineTag }}</text>
            <text selectable="true" class="build-audit-line">标记来源：{{ buildMeta.source || "unknown" }}</text>
          </view>
        </AppCard>

        <AppCard v-if="showDevVisibilitySentinel" tone="muted">
          <SectionHeader eyebrow="开发态" title="运行来源" description="仅开发态显示，帮助确认当前到底读的是哪一套内容。" compact />
          <view class="build-audit-meta">
            <text selectable="true" class="build-audit-line">运行模式：{{ runtimeProof.runtimeSourceMode }}</text>
            <text selectable="true" class="build-audit-line">场景：{{ runtimeProof.runtimeSourceScenarioId || runtimeProof.runtimeScenarioId }}</text>
            <text selectable="true" class="build-audit-line">频道：{{ runtimeProof.runtimeSourceChannel || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">发行版：{{ runtimeProof.runtimeSourceReleaseId || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">远端桥接：{{ runtimeProof.runtimeSourceRemoteBaseUrl || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">回退目标：{{ runtimeProof.runtimeSourceFallbackTarget || "未指定" }}</text>
            <text selectable="true" class="build-audit-line">current mirror：{{ runtimeProof.currentMirrorScenarioId }}</text>
            <text selectable="true" class="build-audit-line">最近同步：{{ runtimeProof.publishedToCurrentAt }}</text>
          </view>
        </AppCard>

        <AppCard v-if="showDevVisibilitySentinel" tone="muted">
          <SectionHeader eyebrow="开发态" title="运行健康" description="仅开发态显示，低强调展示最近的运行健康和错误摘要。" compact />
          <view class="build-audit-meta">
            <text selectable="true" class="build-audit-line">健康状态：{{ observability.last_health_status }}</text>
            <text selectable="true" class="build-audit-line">最近更新：{{ observability.updated_at || "未记录" }}</text>
            <text selectable="true" class="build-audit-line">最近错误数：{{ observability.recent_error_count }}</text>
            <text
              v-for="item in observability.recent_error_summary"
              :key="item.occurred_at + item.event_type"
              selectable="true"
              class="build-audit-line"
            >
              {{ item.occurred_at }} · {{ item.error_code || item.event_type }} · {{ item.error_message || "无说明" }}
            </text>
          </view>
        </AppCard>
      </view>
    </view>
  </view>
</template>

<script>
import AuthStateCard from "../../components/account/AuthStateCard.vue";
import DeviceDiagnosticCard from "../../components/account/DeviceDiagnosticCard.vue";
import DeviceStateCard from "../../components/account/DeviceStateCard.vue";
import PushStateCard from "../../components/account/PushStateCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import ModeTabs from "../../components/ui/ModeTabs.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { loadAuthSession, loadCurrentUserInfo, refreshAuthSession } from "../../services/auth.service.js";
import { getBuildMeta } from "../../services/build-meta.service.js";
import { getCacheDebugSummary, resetRuntimeCache } from "../../services/cache.service.js";
import { isDevVisibilityEnabled } from "../../services/dev-visibility.service.js";
import { getLastQueuedEvent, ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { getObservabilitySummary } from "../../services/observability.service.js";
import { registerCurrentDevice } from "../../services/device.service.js";
import { loadNotificationDeliveryPreview, loadPushCapability, loadPushClientId } from "../../services/push.service.js";
import { probeRemoteChannelBridge } from "../../services/remote-runtime.service.js";
import { isLoopbackRemoteRuntimeBaseUrl, normalizeRemoteRuntimeBaseUrl } from "../../services/remote-runtime-url.service.js";
import { getRuntimeProofSummary } from "../../services/runtime-proof.service.js";
import { getAuthState } from "../../stores/auth.store.js";
import { getNotificationsState, refreshNotificationPrefs, saveNotificationPrefs } from "../../stores/notifications.store.js";
import { getReaderState, setAudienceMode } from "../../stores/reader.store.js";
import { getSessionState, resetSessionState, setRuntimeMode } from "../../stores/session.store.js";
import { getRuntimeState, setRemoteRuntimeConfig } from "../../stores/runtime.store.js";

export default {
  components: {
    AppButton,
    AppCard,
    AuthStateCard,
    DeviceDiagnosticCard,
    DeviceStateCard,
    MetaRow,
    ModeTabs,
    PushStateCard,
    SectionHeader
  },
  data() {
    return {
      reader: getReaderState(),
      session: getSessionState(),
      runtime: getRuntimeState(),
      auth: getAuthState(),
      buildMeta: getBuildMeta(),
      runtimeProof: getRuntimeProofSummary(),
      observability: getObservabilitySummary(),
      cacheDebug: getCacheDebugSummary(),
      notifications: getNotificationsState(),
      remoteBridgeDraft: {
        remoteBaseUrl: normalizeRemoteRuntimeBaseUrl(getRuntimeState().remoteBaseUrl || ""),
        remoteChannel: getRuntimeState().remoteChannel || "dev"
      },
      remoteBridgeProbeMessage: "",
      deviceState: null,
      pushCapability: null,
      pushPreview: null,
      pushClientIdState: null
    };
  },
  computed: {
    showDevVisibilitySentinel() {
      return isDevVisibilityEnabled();
    },
    runtimeTabs() {
      return [
        { value: "local", label: "本地" },
        { value: "hybrid", label: "混合" },
        { value: "remote", label: "远端接缝" }
      ];
    },
    audienceTabs() {
      return [
        { value: "teen", label: "青少年" },
        { value: "general", label: "通用" },
        { value: "adult", label: "成人" }
      ];
    },
    remoteChannelTabs() {
      return [
        { value: "dev", label: "Dev" },
        { value: "staging", label: "Staging" },
        { value: "production", label: "Production" }
      ];
    },
    runtimeMeta() {
      return [
        "模式 " + this.runtime.runtimeMode,
        "当前来源 " + this.runtime.adapterLabel,
        "远端频道 " + (this.runtime.remoteChannel || "dev")
      ];
    },
    remoteBridgeMeta() {
      return [
        "当前地址 " + (this.runtime.remoteBaseUrl || "未设置"),
        "当前频道 " + (this.runtime.remoteChannel || "dev"),
        "当前模式 " + this.runtime.runtimeMode
      ];
    },
    runtimeHealthTone() {
      if (this.runtime.runtimeMode === "local") {
        return "healthy";
      }
      if (this.isLoopbackRemoteBaseUrl && !this.isH5Runtime) {
        return "warning";
      }
      return this.observability.last_health_status === "degraded" ? "warning" : "neutral";
    },
    runtimeHealthTitle() {
      if (this.runtime.runtimeMode === "local") {
        return "当前是本地优先模式";
      }
      if (this.isLoopbackRemoteBaseUrl && !this.isH5Runtime) {
        return "当前远端地址不适合真机";
      }
      if (this.runtime.runtimeMode === "hybrid") {
        return "当前是混合模式";
      }
      return "当前是远端接缝模式";
    },
    runtimeHealthHint() {
      if (this.runtime.runtimeMode === "local") {
        return "首屏会直接走本地内容，最适合日常开发和真机快速预览。";
      }
      if (this.isLoopbackRemoteBaseUrl && !this.isH5Runtime) {
        return "远端地址仍指向 127.0.0.1 或 localhost。真机上这会先请求手机自己，容易出现连接超时并拖慢首屏，建议切回本地模式或改成电脑局域网 IP。";
      }
      if (this.runtime.runtimeMode === "hybrid") {
        return "首屏会先展示本地内容，同时后台预热远端 bridge；后续刷新或再次进入页面时，才会优先命中远端内容。";
      }
      return "当前会直接读取远端 bridge。只有在 dist server 已启动且远端地址可达时才建议使用。";
    },
    isLoopbackRemoteBaseUrl() {
      return isLoopbackRemoteRuntimeBaseUrl(this.runtime.remoteBaseUrl || "");
    },
    isH5Runtime() {
      return typeof window !== "undefined" && typeof window.location !== "undefined" && /^https?:/i.test(window.location.protocol || "");
    },
    notificationMeta() {
      const prefs = this.notifications.prefs || {};
      const quietHours = prefs.quiet_hours || {};
      return [
        "即时提醒 " + (prefs.enable_instant ? "开" : "关"),
        "摘要提醒 " + (prefs.enable_digest ? "开" : "关"),
        "免打扰 " + (quietHours.enabled ? "开" : "关")
      ];
    },
    debugMeta() {
      return [
        "缓存键数 " + this.cacheDebug.tracked_key_count,
        "最近事件 " + this.lastEventName,
        "事件状态 " + this.lastEventStatus
      ];
    },
    lastEventStatus() {
      const lastEvent = getLastQueuedEvent();
      return lastEvent ? lastEvent.response.ingest_status : "none";
    },
    lastEventName() {
      const lastEvent = getLastQueuedEvent();
      return lastEvent ? lastEvent.request.event_name : "none";
    }
  },
  async onShow() {
    await this.refreshPrefs();
    await this.refreshIdentityFoundation();
    this.syncRemoteBridgeDraft();
  },
  methods: {
    syncRemoteBridgeDraft() {
      this.remoteBridgeDraft = {
        remoteBaseUrl: normalizeRemoteRuntimeBaseUrl(this.runtime.remoteBaseUrl || ""),
        remoteChannel: this.runtime.remoteChannel || "dev"
      };
    },
    async refreshIdentityFoundation() {
      await loadAuthSession();
      await loadCurrentUserInfo();
      this.runtimeProof = getRuntimeProofSummary();
      this.observability = getObservabilitySummary();
      this.cacheDebug = getCacheDebugSummary();
      this.pushClientIdState = await loadPushClientId();
      this.deviceState = await registerCurrentDevice({
        push_clientid: this.pushClientIdState?.push_clientid || null,
        appid: this.runtime.remoteAppId || null
      });
      this.pushCapability = await loadPushCapability({
        push_clientid: this.pushClientIdState?.push_clientid || null,
        permission_state: this.pushClientIdState?.push_clientid ? "granted" : "prompt",
        appid: this.runtime.pushAppId || this.runtime.remoteAppId || null
      });
      this.pushPreview = await loadNotificationDeliveryPreview({
        quiet_hours_active: this.notifications.prefs?.quiet_hours?.enabled,
        digest_enabled: this.notifications.prefs?.enable_digest,
        notification_inbox_id: "settings_preview"
      });
    },
    switchRemoteChannel(remoteChannel) {
      this.remoteBridgeDraft = {
        ...this.remoteBridgeDraft,
        remoteChannel
      };
    },
    saveRemoteBridge() {
      const remoteBaseUrl = normalizeRemoteRuntimeBaseUrl(this.remoteBridgeDraft.remoteBaseUrl || "");
      const remoteChannel = this.remoteBridgeDraft.remoteChannel || "dev";
      if (!remoteBaseUrl) {
        uni.showToast({
          title: "请先填写远端地址",
          icon: "none"
        });
        return;
      }
      if (!/^https?:\/\//i.test(remoteBaseUrl)) {
        uni.showToast({
          title: "远端地址需以 http:// 或 https:// 开头",
          icon: "none"
        });
        return;
      }

      setRemoteRuntimeConfig({
        remoteBaseUrl,
        remoteChannel
      });
      this.runtime = getRuntimeState();
      this.session = getSessionState();
      this.syncRemoteBridgeDraft();
      this.remoteBridgeProbeMessage = this.session.runtimeMode === "local"
        ? `远端桥接已保存到 ${remoteBaseUrl}。当前仍保持本地模式；只有你手动切到混合或远端模式时，首页才会优先读取远端内容。`
        : `远端桥接已保存到 ${remoteBaseUrl}。当前模式仍是 ${this.session.runtimeMode}。`;
      uni.showToast({
        title: "远端桥接已保存",
        icon: "none"
      });
    },
    async probeRemoteBridge() {
      const remoteBaseUrl = normalizeRemoteRuntimeBaseUrl(this.remoteBridgeDraft.remoteBaseUrl || "");
      const remoteChannel = this.remoteBridgeDraft.remoteChannel || "dev";
      if (!remoteBaseUrl) {
        this.remoteBridgeProbeMessage = "请先填写远端地址";
        return;
      }
      if (!/^https?:\/\//i.test(remoteBaseUrl)) {
        this.remoteBridgeProbeMessage = "远端地址需以 http:// 或 https:// 开头";
        return;
      }

      this.remoteBridgeProbeMessage = "正在检测远端桥接...";
      try {
        const remoteBridge = await probeRemoteChannelBridge({
          channel: remoteChannel,
          remoteBaseUrl
        });
        const articleCount = remoteBridge?.releaseManifest?.article_count || 0;
        this.remoteBridgeProbeMessage =
          `可达 · ${remoteChannel} / ${remoteBridge.releaseManifest.release_id} / ${articleCount} 篇内容 / ${remoteBridge.resolvedManifestUrl}`;
      } catch (error) {
        this.remoteBridgeProbeMessage = `不可达 · ${error.message || String(error)}`;
      }
    },
    async refreshPrefs() {
      await refreshNotificationPrefs();
    },
    switchAudience(audienceMode) {
      setAudienceMode(audienceMode);
      this.cacheDebug = getCacheDebugSummary();
    },
    async switchRuntime(runtimeMode) {
      setRuntimeMode(runtimeMode);
      await ingestRuntimeEvent("runtime_mode_switch", {
        target_runtime_mode: runtimeMode
      });
      this.runtime = getRuntimeState();
      this.session = getSessionState();
      this.observability = getObservabilitySummary();
      await this.refreshIdentityFoundation();
    },
    async toggleDigest(enabled) {
      await saveNotificationPrefs({
        digest_enabled: enabled
      });
      this.pushPreview = await loadNotificationDeliveryPreview({
        force_digest: enabled,
        notification_inbox_id: "settings_preview"
      });
    },
    async toggleInstant(enabled) {
      await saveNotificationPrefs({
        push_enabled: enabled
      });
      this.pushCapability = await loadPushCapability({
        push_clientid: enabled ? this.pushClientIdState?.push_clientid || "cid_needed_from_device" : null,
        permission_state: enabled ? "granted" : "prompt"
      });
    },
    async refreshSessionCard() {
      await refreshAuthSession();
      await loadCurrentUserInfo();
      this.runtimeProof = getRuntimeProofSummary();
      this.observability = getObservabilitySummary();
      uni.showToast({
        title: "会话已刷新",
        icon: "none"
      });
    },
    resetCache() {
      resetRuntimeCache();
      resetSessionState();
      this.runtime = getRuntimeState();
      this.session = getSessionState();
      this.runtimeProof = getRuntimeProofSummary();
      this.observability = getObservabilitySummary();
      this.cacheDebug = getCacheDebugSummary();
      uni.showToast({
        title: "本地缓存已重置",
        icon: "none"
      });
    }
  }
};
</script>

<style>
.settings-page {
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

.settings-hero {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.settings-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #191c1e;
}

.settings-description {
  font-size: 24rpx;
  line-height: 1.65;
  color: #414754;
}

.settings-block {
  margin-top: 16rpx;
}

.settings-helper-copy {
  display: block;
  margin-top: 14rpx;
  color: #5d6670;
  font-size: 22rpx;
  line-height: 1.6;
}

.settings-field-label {
  display: block;
  margin-bottom: 10rpx;
  color: #414754;
  font-size: 22rpx;
  font-weight: 700;
}

.settings-text-input {
  min-height: 84rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  border: 1rpx solid #d8ddd5;
  background: #ffffff;
  color: #191c1e;
  font-size: 24rpx;
}

.runtime-health-banner {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #f3f6f8;
}

.runtime-health-banner--healthy {
  background: #edf7ee;
}

.runtime-health-banner--warning {
  background: #fff4e5;
}

.runtime-health-banner--neutral {
  background: #eef3f7;
}

.runtime-health-title {
  color: #1f2d1f;
  font-size: 24rpx;
  font-weight: 700;
}

.runtime-health-body {
  color: #51606f;
  font-size: 22rpx;
  line-height: 1.6;
}

.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.build-audit-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 12rpx;
}

.build-audit-line {
  color: #51606f;
  font-size: 22rpx;
  line-height: 1.5;
}
</style>
