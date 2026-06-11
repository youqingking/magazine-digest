<template>
  <view :style="$theme.pageShell" class="feed-page">
    <view class="feed-topbar">
      <view class="feed-brand">
        <text class="feed-brand-mark">策</text>
        <text class="feed-brand-title">效率阅读</text>
      </view>
      <view class="feed-topbar-actions">
        <view class="feed-topbar-action" @click="openUpdates">
          <text class="feed-topbar-action-text">消息</text>
          <InboxBadge :count="unreadCount" />
        </view>
        <view class="feed-icon-button" @click="openPaywall">
          <text class="feed-icon-text">益</text>
        </view>
        <view class="feed-icon-button" @click="openSearch">
          <text class="feed-icon-text">搜</text>
        </view>
      </view>
    </view>

    <view class="feed-sticky-shell">
      <view class="feed-source-row">
        <scroll-view class="feed-pill-scroll" scroll-x="true" show-scrollbar="false">
          <view class="feed-pill-track">
            <FilterChip
              v-for="publication in sourceOptions"
              :key="publication.value"
              :label="publication.label"
              :active="feedUi.publicationKey === publication.value"
              @click="selectPublication(publication.value)"
            />
          </view>
        </scroll-view>
        <view class="feed-filter-action" @click="cycleUpdateType">
          <text class="feed-filter-text">{{ activeUpdateLabel }}</text>
        </view>
      </view>

      <scroll-view v-if="issueOptions.length > 1" class="feed-pill-scroll feed-pill-scroll-secondary" scroll-x="true" show-scrollbar="false">
        <view class="feed-pill-track">
          <FilterChip
            v-for="issue in issueOptions"
            :key="issue.value"
            :label="issue.label"
            :active="feedUi.issueKey === issue.value"
            @click="selectIssue(issue.value)"
          />
        </view>
      </scroll-view>

      <scroll-view class="feed-pill-scroll feed-pill-scroll-secondary" scroll-x="true" show-scrollbar="false">
        <view class="feed-pill-track">
          <FilterChip
            v-for="tab in categoryOptions"
            :key="tab.value"
            :label="tab.label"
            :active="feedUi.activeTab === tab.value"
            @click="selectTab(tab.value)"
          />
        </view>
      </scroll-view>

    </view>

    <view v-if="showDevDiagnostics" :style="$theme.pageSection">
      <AppCard tone="muted">
        <SectionHeader eyebrow="开发态" title="Feed 诊断" description="用于判断当前是 source 选错、同步为空，还是页面过滤后为空。" compact />
        <view class="feed-debug-lines">
          <text class="feed-debug-line">status: {{ status }}</text>
          <text class="feed-debug-line">runtime mode: {{ debugInfo.runtime_mode || "unknown" }}</text>
          <text class="feed-debug-line">runtime source: {{ debugInfo.runtime_source_mode || "unknown" }}</text>
          <text class="feed-debug-line">runtime scenario: {{ debugInfo.runtime_scenario_id || "none" }}</text>
          <text class="feed-debug-line">runtime channel: {{ debugInfo.runtime_channel || "none" }}</text>
          <text class="feed-debug-line">runtime release: {{ debugInfo.runtime_release_id || "none" }}</text>
          <text class="feed-debug-line">current meta loaded: {{ debugInfo.current_meta_loaded }}</text>
          <text class="feed-debug-line">current meta scenario: {{ debugInfo.current_meta_scenario_id || "none" }}</text>
          <text class="feed-debug-line">current fixture loaded: {{ debugInfo.current_fixture_loaded }}</text>
          <text class="feed-debug-line">current discovery: {{ debugInfo.current_discovery_count }}</text>
          <text class="feed-debug-line">current sync items: {{ debugInfo.current_sync_items_count }}</text>
          <text class="feed-debug-line">base discovery: {{ debugInfo.base_discovery_count }}</text>
          <text class="feed-debug-line">base sync items: {{ debugInfo.base_sync_items_count }}</text>
          <text class="feed-debug-line">module count: {{ debugInfo.module_count }}</text>
          <text class="feed-debug-line">discovery count: {{ debugInfo.discovery_count }}</text>
          <text class="feed-debug-line">sync items: {{ debugInfo.sync_items_count == null ? "n/a" : debugInfo.sync_items_count }}</text>
          <text class="feed-debug-line">sync error: {{ debugInfo.sync_items_error || "none" }}</text>
          <text class="feed-debug-line">hero item: {{ heroItem ? heroItem.article_id : "none" }}</text>
          <text class="feed-debug-line">active tab: {{ feedUi.activeTab }}</text>
          <text class="feed-debug-line">publication filter: {{ feedUi.publicationKey }}</text>
          <text class="feed-debug-line">issue filter: {{ feedUi.issueKey }}</text>
          <text class="feed-debug-line">update filter: {{ feedUi.updateType }}</text>
        </view>
      </AppCard>
    </view>

    <view :style="$theme.pageSection">
      <StatePanel
        v-if="status === 'loading'"
        state="loading"
        title="正在整理首页内容"
        message="同步今日新增、关注更新、消息摘要与阅读上下文。"
      />
      <StatePanel
        v-else-if="status === 'error'"
        state="error"
        title="首页暂时不可用"
        :message="errorMessage"
        action-text="重试"
        @action="refresh"
      />
      <view v-else :style="$theme.sectionStack" class="feed-sections">
        <view v-if="heroItem" @click="openArticle(heroItem, 'home_hero')">
          <AppCard class="hero-card">
            <text class="hero-kicker">{{ heroKicker }}</text>
            <text class="hero-title">{{ heroItem.title }}</text>
            <ArticleDigestBlock :source="heroItem" label="30 秒先读" />
            <MetaRow :items="heroMeta" />
          </AppCard>
        </view>

        <AppCard class="pdf-import-card" tone="muted">
          <view class="pdf-import-content">
            <view class="pdf-import-copy">
              <text class="pdf-import-eyebrow">PDF 导入</text>
              <text class="pdf-import-title">导入本地 PDF</text>
              <text class="pdf-import-description">
                先选择文件并保留在本机，后续再接解析与入库流程。
              </text>
              <text v-if="pdfImport.fileName" class="pdf-import-file">
                {{ pdfImport.fileName }} · {{ pdfImport.fileSizeLabel }}
              </text>
            </view>
            <AppButton label="选择 PDF" tone="secondary" @click="choosePdfFile" />
          </view>
        </AppCard>

        <AppCard v-if="showInboxSummary" tone="muted">
          <SectionHeader eyebrow="消息" title="消息摘要" compact />
          <view class="feed-stack">
            <view v-for="item in inboxItems.slice(0, 4)" :key="item._id" class="inbox-item" @click="openInboxItem(item)">
              <text class="inbox-title">{{ item.title }}</text>
              <text class="inbox-body">{{ item.body }}</text>
              <text class="inbox-meta">{{ item.is_read ? "已读" : "未读" }} · {{ item.reason || item.type }}</text>
            </view>
          </view>
        </AppCard>

        <DiscoverySection
          v-for="section in editorialSections"
          :key="section.section_key"
          :title="section.title"
          :description="section.description"
          :items="section.items"
          :empty-text="section.emptyText"
          @open="openArticleFromSection(section.section_key, $event)"
        />
      </view>
    </view>
  </view>
</template>

<script>
import ArticleDigestBlock from "../../components/discovery/ArticleDigestBlock.vue";
import DiscoverySection from "../../components/discovery/DiscoverySection.vue";
import FilterChip from "../../components/discovery/FilterChip.vue";
import InboxBadge from "../../components/discovery/InboxBadge.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import StatePanel from "../../components/ui/StatePanel.vue";
import { isDevVisibilityEnabled } from "../../services/dev-visibility.service.js";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { consumeRouteAliasState, writeRouteAliasState } from "../../services/navigation-state.service.js";
import { setEntrySource, setCurrentArticle, setReadingMode } from "../../stores/reader.store.js";
import {
  consumeFeedRestoreState,
  getDiscoveryState,
  refreshDiscoveryHome,
  setFeedUiState
} from "../../stores/discovery.store.js";
import { getNotificationsState, markNotificationsRead, refreshInbox } from "../../stores/notifications.store.js";
import { getRuntimeState } from "../../stores/runtime.store.js";
import { getRuntimeSourceSummary } from "../../services/runtime-source.service.js";
import { discoveryKicker, discoveryMetaLine, issueSummaryLabel } from "../../services/taxonomy-meta.service.js";
import { getIssueMeta } from "../../shared/utils/issue-meta.js";

const tabSectionMap = {
  curated: ["today_new", "since_last_visit"],
  followed: ["followed_updates"],
  saved: ["continue_reading", "saved_for_later"],
  updates: []
};

export default {
  components: {
    ArticleDigestBlock,
    AppButton,
    AppCard,
    DiscoverySection,
    FilterChip,
    InboxBadge,
    MetaRow,
    StatePanel
  },
  data() {
    return {
      store: getDiscoveryState(),
      notifications: getNotificationsState(),
      runtime: getRuntimeState(),
      pdfImport: {
        fileName: "",
        fileSizeLabel: "",
        filePath: "",
        file: null
      }
    };
  },
  computed: {
    status() {
      return this.store.status;
    },
    home() {
      return this.store.home || { modules: [] };
    },
    feedUi() {
      return this.store.feedUi;
    },
    modules() {
      return this.home.modules || [];
    },
    unreadCount() {
      if (this.notifications.inboxStatus === "ready") {
        return this.notifications.unreadCount ?? 0;
      }
      return this.home.inbox_unread_count ?? 0;
    },
    errorMessage() {
      return this.store.errorMessage || "";
    },
    heroCandidate() {
      return this.findHeroCandidateForUi(this.feedUi);
    },
    heroItem() {
      return this.heroCandidate;
    },
    heroKicker() {
      if (this.heroItem && discoveryKicker(this.heroItem)) {
        return discoveryKicker(this.heroItem);
      }
      if (this.feedUi.activeTab === "followed") {
        return "关注更新";
      }
      if (this.feedUi.activeTab === "saved") {
        return "继续阅读";
      }
      if (this.feedUi.activeTab === "updates") {
        return "消息摘要";
      }
      return "精选入口";
    },
    heroMeta() {
      if (!this.heroItem) {
        return [];
      }

      return [
        issueSummaryLabel(this.heroItem),
        discoveryMetaLine(this.heroItem),
        this.heroItem.update_type || "",
        this.heroItem.change_summary || "首页内容入口"
      ].filter(Boolean);
    },
    categoryOptions() {
      return [
        { value: "curated", label: "今日焦点" },
        { value: "followed", label: "关注更新" },
        { value: "updates", label: "消息摘要" },
        { value: "saved", label: "稍后再读" }
      ];
    },
    sourceOptions() {
      const weightsBySection = {
        continue_reading: 90,
        saved_for_later: 70,
        followed_updates: 50,
        since_last_visit: 25,
        today_new: 15
      };
      const registryVisible = getRuntimeSourceSummary().visiblePublications || [];
      const publicationStats = new Map();
      const ensureStat = (publicationKey) => {
        if (!publicationKey) {
          return null;
        }
        if (!publicationStats.has(publicationKey)) {
          publicationStats.set(publicationKey, {
            value: publicationKey,
            label: this.formatLabel(publicationKey),
            score: 0,
            count: 0
          });
        }
        return publicationStats.get(publicationKey);
      };

      registryVisible.forEach((publicationKey, index) => {
        const stat = ensureStat(publicationKey);
        if (stat) {
          stat.score += Math.max(0, 8 - index);
        }
      });

      this.modules.forEach((section) => {
        const sectionWeight = weightsBySection[section.section_key] || 10;
        (section.items || []).forEach((item) => {
          const publicationKey = item.publication_key || item.publication_id;
          const stat = ensureStat(publicationKey);
          if (!stat) {
            return;
          }
          stat.count += 1;
          stat.score += sectionWeight;
        });
      });

      return [{ value: "all", label: "全部来源" }].concat(
        Array.from(publicationStats.values())
          .sort((left, right) => {
            if (right.score !== left.score) {
              return right.score - left.score;
            }
            if (right.count !== left.count) {
              return right.count - left.count;
            }
            return left.label.localeCompare(right.label);
          })
          .map((item) => ({
            value: item.value,
            label: item.label
          }))
      );
    },
    issueOptions() {
      const weightsBySection = {
        continue_reading: 90,
        saved_for_later: 70,
        followed_updates: 50,
        since_last_visit: 25,
        today_new: 15
      };
      const issues = new Map();
      this.modules.forEach((section) => {
        const sectionWeight = weightsBySection[section.section_key] || 10;
        (section.items || []).forEach((item) => {
          const publicationKey = item.publication_key || item.publication_id || "";
          if (this.feedUi.publicationKey !== "all" && publicationKey !== this.feedUi.publicationKey) {
            return;
          }
          const issueMeta = getIssueMeta(item);
          if (!issueMeta.issue_id) {
            return;
          }
          if (!issues.has(issueMeta.issue_id)) {
            issues.set(issueMeta.issue_id, {
              value: issueMeta.issue_id,
              label: issueMeta.issue_display_label || issueMeta.issue_label,
              publicationLabel: this.formatLabel(publicationKey),
              sortKey: issueMeta.issue_sort_key || "",
              count: 0,
              score: 0
            });
          }
          const stat = issues.get(issueMeta.issue_id);
          stat.count += 1;
          stat.score += sectionWeight;
        });
      });

      const allLabel = this.feedUi.publicationKey === "all" ? "全部期次" : "全部该刊期次";
      return [{ value: "all", label: allLabel }].concat(
        Array.from(issues.values())
          .sort((left, right) => {
            if ((right.sortKey || "") !== (left.sortKey || "")) {
              return String(right.sortKey || "").localeCompare(String(left.sortKey || ""));
            }
            if (right.score !== left.score) {
              return right.score - left.score;
            }
            if (right.count !== left.count) {
              return right.count - left.count;
            }
            return String(left.label || "").localeCompare(String(right.label || ""));
          })
          .map((item) => ({
            value: item.value,
            label: this.feedUi.publicationKey === "all" ? `${item.publicationLabel} ${item.label}` : item.label
          }))
      );
    },
    updateTypeOptions() {
      return [
        { value: "all", label: "全部更新" },
        { value: "new_publish", label: "新发布" },
        { value: "revision", label: "修订" },
        { value: "highlight_refresh", label: "摘要更新" }
      ];
    },
    activeUpdateLabel() {
      const current = this.updateTypeOptions.find((item) => item.value === this.feedUi.updateType);
      return current ? current.label : "全部更新";
    },
    showDevDiagnostics() {
      return isDevVisibilityEnabled();
    },
    debugInfo() {
      const debug = this.home.__debug || {};
      const runtimeSource = debug.runtime_source || {};
      const fixtures = debug.fixtures || {};
      return {
        runtime_mode: debug.runtime_mode || this.runtime.runtimeMode || null,
        runtime_source_mode: runtimeSource.runtimeSourceMode || null,
        runtime_scenario_id: runtimeSource.runtimeSourceScenarioId || runtimeSource.runtimeScenarioId || null,
        runtime_channel: runtimeSource.runtimeSourceChannel || null,
        runtime_release_id: runtimeSource.runtimeSourceReleaseId || null,
        current_meta_loaded: fixtures.current_meta_loaded || false,
        current_meta_scenario_id: fixtures.current_meta_scenario_id || null,
        current_fixture_loaded: fixtures.current_fixture_loaded || false,
        current_discovery_count: fixtures.current_discovery_count ?? 0,
        current_sync_items_count: fixtures.current_sync_items_count ?? 0,
        base_discovery_count: fixtures.base_discovery_count ?? 0,
        base_sync_items_count: fixtures.base_sync_items_count ?? 0,
        module_count: debug.module_count ?? 0,
        discovery_count: debug.discovery_count ?? 0,
        sync_items_count: debug.sync_items_count,
        sync_items_error: debug.sync_items_error || null
      };
    },
    editorialSections() {
      const activeSectionKeys = this.getActiveSectionKeys(this.feedUi);
      const filteredModules = this.modules
        .filter((section) => activeSectionKeys.includes(section.section_key))
        .map((section) => ({
          ...section,
          items: this.filterItemsByUiState(section.items || [], this.feedUi, this.heroCandidate),
          description: "",
          emptyText:
            section.section_key === "followed_updates"
              ? "还没有关注杂志，去来源页先选你想追踪的刊物"
              : "当前筛选下暂无内容"
        }));

      if (this.feedUi.activeTab === "updates") {
        return this.dedupeSectionsForDisplay([
          {
            section_key: "inbox_continue",
            title: "继续阅读",
            description: "",
            items: this.filterItemsByUiState(this.findSection("continue_reading")?.items || [], this.feedUi),
            emptyText: "暂无继续阅读记录"
          }
        ], this.heroCandidate);
      }

      return this.dedupeSectionsForDisplay(filteredModules, this.heroCandidate);
    },
    inboxItems() {
      return this.notifications.inbox || [];
    },
    showInboxSummary() {
      return this.inboxItems.length > 0 && this.feedUi.activeTab !== "saved";
    }
  },
  onLoad(query) {
    const aliasState = consumeRouteAliasState();
    if (query.focus === "inbox" || aliasState.lastAlias === "inbox") {
      setFeedUiState({
        activeTab: "updates",
        focus: "inbox"
      });
    }
  },
  async onShow() {
    await this.refresh();
    if (this.feedUi.activeTab === "updates") {
      await this.consumeInboxSummary();
    }
    this.restoreScrollState();
  },
  onPageScroll(event) {
    setFeedUiState({
      scrollTop: Number(event.scrollTop || 0)
    });
  },
  methods: {
    choosePdfFile() {
      if (!uni.chooseFile) {
        uni.showToast({
          title: "当前环境暂不支持选择文件",
          icon: "none"
        });
        return;
      }

      uni.chooseFile({
        count: 1,
        type: "file",
        extension: ["pdf", ".pdf"],
        success: (response) => {
          const selectedFile = this.normalizeSelectedPdf(response);
          if (!selectedFile) {
            uni.showToast({
              title: "请选择 PDF 文件",
              icon: "none"
            });
            return;
          }

          this.pdfImport = selectedFile;
          uni.showToast({
            title: "PDF 已选择",
            icon: "success"
          });
        },
        fail: () => {
          uni.showToast({
            title: "未选择 PDF",
            icon: "none"
          });
        }
      });
    },
    normalizeSelectedPdf(response) {
      const file = (response.tempFiles && response.tempFiles[0]) || null;
      const filePath = file?.path || file?.tempFilePath || response.tempFilePaths?.[0] || "";
      const fileName = file?.name || String(filePath).split(/[\\/]/).pop() || "";
      const isPdf = /\.pdf$/i.test(fileName) || /\.pdf$/i.test(filePath) || file?.type === "application/pdf";

      if (!isPdf) {
        return null;
      }

      return {
        fileName: fileName || "selected.pdf",
        fileSizeLabel: this.formatFileSize(file?.size || 0),
        filePath,
        file
      };
    },
    formatFileSize(size) {
      const bytes = Number(size || 0);
      if (!bytes) {
        return "大小未知";
      }
      if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
      }
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    },
    formatLabel(value) {
      const aliases = {
        readers_digest: "Reader's",
        barrons: "Barron's",
        the_atlantic: "Atlantic",
        the_economist: "Economist"
      };
      if (aliases[value]) {
        return aliases[value];
      }
      return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    },
    getActiveSectionKeys(feedUi = this.feedUi) {
      return tabSectionMap[feedUi.activeTab] || tabSectionMap.curated;
    },
    matchesStateForUi(item, feedUi = this.feedUi) {
      const publicationKey = item.publication_key || item.publication_id || "all";
      const issueId = getIssueMeta(item).issue_id || "all";
      const matchesPublication =
        feedUi.publicationKey === "all" || publicationKey === feedUi.publicationKey;
      const matchesIssue =
        feedUi.issueKey === "all" || issueId === feedUi.issueKey;
      const matchesUpdate =
        feedUi.updateType === "all" || (item.update_type || "none") === feedUi.updateType;
      return matchesPublication && matchesIssue && matchesUpdate;
    },
    findHeroCandidateForUi(feedUi = this.feedUi) {
      const activeSectionKeys = this.getActiveSectionKeys(feedUi);
      const firstSection = this.modules.find((section) => {
        if (!activeSectionKeys.includes(section.section_key)) {
          return false;
        }
        return (section.items || []).some((item) => this.matchesStateForUi(item, feedUi));
      });
      return firstSection ? (firstSection.items || []).find((item) => this.matchesStateForUi(item, feedUi)) || null : null;
    },
    countVisibleItemsForUi(feedUi = this.feedUi) {
      const heroCandidate = this.findHeroCandidateForUi(feedUi);
      let visibleCount = 0;

      if (heroCandidate) {
        visibleCount += 1;
      }

      if (feedUi.activeTab !== "saved" && this.inboxItems.length > 0) {
        visibleCount += 1;
      }

      if (feedUi.activeTab === "updates") {
        visibleCount += this.filterItemsByUiState(
          this.findSection("continue_reading")?.items || [],
          feedUi,
          heroCandidate
        ).length;
        return visibleCount;
      }

      const activeSectionKeys = this.getActiveSectionKeys(feedUi);
      visibleCount += this.modules
        .filter((section) => activeSectionKeys.includes(section.section_key))
        .reduce(
          (sum, section) => sum + this.filterItemsByUiState(section.items || [], feedUi, heroCandidate).length,
          0
        );
      return visibleCount;
    },
    ensureFeedViewHasContent() {
      const totalItems = this.modules.reduce((sum, section) => sum + ((section.items || []).length), 0);
      if (!totalItems) {
        return;
      }

      if (this.countVisibleItemsForUi(this.feedUi) > 0) {
        return;
      }

      let nextUi = {
        ...this.feedUi
      };

      if (nextUi.issueKey !== "all") {
        nextUi.issueKey = "all";
      }
      if (this.countVisibleItemsForUi(nextUi) > 0) {
        setFeedUiState({
          ...nextUi,
          scrollTop: 0
        });
        return;
      }

      if (nextUi.updateType !== "all") {
        nextUi.updateType = "all";
      }
      if (this.countVisibleItemsForUi(nextUi) > 0) {
        setFeedUiState({
          ...nextUi,
          scrollTop: 0
        });
        return;
      }

      nextUi = {
        ...nextUi,
        publicationKey: "all",
        issueKey: "all"
      };
      if (this.countVisibleItemsForUi(nextUi) > 0) {
        setFeedUiState({
          ...nextUi,
          scrollTop: 0
        });
        return;
      }

      nextUi = {
        ...nextUi,
        activeTab: "curated",
        publicationKey: "all",
        issueKey: "all",
        updateType: "all",
        scrollTop: 0
      };
      setFeedUiState(nextUi);
    },
    async refresh() {
      let discoveryError = null;
      try {
        await Promise.all([refreshDiscoveryHome(), refreshInbox().catch(() => null)]);
        await this.$nextTick();
        this.ensureFeedViewHasContent();
      } catch (error) {
        discoveryError = error;
      }
      return discoveryError;
    },
    async consumeInboxSummary() {
      const unreadIds = this.inboxItems.filter((item) => !item.is_read).map((item) => item._id).filter(Boolean);
      if (!unreadIds.length) {
        return;
      }

      const response = await markNotificationsRead(unreadIds);
      if (this.home && typeof response?.unread_count === "number") {
        this.home.inbox_unread_count = response.unread_count;
      }
      await ingestRuntimeEvent("inbox_summary_seen", {
        unread_count: response?.unread_count ?? 0,
        source_surface: "feed"
      });
    },
    findSection(sectionKey) {
      return this.modules.find((section) => section.section_key === sectionKey);
    },
    filterItemsByUiState(items = [], feedUi = this.feedUi, heroItem = null) {
      return items.filter((item) => {
        if (heroItem && item.article_id && item.article_id === heroItem.article_id) {
          return false;
        }

        return this.matchesStateForUi(item, feedUi);
      });
    },
    filterItemsByCurrentState(items = [], heroItem = null) {
      return this.filterItemsByUiState(items, this.feedUi, heroItem);
    },
    dedupeSectionsForDisplay(sections = [], heroItem = null) {
      const seen = new Set(heroItem?.article_id ? [heroItem.article_id] : []);
      return sections.map((section) => ({
        ...section,
        items: (section.items || []).filter((item) => {
          const articleId = item?.article_id || null;
          if (!articleId) {
            return true;
          }
          if (seen.has(articleId)) {
            return false;
          }
          seen.add(articleId);
          return true;
        })
      }));
    },
    matchesCurrentState(item) {
      return this.matchesStateForUi(item, this.feedUi);
    },
    selectTab(activeTab) {
      setFeedUiState({
        activeTab,
        scrollTop: 0
      });
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    },
    selectPublication(publicationKey) {
      setFeedUiState({
        publicationKey,
        issueKey: "all",
        scrollTop: 0
      });
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    },
    selectIssue(issueKey) {
      setFeedUiState({
        issueKey,
        scrollTop: 0
      });
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    },
    selectUpdateType(updateType) {
      setFeedUiState({
        updateType,
        scrollTop: 0
      });
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    },
    cycleUpdateType() {
      const options = this.updateTypeOptions.map((item) => item.value);
      const currentIndex = options.indexOf(this.feedUi.updateType);
      const nextValue = options[(currentIndex + 1) % options.length];
      this.selectUpdateType(nextValue);
    },
    restoreScrollState() {
      const restoreState = consumeFeedRestoreState();
      if (!restoreState.restorePending) {
        return;
      }

      setTimeout(() => {
        uni.pageScrollTo({
          scrollTop: restoreState.scrollTop || 0,
          duration: 0
        });
      }, 0);
    },
    async openArticleFromSection(sectionKey, item) {
      await this.openArticle(item, sectionKey);
    },
    async openArticle(item, sourceSurface = "home_curated") {
      if (!item || !item.article_id) {
        return;
      }

      setFeedUiState({
        restorePending: true
      });
      setCurrentArticle(item.article_id);
      setEntrySource("feed");
      setReadingMode("deep_3m");
      await ingestRuntimeEvent(item.progress_hint ? "continue_read_click" : "article_open", {
        article_id: item.article_id,
        source_surface: sourceSurface
      });
      uni.navigateTo({
        url: `/pages/detail/index?articleId=${item.article_id}&readingMode=deep_3m&source=feed`
      });
    },
    async openInboxItem(item) {
      await markNotificationsRead([item._id]);
      if (item.target && item.target.startsWith("art_")) {
        await this.openArticle(
          {
            article_id: item.target
          },
          "home_inbox"
        );
      }
    },
    openSearch() {
      if (this.feedUi.activeTab === "followed") {
        writeRouteAliasState("follows", "/pages/search/index");
      }
      uni.switchTab({
        url: "/pages/search/index"
      });
    },
    openPaywall() {
      uni.navigateTo({
        url: "/pages/paywall/index?source=feed"
      });
    },
    async openUpdates() {
      await this.consumeInboxSummary();
      this.selectTab("updates");
    }
  }
};
</script>

<style>
.feed-page {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.feed-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.feed-brand {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.feed-brand-mark {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  background: #e7ece4;
  color: #4c5a67;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 52rpx;
  text-align: center;
}

.feed-brand-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2933;
}

.feed-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.feed-topbar-action {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
}

.feed-topbar-action-text,
.feed-icon-text,
.feed-filter-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #4c5a67;
}

.feed-icon-button,
.feed-filter-action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
}

.feed-sticky-shell {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-left: -24rpx;
  margin-right: -24rpx;
  padding: 8rpx 24rpx 18rpx;
  background: rgba(247, 248, 244, 0.94);
  backdrop-filter: blur(18rpx);
}

.feed-source-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.feed-pill-scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.feed-pill-scroll-secondary {
  margin-top: 12rpx;
}

.feed-pill-track {
  display: inline-flex;
  gap: 12rpx;
  padding-right: 24rpx;
}

.feed-filter-action {
  flex-shrink: 0;
}

.feed-sections {
  gap: 22rpx;
}

.feed-debug-lines {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 12rpx;
}

.feed-debug-line {
  color: #51606f;
  font-size: 22rpx;
  line-height: 1.5;
}

.hero-card {
  background: linear-gradient(145deg, #fcfcfa 0%, #f2f4ef 100%);
  border: 1rpx solid #e3e8de;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.04);
}

.hero-kicker {
  display: block;
  font-size: 20rpx;
  font-weight: 700;
  color: #52606d;
  letter-spacing: 0.05em;
}

.hero-title {
  display: block;
  margin-top: 14rpx;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.24;
  color: #1f2933;
}

.pdf-import-card {
  border: 1rpx solid #dde4dc;
  background: #fbfcfa;
}

.pdf-import-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.pdf-import-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 10rpx;
}

.pdf-import-eyebrow,
.pdf-import-file {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #52606d;
}

.pdf-import-title {
  display: block;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.3;
  color: #1f2933;
}

.pdf-import-description {
  display: block;
  font-size: 24rpx;
  line-height: 1.55;
  color: #414754;
}

.pdf-import-file {
  overflow: hidden;
  max-width: 100%;
  color: #2f6f5e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 16rpx;
}

.inbox-item {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid #e0e3e6;
}

.inbox-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #191c1e;
}

.inbox-body,
.inbox-meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #414754;
}
</style>
