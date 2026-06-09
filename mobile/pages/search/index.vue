<template>
  <view :style="$theme.pageShell" class="search-page">
    <view class="search-topbar">
      <view>
        <text class="search-topbar-title">{{ pageTitle }}</text>
      </view>
    </view>

    <view :style="$theme.pageSection">
      <AppCard>
        <view class="search-input-row">
          <input v-model="query" class="search-input" placeholder="搜索文章、来源、期次、主题" @input="handleQueryInput" @confirm="runSearch('manual')" />
          <view
            class="search-submit"
            :class="searchSubmitClassObject"
            @touchstart="handleSearchPressStart"
            @touchend="handleSearchPressEnd"
            @touchcancel="handleSearchPressEnd"
            @click="runSearch('manual')"
          >
            <text class="search-submit-text">{{ searchSubmitLabel }}</text>
          </view>
        </view>
        <view class="search-toolbar">
          <text v-if="activeFilterCount" class="search-filter-summary">已启用 {{ activeFilterCount }} 个筛选</text>
          <view class="search-toggle" @click="toggleAdvancedFilters">
            <text class="search-toggle-text">{{ showAdvancedFilters ? "收起筛选" : "更多筛选" }}</text>
          </view>
        </view>
        <view v-if="searchFeedbackLabel" class="search-feedback" :class="searchFeedbackToneClass">
          <text class="search-feedback-text">{{ searchFeedbackLabel }}</text>
        </view>
        <view class="chip-row">
          <FilterChip
            v-for="publication in publicationFilters"
            :key="publication"
            :label="formatLabel(publication)"
            :active="filters.publication === publication"
            @click="toggleFilter('publication', publication)"
          />
        </view>
        <view v-if="showAdvancedFilters" class="search-advanced-stack">
          <view v-if="issueFilters.length" class="filter-group">
            <text class="filter-group-title">期次</text>
            <view class="chip-row chip-row-compact">
              <FilterChip
                v-for="issueId in issueFilters"
                :key="issueId"
                :label="formatIssue(issueId)"
                :active="filters.issue_id === issueId"
                @click="toggleFilter('issue_id', issueId)"
              />
            </view>
          </view>
          <view v-if="canonicalSectionFilters.length" class="filter-group">
            <text class="filter-group-title">栏目</text>
            <view class="chip-row chip-row-compact">
              <FilterChip
                v-for="section in canonicalSectionFilters"
                :key="section"
                :label="formatLabel(sectionLabels[section] || section)"
                :active="filters.canonical_section_key === section"
                @click="toggleFilter('canonical_section_key', section)"
              />
            </view>
          </view>
          <view v-if="discoveryBucketFilters.length" class="filter-group">
            <text class="filter-group-title">主题桶</text>
            <view class="chip-row chip-row-compact">
              <FilterChip
                v-for="bucket in discoveryBucketFilters"
                :key="bucket"
                :label="formatLabel(bucket)"
                :active="filters.discovery_bucket === bucket"
                @click="toggleFilter('discovery_bucket', bucket)"
              />
            </view>
          </view>
          <view v-if="tagFilters.length" class="filter-group">
            <text class="filter-group-title">标签</text>
            <view class="chip-row chip-row-compact">
              <FilterChip
                v-for="tag in tagFilters"
                :key="tag"
                :label="formatLabel(tag)"
                :active="filters.tag === tag"
                @click="toggleFilter('tag', tag)"
              />
            </view>
          </view>
          <view class="filter-group">
            <text class="filter-group-title">阅读深度</text>
            <view class="chip-row chip-row-compact">
              <FilterChip
                v-for="mode in readingModeFilters"
                :key="mode"
                :label="mode === 'quick_30s' ? '30 秒速览' : '3 分钟精读'"
                :active="filters.reading_mode === mode"
                @click="toggleFilter('reading_mode', mode)"
              />
            </view>
          </view>
        </view>
      </AppCard>
    </view>

    <view v-if="showFollowCatalog" :style="$theme.pageSection">
      <AppCard tone="muted">
        <SectionHeader eyebrow="关注" title="关注杂志" compact />
        <view class="chip-row">
          <FollowChip
            v-for="subject in followSubjects"
            :key="keyFor(subject)"
            :label="subject.display_name || subject.publication_key || subject.tag_key"
            :active="isFollowing(subject)"
            @toggle="toggleFollow(subject)"
          />
        </view>
      </AppCard>
    </view>

    <view :style="$theme.pageSection">
      <view class="result-head">
        <text class="result-title">来源结果</text>
        <text class="result-meta">{{ publicationResults.length }} 个匹配项</text>
      </view>
      <view v-if="publicationResults.length" class="source-grid">
        <view
          v-for="item in publicationResults"
          :key="item._id"
          class="source-card"
          @click="pickPublicationResult(item)"
        >
          <view class="source-icon">
            <text class="source-icon-text">{{ sourceInitial(item.title) }}</text>
          </view>
          <view class="source-copy">
            <text class="source-title">{{ formatLabel(item.title) }}</text>
            <text class="source-meta">{{ item.issue_count }} 期 · 最新 {{ item.latest_issue_display_label || "未标注" }}</text>
          </view>
        </view>
      </view>
      <AppCard v-else tone="muted">
        <text class="empty-copy">暂无匹配来源</text>
      </AppCard>
    </view>

    <view :style="$theme.pageSection">
      <view class="result-head">
        <text class="result-title">期次结果</text>
        <text class="result-meta">{{ issueResults.length }} 个匹配项</text>
      </view>
      <view v-if="issueResults.length" class="issue-grid">
        <view
          v-for="item in issueResults"
          :key="item._id"
          class="issue-card"
          @click="pickIssueResult(item)"
        >
          <view class="issue-card-top">
            <text class="issue-title">{{ item.issue_display_label || item.issue_label }}</text>
            <text class="issue-count">{{ item.article_count }} 篇</text>
          </view>
          <text class="issue-publication">{{ item.publication_name || formatLabel(item.publication_key) }}</text>
        </view>
      </view>
      <AppCard v-else tone="muted">
        <text class="empty-copy">暂无匹配期次</text>
      </AppCard>
    </view>

    <view :style="$theme.pageSection">
      <view class="result-head">
        <text class="result-title">文章结果</text>
        <text class="result-meta">{{ searchError ? "搜索暂时不可用" : articleResults.length ? "相关度排序" : "输入关键词后开始检索" }}</text>
      </view>
      <view v-if="articleResults.length" class="search-results">
        <view v-for="item in articleResults" :key="item.article_id || item._id || item.title" class="article-card" @click="openItem(item)">
          <view class="article-card-top">
            <text class="article-kicker">{{ discoveryKicker(item) || formatLabel(item.publication_key || item.publication_id || item.reason || "内容") }}</text>
            <text class="article-time">{{ item.publish_at ? item.publish_at.slice(0, 10) : formatIssue(item.issue_id) || "可阅读" }}</text>
          </view>
          <text class="article-title">{{ item.title }}</text>
          <ArticleDigestBlock :source="item" />
          <view v-if="item.discovery_bucket" class="article-badges">
            <view class="article-badge">
              <text class="article-badge-text article-badge-text-muted">{{ formatLabel(sectionLabels[item.canonical_section_key] || item.discovery_bucket) }}</text>
            </view>
          </view>
        </view>
      </view>
      <AppCard v-else-if="searchError" tone="error">
        <text class="empty-copy">{{ searchError }}</text>
      </AppCard>
      <AppCard v-else tone="muted">
        <text class="empty-copy">暂无匹配文章</text>
      </AppCard>
    </view>
  </view>
</template>

<script>
import ArticleDigestBlock from "../../components/discovery/ArticleDigestBlock.vue";
import FilterChip from "../../components/discovery/FilterChip.vue";
import FollowChip from "../../components/discovery/FollowChip.vue";
import AppCard from "../../components/ui/AppCard.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { consumeRouteAliasState } from "../../services/navigation-state.service.js";
import { recordObservabilityEvent } from "../../services/observability.service.js";
import { loadFollowCatalog, toggleFollowSubject } from "../../services/follow.service.js";
import { searchDiscoveryContent } from "../../services/search.service.js";
import { discoveryKicker, issueSummaryLabel } from "../../services/taxonomy-meta.service.js";
import { setCurrentArticle, setEntrySource, setReadingMode } from "../../stores/reader.store.js";
import { getIssueMeta } from "../../shared/utils/issue-meta.js";

export default {
  components: {
    ArticleDigestBlock,
    AppCard,
    FilterChip,
    FollowChip,
    SectionHeader
  },
  data() {
    return {
      focusTarget: "",
      query: "",
      results: [],
      facets: {
        publication: [],
        issue_id: [],
        tag: [],
        canonical_section_key: [],
        discovery_bucket: []
      },
      followSubjects: [],
      activeKeys: new Set(),
      isSearching: false,
      searchError: "",
      searchTimer: null,
      lastSearchQuery: "",
      lastSearchResultCount: 0,
      lastSearchPublicationCount: 0,
      lastSearchTrigger: "",
      isSearchButtonPressed: false,
      showSearchSuccessState: false,
      searchSuccessTimer: null,
      showAdvancedFilters: false,
      showFollowCatalog: true,
      issueFacetMeta: {},
      filters: {
        tag: "",
        publication: "",
        issue_id: "",
        canonical_section_key: "",
        discovery_bucket: "",
        reading_mode: ""
      },
      readingModeFilters: ["quick_30s"],
      sectionLabels: {}
    };
  },
  computed: {
    pageTitle() {
      return this.focusTarget === "follows" ? "来源与关注" : "来源";
    },
    publicationFilters() {
      return this.facets.publication || [];
    },
    tagFilters() {
      return this.facets.tag || [];
    },
    issueFilters() {
      return (this.facets.issue_id || []).filter((issueId) => {
        if (!this.filters.publication) {
          return true;
        }
        return this.issueFacetMeta[issueId]?.publication_key === this.filters.publication;
      });
    },
    canonicalSectionFilters() {
      return this.facets.canonical_section_key || [];
    },
    discoveryBucketFilters() {
      return this.facets.discovery_bucket || [];
    },
    publicationResults() {
      const grouped = new Map();
      this.results.forEach((item) => {
        const publicationKey = item.publication_key || item.publication_id;
        if (!publicationKey) {
          return;
        }
        if (!grouped.has(publicationKey)) {
          grouped.set(publicationKey, {
            _id: publicationKey,
            title: item.publication_name || publicationKey,
            publication_key: publicationKey,
            issue_count: 0,
            latest_issue_display_label: "",
            latest_issue_sort_key: "",
            article_count: 0,
            _issueIds: new Set()
          });
        }
        const issueMeta = getIssueMeta(item);
        const entry = grouped.get(publicationKey);
        entry.article_count += 1;
        if (issueMeta.issue_id && !entry._issueIds.has(issueMeta.issue_id)) {
          entry._issueIds.add(issueMeta.issue_id);
          entry.issue_count += 1;
        }
        if ((issueMeta.issue_sort_key || "") > (entry.latest_issue_sort_key || "")) {
          entry.latest_issue_sort_key = issueMeta.issue_sort_key || "";
          entry.latest_issue_display_label = issueMeta.issue_display_label || issueMeta.issue_label || "";
        }
      });
      return Array.from(grouped.values())
        .map((item) => ({
          ...item,
          _issueIds: undefined
        }))
        .sort((left, right) => {
          if (right.article_count !== left.article_count) {
            return right.article_count - left.article_count;
          }
          if ((right.latest_issue_sort_key || "") !== (left.latest_issue_sort_key || "")) {
            return String(right.latest_issue_sort_key || "").localeCompare(String(left.latest_issue_sort_key || ""));
          }
          return String(left.title || "").localeCompare(String(right.title || ""));
        });
    },
    issueResults() {
      const grouped = new Map();
      this.results.forEach((item) => {
        const issueMeta = getIssueMeta(item);
        if (!issueMeta.issue_id) {
          return;
        }
        if (!grouped.has(issueMeta.issue_id)) {
          grouped.set(issueMeta.issue_id, {
            _id: issueMeta.issue_id,
            issue_id: issueMeta.issue_id,
            issue_label: issueMeta.issue_label,
            issue_display_label: issueMeta.issue_display_label,
            issue_sort_key: issueMeta.issue_sort_key,
            publication_key: item.publication_key || item.publication_id,
            publication_name: item.publication_name || "",
            article_count: 0
          });
        }
        grouped.get(issueMeta.issue_id).article_count += 1;
      });
      return Array.from(grouped.values()).sort((left, right) => {
        if ((right.issue_sort_key || "") !== (left.issue_sort_key || "")) {
          return String(right.issue_sort_key || "").localeCompare(String(left.issue_sort_key || ""));
        }
        if (right.article_count !== left.article_count) {
          return right.article_count - left.article_count;
        }
        return String(left.publication_name || left.publication_key || "").localeCompare(String(right.publication_name || right.publication_key || ""));
      });
    },
    articleResults() {
      const seen = new Set();
      return this.results.filter((item) => {
        const articleId = item?.article_id || item?._id || item?.title || null;
        if (!articleId) {
          return true;
        }
        if (seen.has(articleId)) {
          return false;
        }
        seen.add(articleId);
        return true;
      });
    },
    activeFilterCount() {
      return Object.values(this.filters).filter(Boolean).length;
    },
    searchFeedbackLabel() {
      if (this.isSearching) {
        return this.query ? `正在搜索“${this.query}”...` : "正在刷新当前结果...";
      }
      if (this.searchError) {
        return this.searchError;
      }
      if (!this.lastSearchTrigger) {
        return "";
      }
      const queryLabel = this.lastSearchQuery ? `“${this.lastSearchQuery}”` : "当前条件";
      return `${queryLabel} 已更新：${this.lastSearchResultCount} 篇文章，${this.lastSearchPublicationCount} 个来源`;
    },
    searchFeedbackToneClass() {
      if (this.searchError) {
        return "search-feedback-error";
      }
      if (this.isSearching) {
        return "search-feedback-loading";
      }
      return "search-feedback-success";
    },
    searchSubmitLabel() {
      if (this.isSearching) {
        return "搜索中";
      }
      if (this.showSearchSuccessState) {
        return "已更新";
      }
      return "搜索";
    },
    searchSubmitClassObject() {
      return {
        "search-submit-loading": this.isSearching,
        "search-submit-pressed": this.isSearchButtonPressed && !this.isSearching,
        "search-submit-success": this.showSearchSuccessState && !this.isSearching && !this.searchError
      };
    }
  },
  onLoad(query) {
    const aliasState = consumeRouteAliasState();
    this.focusTarget = query.focus || (aliasState.lastAlias === "follows" ? "follows" : "");
    this.showFollowCatalog = true;
  },
  async onShow() {
    await Promise.all([this.loadFollowState(), this.runSearch("lifecycle")]);
  },
  onHide() {
    this.clearSearchTimer();
    this.clearSearchSuccessTimer();
  },
  beforeDestroy() {
    this.clearSearchTimer();
    this.clearSearchSuccessTimer();
  },
  methods: {
    formatLabel(value) {
      return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    },
    formatIssue(issueId) {
      return issueSummaryLabel(this.issueFacetMeta[issueId] || { issue_id: issueId }) || issueId;
    },
    sourceInitial(value) {
      return String(this.formatLabel(value || "源")).slice(0, 1);
    },
    discoveryKicker,
    async loadFollowState() {
      const response = await loadFollowCatalog("publication");
      this.followSubjects = response.subjects || [];
      this.activeKeys = new Set(
        this.followSubjects.filter((item) => item.is_followed).map((item) => this.keyFor(item))
      );
      this.activeKeys = new Set(this.activeKeys);
    },
    keyFor(subject) {
      return subject.publication_key ? `publication:${subject.publication_key}` : `topic_tag:${subject.tag_key}`;
    },
    isFollowing(subject) {
      return this.activeKeys.has(this.keyFor(subject));
    },
    async runSearch(trigger = "manual") {
      this.clearSearchTimer();
      this.clearSearchSuccessTimer();
      this.isSearching = true;
      this.searchError = "";
      const activeFilters = Object.fromEntries(
        Object.entries(this.filters).filter(([, value]) => Boolean(value))
      );
      try {
        const response = await searchDiscoveryContent(this.query, activeFilters);
        this.results = response.items || [];
        this.facets = {
          publication: response.facets?.publication || [],
          issue_id: response.facets?.issue_id || [],
          tag: response.facets?.tag || [],
          canonical_section_key: response.facets?.canonical_section_key || [],
          discovery_bucket: response.facets?.discovery_bucket || []
        };
        this.issueFacetMeta = Object.fromEntries(
          this.results
            .map((item) => {
              const issueMeta = getIssueMeta(item);
              return issueMeta.issue_id
                ? [
                    issueMeta.issue_id,
                    {
                      issue_id: issueMeta.issue_id,
                      issue_label: issueMeta.issue_label,
                      issue_display_label: issueMeta.issue_display_label,
                      publication_key: item.publication_key || item.publication_id
                    }
                  ]
                : null;
            })
            .filter(Boolean)
        );
        this.sectionLabels = Object.fromEntries(
          this.results
            .filter((item) => item.canonical_section_key && item.canonical_section_label)
            .map((item) => [item.canonical_section_key, item.canonical_section_label])
        );
        this.lastSearchQuery = this.query.trim();
        this.lastSearchResultCount = this.articleResults.length;
        this.lastSearchPublicationCount = this.publicationResults.length;
        this.lastSearchTrigger = trigger;
        this.armSearchSuccessState();
        await ingestRuntimeEvent("search_query", {
          query: this.query,
          result_count: this.results.length
        });
      } catch (error) {
        this.results = [];
        this.searchError = error.message || "搜索暂时不可用";
        this.lastSearchTrigger = trigger;
        this.showSearchSuccessState = false;
      } finally {
        this.isSearching = false;
      }
    },
    handleSearchPressStart() {
      this.isSearchButtonPressed = true;
    },
    handleSearchPressEnd() {
      this.isSearchButtonPressed = false;
    },
    handleQueryInput() {
      this.clearSearchTimer();
      this.searchTimer = setTimeout(() => {
        this.runSearch("input");
      }, 220);
    },
    toggleAdvancedFilters() {
      this.showAdvancedFilters = !this.showAdvancedFilters;
    },
    clearSearchTimer() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
    },
    clearSearchSuccessTimer() {
      if (this.searchSuccessTimer) {
        clearTimeout(this.searchSuccessTimer);
        this.searchSuccessTimer = null;
      }
    },
    armSearchSuccessState() {
      this.showSearchSuccessState = true;
      this.clearSearchSuccessTimer();
      this.searchSuccessTimer = setTimeout(() => {
        this.showSearchSuccessState = false;
        this.searchSuccessTimer = null;
      }, 900);
    },
    async toggleFilter(key, value) {
      if (key === "publication" && this.filters.publication !== value) {
        this.filters.issue_id = "";
      }
      this.filters[key] = this.filters[key] === value ? "" : value;
      if (key === "issue_id" && this.filters[key]) {
        const issueMeta = this.issueFacetMeta[this.filters[key]];
        if (issueMeta?.publication_key) {
          this.filters.publication = issueMeta.publication_key;
        }
      }
      await recordObservabilityEvent({
        event_type: "discovery_filter_applied",
        source_surface: "app",
        canonical_section_key: key === "canonical_section_key" ? this.filters[key] || null : null,
        discovery_bucket: key === "discovery_bucket" ? this.filters[key] || null : null,
        details: {
          filter_key: key,
          filter_value: this.filters[key] || "cleared"
        }
      });
      await ingestRuntimeEvent("filter_apply", {
        filter_key: key,
        filter_value: this.filters[key] || "cleared"
      });
      await this.runSearch("filter");
    },
    async toggleFollow(subject) {
      const key = this.keyFor(subject);
      const subjectType = subject.publication_key ? "publication" : "topic_tag";
      const subjectKey = subject.publication_key || subject.tag_key;
      const nextState = this.activeKeys.has(key) ? "removed" : "followed";
      await toggleFollowSubject(subjectType, subjectKey, nextState);
      await this.loadFollowState();
      await ingestRuntimeEvent(nextState === "followed" ? "follow_add" : "follow_remove", {
        subject_type: subjectType,
        subject_key: subjectKey,
        source_surface: "search"
      });
    },
    async pickPublicationResult(item) {
      this.filters.publication = item.publication_key || item.title;
      this.filters.issue_id = "";
      await this.runSearch("publication_pick");
    },
    async pickIssueResult(item) {
      this.filters.publication = item.publication_key || "";
      this.filters.issue_id = item.issue_id || "";
      await this.runSearch("issue_pick");
    },
    openItem(item) {
      setCurrentArticle(item.article_id);
      setEntrySource("search");
      setReadingMode("deep_3m");
      uni.navigateTo({
        url: `/pages/detail/index?articleId=${item.article_id}&readingMode=deep_3m&source=search`
      });
    }
  }
};
</script>

<style>
.search-page {
  display: flex;
  flex-direction: column;
}

.search-topbar-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2933;
}

.search-input {
  flex: 1;
  min-height: 88rpx;
  padding: 18rpx 22rpx;
  border-radius: 26rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
  box-sizing: border-box;
}

.search-input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-submit {
  flex-shrink: 0;
  min-height: 88rpx;
  padding: 0 28rpx;
  border-radius: 26rpx;
  background: #eef4fb;
  border: 1rpx solid #d8e2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  box-shadow: 0 8rpx 18rpx rgba(0, 68, 147, 0.08);
}

.search-submit-loading {
  background: #dfeafb;
  border-color: #b8cff7;
}

.search-submit-pressed {
  transform: scale(0.97);
  background: #d8e6fb;
  border-color: #a9c4f4;
  box-shadow: 0 4rpx 10rpx rgba(0, 68, 147, 0.12);
}

.search-submit-success {
  background: #e7f2e6;
  border-color: #bfd8bd;
  box-shadow: 0 8rpx 18rpx rgba(69, 98, 78, 0.12);
}

.search-submit-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #004493;
}

.search-submit-success .search-submit-text {
  color: #45624e;
}

.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 14rpx;
}

.search-filter-summary {
  flex: 1;
  font-size: 22rpx;
  line-height: 1.5;
  color: #6b7280;
}

.search-toggle {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #f3f5ef;
  border: 1rpx solid #e0e3e6;
}

.search-toggle-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #52606d;
}

.search-feedback {
  margin-top: 14rpx;
  padding: 14rpx 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid #dfe5dc;
  background: #f6f7f3;
}

.search-feedback-text {
  font-size: 22rpx;
  line-height: 1.6;
  color: #52606d;
}

.search-feedback-loading {
  background: #eef4fb;
  border-color: #d8e2ff;
}

.search-feedback-loading .search-feedback-text {
  color: #004493;
}

.search-feedback-success {
  background: #f2f6ef;
  border-color: #dce7d4;
}

.search-feedback-success .search-feedback-text {
  color: #45624e;
}

.search-feedback-error {
  background: #fdf2f2;
  border-color: #f4c7c7;
}

.search-feedback-error .search-feedback-text {
  color: #a33a3a;
}

.search-advanced-stack {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 14rpx;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.filter-group-title {
  font-size: 20rpx;
  font-weight: 700;
  color: #7b8794;
  letter-spacing: 0.04em;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.chip-row-compact {
  margin-top: 0;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.result-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #191c1e;
}

.result-meta,
.empty-copy {
  font-size: 24rpx;
  color: #727785;
}

.source-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.source-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.035);
}

.source-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: #eef4fb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.source-icon-text {
  font-size: 24rpx;
  font-weight: 800;
  color: #005bbf;
}

.source-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.source-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2933;
}

.source-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #6b7280;
}

.issue-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.issue-card {
  padding: 24rpx;
  border-radius: 30rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.035);
}

.issue-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.issue-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2933;
}

.issue-count,
.issue-publication {
  font-size: 22rpx;
  color: #6b7280;
}

.issue-publication {
  display: block;
  margin-top: 10rpx;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.article-card {
  padding: 30rpx;
  border-radius: 30rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.035);
}

.article-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.article-kicker {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #005bbf;
  text-transform: uppercase;
}

.article-time {
  font-size: 22rpx;
  color: #727785;
}

.article-title {
  display: block;
  margin-top: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.42;
  color: #1f2933;
}

.article-summary {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.72;
  color: #52606d;
}

.article-summary-taxonomy {
  color: #7b8794;
}

.article-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.article-badge {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #eff2eb;
}

.article-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #415161;
}

.article-badge-text-muted {
  color: #52606d;
}
</style>
