<template>
  <view :style="detailPageStyle" class="detail-page">
    <text v-if="showDevVisibilitySentinel" class="dev-sentinel">DETAIL_PAGE_READY</text>

    <view class="detail-nav">
      <view class="detail-nav-button" @click="goBack">
        <text class="detail-nav-icon">返</text>
      </view>
      <text class="detail-nav-source">{{ publicationLabel }}</text>
      <view class="detail-nav-button detail-nav-button-right" @click="openPaywall">
        <text class="detail-nav-icon">益</text>
      </view>
    </view>

    <ArticleTitleBlock :title="articleTitle" />

    <view :style="$theme.pageSection" class="detail-switch-stack">
      <ModeTabs :tabs="audienceTabs" :value="reader.audienceMode" @change="switchAudience" />
    </view>

    <view :style="$theme.pageSection">
      <StatePanel
        v-if="detailState === 'loading'"
        state="loading"
        title="正在准备阅读内容"
        message="根据安全边界和当前 audience 选择可用版本。"
      />
      <StatePanel
        v-else-if="detailState === 'error'"
        state="error"
        title="这篇文章暂时打不开"
        :message="errorMessage"
        action-text="重试"
        @action="loadDetail"
      />
      <UnavailableReasonBlock
        v-else-if="detailState === 'unavailable'"
        :audience-mode="reader.audienceMode"
        :unavailable-reason="unavailableReason"
      />
      <view v-else :style="$theme.sectionStack">
        <StatePanel
          v-if="detailState === 'cached'"
          state="cached"
          title="正在阅读缓存版本"
          :message="errorMessage"
          hint="缓存仍按 audience 与阅读模式隔离，不会跨安全边界复用。"
        />

        <AppCard class="detail-reading-card" :style="detailReadingCardStyle">
          <SectionHeader eyebrow="阅读" title="3 分钟精读" compact />
          <MetaRow :items="detailMeta" />
          <view class="detail-tags">
            <UpdateBadge v-if="detail && detail.resolved_variant && detail.resolved_variant.update_type" :update-type="detail.resolved_variant.update_type" />
            <ArticleTagRow :tags="detailTags" />
          </view>
          <view class="detail-divider" :style="$theme.divider" />
          <ArticleBodyBlock :body="body" reading-mode="deep_3m" />
        </AppCard>

        <AppCard tone="muted">
          <SectionHeader eyebrow="操作" title="阅读操作" compact />
          <MetaRow :items="actionMeta" />
          <view class="detail-actions">
            <AppButton :label="isSaved ? '移出稍后再读' : '保存到稍后再读'" tone="secondary" @click="toggleSaveForLater(!isSaved)" />
            <AppButton v-if="showPaywallAction" label="查看订阅说明" tone="subtle" @click="openPaywall" />
          </view>
        </AppCard>

        <AppCard tone="muted">
          <SectionHeader eyebrow="权益" title="阅读权益" compact />
          <MetaRow :items="accessMeta" />
          <text class="access-note">{{ paywallReason }}</text>
          <QuotaStatusCard v-if="quotaStatus" :quota="quotaStatus" />
        </AppCard>
      </view>
    </view>
  </view>
</template>

<script>
import ArticleBodyBlock from "../../components/reader/ArticleBodyBlock.vue";
import ArticleTagRow from "../../components/reader/ArticleTagRow.vue";
import ArticleTitleBlock from "../../components/reader/ArticleTitleBlock.vue";
import UnavailableReasonBlock from "../../components/reader/UnavailableReasonBlock.vue";
import UpdateBadge from "../../components/discovery/UpdateBadge.vue";
import QuotaStatusCard from "../../components/commercial/QuotaStatusCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import ModeTabs from "../../components/ui/ModeTabs.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import StatePanel from "../../components/ui/StatePanel.vue";
import { buildDetailCacheKey, getCachedValue, setCachedValue } from "../../services/cache.service.js";
import { normalizeDetailPayload } from "../../services/content-normalizer.service.js";
import { saveForLater, updateLocalReadState } from "../../services/content-state.service.js";
import { isDevVisibilityEnabled } from "../../services/dev-visibility.service.js";
import { loadEntitlementSnapshot } from "../../services/entitlement.service.js";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { recordObservabilityEvent } from "../../services/observability.service.js";
import { loadQuotaStatus } from "../../services/quota.service.js";
import { runtimeGateway } from "../../services/runtime-gateway.service.js";
import {
  getReaderState,
  setAudienceMode,
  setCurrentArticle,
  setEntrySource,
  setReaderStatus,
  setReadingMode,
  setResolvedVariant
} from "../../stores/reader.store.js";
import { getSessionState } from "../../stores/session.store.js";
import { issueSummaryLabel, taxonomySummaryLabel } from "../../services/taxonomy-meta.service.js";
import { buildDetailMeta, formatAudienceLabel } from "../../utils/format-reading-meta.js";
import { mergeStyles } from "../../theme/index.js";

const PREFETCH_AUDIENCE_MODES = ["teen", "general", "adult"];
const detailPrefetchInflight = new Map();

export default {
  components: {
    AppButton,
    AppCard,
    ArticleBodyBlock,
    ArticleTagRow,
    ArticleTitleBlock,
    MetaRow,
    ModeTabs,
    QuotaStatusCard,
    SectionHeader,
    StatePanel,
    UnavailableReasonBlock,
    UpdateBadge
  },
  data() {
    return {
      articleId: "",
      detailState: "loading",
      detail: null,
      entitlement: {},
      quotaStatus: null,
      errorMessage: "",
      unavailableReason: "",
      savedStatus: false
    };
  },
  computed: {
    detailPageStyle() {
      return mergeStyles(this.$theme.pageShell, {
        paddingLeft: "16rpx",
        paddingRight: "16rpx",
        paddingTop: "20rpx"
      });
    },
    detailReadingCardStyle() {
      return {
        marginLeft: "-6rpx",
        marginRight: "-6rpx",
        paddingLeft: "24rpx",
        paddingRight: "24rpx",
        paddingTop: "28rpx",
        paddingBottom: "28rpx"
      };
    },
    showDevVisibilitySentinel() {
      return isDevVisibilityEnabled();
    },
    reader() {
      return getReaderState();
    },
    audienceTabs() {
      return [
        { value: "teen", label: "青少年" },
        { value: "general", label: "通用" },
        { value: "adult", label: "成人" }
      ];
    },
    articleTitle() {
      return this.detail?.resolved_variant?.title || this.detail?.article?.title || "阅读详情";
    },
    publicationLabel() {
      return (this.detail && this.detail.article && (this.detail.article.publication_name || this.detail.article.publication_key)) || "阅读详情";
    },
    body() {
      return this.detail?.resolved_variant?.markdown_body || "";
    },
    resolvedAudience() {
      return this.detail?.resolved_variant?.audience_segment || "";
    },
    detailMeta() {
      const detailMeta = buildDetailMeta(this.detail, this.entitlement);
      const publicationLabel = this.detail?.article?.publication_name || this.detail?.article?.publication_key || "";
      if (publicationLabel) {
        detailMeta.unshift(publicationLabel);
      }
      const issueLabel = issueSummaryLabel(this.detail?.article || {});
      if (issueLabel) {
        detailMeta.splice(publicationLabel ? 1 : 0, 0, issueLabel);
      }
      if (taxonomySummaryLabel(this.detail?.article || {})) {
        detailMeta.push(taxonomySummaryLabel(this.detail.article));
      }
      return detailMeta;
    },
    detailTags() {
      const tags = [
        {
          label: formatAudienceLabel(this.resolvedAudience || this.reader.audienceMode),
          tone: "neutral"
        }
      ];

      const issueLabel = issueSummaryLabel(this.detail?.article || {});
      if (issueLabel) {
        tags.push({
          label: issueLabel,
          tone: "muted"
        });
      }

      if (this.detailState === "cached") {
        tags.push({
          label: "缓存内容",
          tone: "info"
        });
      }

      if (this.detail?.resolved_variant?.premium_tier) {
        tags.push({
          label: this.detail.resolved_variant.premium_tier,
          tone: "muted"
        });
      }

      return tags;
    },
    accessMeta() {
      return [
        "权限 " + (this.entitlement.access_state || "未知"),
        "剩余额度 " + (this.entitlement.quota_remaining == null ? "未显示" : this.entitlement.quota_remaining),
        "说明 " + (this.entitlement.denial_reason || "无")
      ];
    },
    actionMeta() {
      return [
        this.reader.entrySource === "search" ? "返回搜索结果" : "返回首页保留位置",
        this.isSaved ? "已保存到稍后再读" : "可加入稍后再读"
      ];
    },
    isSaved() {
      return Boolean(this.savedStatus);
    },
    showPaywallAction() {
      return this.entitlement.access_state !== "active" || Number(this.entitlement.quota_remaining || 0) <= 0;
    },
    paywallReason() {
      if (this.entitlement.denial_reason === "QUOTA_EXHAUSTED") {
        return "今日免费额度已用完，可前往订阅页查看预览权益与套餐展示。";
      }
      if (this.entitlement.denial_reason) {
        return "当前版本受权益限制影响，可前往订阅页查看更清晰的展示说明。";
      }
      return "当前为本地预览权益说明，不触发真实支付。";
    }
  },
  onLoad(query) {
    this.articleId = query.articleId || "";
    setCurrentArticle(this.articleId);
    setEntrySource(query.source || "feed");
    setReadingMode("deep_3m");
  },
  async onShow() {
    await this.loadDetail();
  },
  methods: {
    async loadDetail() {
      const session = getSessionState();
      const cacheKey = buildDetailCacheKey(
        session.productKey,
        this.articleId,
        this.reader.audienceMode,
        this.reader.readingMode
      );
      const cachedDetail = getCachedValue(cacheKey);

      this.detailState = cachedDetail ? "cached" : "loading";
      this.errorMessage = "";
      this.unavailableReason = "";
      setReaderStatus(cachedDetail ? "cached" : "loading");

      if (cachedDetail) {
        this.detail = normalizeDetailPayload(cachedDetail);
        this.savedStatus = Boolean(cachedDetail.user_content_state?.bookmark_status === "saved");
      }

      try {
        const [detailResponse, entitlement, quotaStatus] = await Promise.all([
          runtimeGateway.getContentDetail({
            article_id: this.articleId,
            language: "zh-CN",
            audience_segment: this.reader.audienceMode,
            reading_mode: this.reader.readingMode,
            request_id: "req_detail_" + Date.now().toString(36)
          }),
          loadEntitlementSnapshot(),
          loadQuotaStatus()
        ]);

        const detail = normalizeDetailPayload(detailResponse);
        this.detail = detail;
        this.entitlement = entitlement;
        this.quotaStatus = quotaStatus;

        if (!detail.resolved_variant) {
          this.detailState = "unavailable";
          this.unavailableReason = detail.unavailable_reason || "CONTENT_UNAVAILABLE";
          setReaderStatus("unavailable", null, this.unavailableReason);
          await recordObservabilityEvent({
            event_type: "article_payload_incomplete",
            source_surface: "app",
            article_id: this.articleId,
            publication_id: detail.article?.publication_id || detail.article?.publication_key || null,
            error_code: "OBS1_ARTICLE_PAYLOAD_INCOMPLETE",
            error_message: detail.unavailable_reason || "CONTENT_UNAVAILABLE",
            details: {
              reading_mode: "deep_3m",
              audience_mode: this.reader.audienceMode
            }
          });
          return;
        }

        if (!detail.article?.article_id || !detail.resolved_variant?.article_variant_id || !detail.resolved_variant?.markdown_body) {
          await recordObservabilityEvent({
            event_type: "article_payload_incomplete",
            source_surface: "app",
            article_id: this.articleId,
            publication_id: detail.article?.publication_id || detail.article?.publication_key || null,
            error_code: "OBS1_ARTICLE_PAYLOAD_INCOMPLETE",
            error_message: "detail payload missing required fields",
            details: {
              has_article_id: Boolean(detail.article?.article_id),
              has_variant_id: Boolean(detail.resolved_variant?.article_variant_id),
              has_markdown_body: Boolean(detail.resolved_variant?.markdown_body)
            }
          });
        }

        this.savedStatus = Boolean(detail.user_content_state?.bookmark_status === "saved");
        setResolvedVariant(detail.resolved_variant.article_variant_id);
        setCachedValue(cacheKey, detail);
        this.prefetchAlternateAudienceDetails();
        updateLocalReadState(this.articleId, {
          last_opened_at: new Date().toISOString(),
          last_read_mode: this.reader.readingMode
        });
        this.detailState = "ready";
        setReaderStatus("ready");
        await recordObservabilityEvent({
          event_type: "detail_loaded",
          source_surface: "app",
          article_id: this.articleId,
          publication_id: detail.article?.publication_id || detail.article?.publication_key || null,
          canonical_section_key: detail.article?.canonical_section_key || null,
          discovery_bucket: detail.article?.discovery_bucket || null,
          details: {
            reading_mode: detail.resolved_variant.reading_mode,
            audience_segment: detail.resolved_variant.audience_segment
          }
        });

        await ingestRuntimeEvent("article_open", {
          article_id: this.articleId,
          article_variant_id: detail.resolved_variant.article_variant_id,
          audience_segment: detail.resolved_variant.audience_segment,
          reading_mode: detail.resolved_variant.reading_mode
        });
      } catch (error) {
        const [entitlement, quotaStatus] = await Promise.all([
          loadEntitlementSnapshot(),
          loadQuotaStatus()
        ]);
        this.entitlement = entitlement;
        this.quotaStatus = quotaStatus;

        if (cachedDetail) {
          this.detail = normalizeDetailPayload(cachedDetail);
          this.savedStatus = Boolean(cachedDetail.user_content_state?.bookmark_status === "saved");
          this.detailState = "cached";
          this.errorMessage = error.message;
          setReaderStatus("cached", error.message);
          return;
        }

        this.detailState = "error";
        this.errorMessage = error.message;
        setReaderStatus("error", error.message);
        await recordObservabilityEvent({
          event_type: "content_load_failed",
          source_surface: "app",
          article_id: this.articleId,
          error_code: "OBS1_CONTENT_LOAD_FAILED",
          error_message: error.message,
          details: {
            target: "detail",
            reading_mode: "deep_3m",
            audience_mode: this.reader.audienceMode,
            used_cache: false
          }
        });
      }
    },
    prefetchAlternateAudienceDetails() {
      const session = getSessionState();
      const currentAudience = this.reader.audienceMode;
      const readingMode = this.reader.readingMode;

      PREFETCH_AUDIENCE_MODES
        .filter((audienceMode) => audienceMode !== currentAudience)
        .forEach((audienceMode) => {
          const cacheKey = buildDetailCacheKey(
            session.productKey,
            this.articleId,
            audienceMode,
            readingMode
          );
          if (getCachedValue(cacheKey)) {
            return;
          }

          const inflightKey = `${this.articleId}::${audienceMode}::${readingMode}`;
          if (detailPrefetchInflight.has(inflightKey)) {
            return;
          }

          const task = runtimeGateway.getContentDetail({
            article_id: this.articleId,
            language: "zh-CN",
            audience_segment: audienceMode,
            reading_mode: readingMode,
            request_id: "req_detail_prefetch_" + Date.now().toString(36) + "_" + audienceMode
          })
            .then((response) => normalizeDetailPayload(response))
            .then((detail) => {
              if (detail?.resolved_variant?.markdown_body) {
                setCachedValue(cacheKey, detail);
              }
            })
            .catch(() => null)
            .finally(() => {
              detailPrefetchInflight.delete(inflightKey);
            });

          detailPrefetchInflight.set(inflightKey, task);
        });
    },
    async switchAudience(audienceMode) {
      setAudienceMode(audienceMode);
      await this.loadDetail();
    },
    async toggleSaveForLater(shouldSave) {
      const response = await saveForLater(this.articleId, shouldSave);
      this.savedStatus = response.bookmark_status === "saved";
      await ingestRuntimeEvent(shouldSave ? "bookmark_add" : "bookmark_remove", {
        article_id: this.articleId,
        bookmark_status: response.bookmark_status
      });
    },
    openPaywall() {
      uni.navigateTo({
        url: "/pages/paywall/index?articleId=" + this.articleId + "&reason=" + encodeURIComponent(this.entitlement.denial_reason || "")
      });
    },
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack({
          delta: 1
        });
        return;
      }
      uni.switchTab({
        url: "/pages/feed/index"
      });
    }
  }
};
</script>

<style>
.detail-page {
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

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.detail-nav-button {
  width: 60rpx;
  height: 60rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #e0e3e6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-nav-button-right {
  background: #eef4fb;
  border-color: #d8e2ff;
}

.detail-nav-icon {
  font-size: 22rpx;
  font-weight: 800;
  color: #005bbf;
}

.detail-nav-source {
  flex: 1;
  margin: 0 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #414754;
  text-align: center;
}

.detail-switch-stack {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.detail-tags {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 16rpx;
}

.detail-divider {
  width: 100%;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.access-note {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #5d6670;
}

.detail-reading-card {
  width: auto;
}
</style>
