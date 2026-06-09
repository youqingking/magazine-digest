import { buildDiscoveryCardItem, hydrateDiscoveryCatalog } from "./runtime-preview-lib.js";
import {
  applyPersistedFollowState,
  buildPersistedFollowSet,
  matchesFollowSelectionForContent,
  togglePersistedFollowSubject
} from "../services/follow-state.service.js";
import { getIssueMeta } from "../shared/utils/issue-meta.js";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDetailKey(request) {
  return [
    request.article_id,
    request.language,
    request.audience_segment,
    request.reading_mode
  ].join("|");
}

function buildState(fixtures) {
  return {
    discoveryCatalog: hydrateDiscoveryCatalog(fixtures.discoveryCatalog?.items || [], fixtures),
    publishBatches: cloneValue(fixtures.publishBatches?.items || []),
    inbox: cloneValue(fixtures.notificationInbox?.response?.items || []),
    followCatalog: cloneValue(fixtures.followCatalog || { publications: [], tags: [] }),
    contentState: cloneValue(fixtures.userContentState?.items || [])
  };
}

function listPublishBatchItems(runtimeState, publishBatchId, publishBatch) {
  if (!publishBatch && !publishBatchId) {
    return [];
  }
  return runtimeState.discoveryCatalog.filter((item) => {
    if (item.publish_batch_id && publishBatchId) {
      return item.publish_batch_id === publishBatchId;
    }
    if (publishBatch?.publication_key) {
      return item.publication_key === publishBatch.publication_key;
    }
    return false;
  });
}

function buildHomeDiscovery(runtimeState, fixtures, userId) {
  const followSet = buildPersistedFollowSet(userId);
  const saved = runtimeState.contentState
    .filter((item) => item.user_id === userId && item.bookmark_status === "saved")
    .map((item) => {
      const article = runtimeState.discoveryCatalog.find((entry) => entry.article_id === item.article_id);
      return buildDiscoveryCardItem(article, fixtures, {
        article_id: item.article_id,
        saved_at: item.saved_at || item.updated_at
      });
    });
  const followedUpdates = runtimeState.discoveryCatalog.filter((item) => matchesFollowSelectionForContent(item, followSet));
  const continueReading = runtimeState.contentState
    .filter((item) => item.reading_state === "in_progress" || Number(item.resume_progress_basis_points || 0) > 0)
    .slice(0, 3)
    .map((item) => {
      const article = runtimeState.discoveryCatalog.find((entry) => entry.article_id === item.article_id);
      return buildDiscoveryCardItem(article, fixtures, {
        article_id: item.article_id,
        progress_hint: Number(item.resume_progress_basis_points || 0),
        last_opened_at: item.last_opened_at || null,
        last_read_mode: item.last_read_mode || article?.primary_reading_mode || "quick_30s"
      });
    });

  return {
    modules: [
      { section_key: "today_new", title: "今日新增", items: runtimeState.discoveryCatalog.filter((item) => item.update_type === "new_publish") },
      { section_key: "followed_updates", title: "关注更新", items: followedUpdates },
      { section_key: "continue_reading", title: "继续阅读", items: continueReading },
      { section_key: "saved_for_later", title: "稍后再读", items: saved }
    ],
    continue_reading: continueReading,
    inbox_unread_count: buildNotificationInbox(runtimeState, { user_id: userId }).unread_count,
    next_digest_hint: "digest_available",
    server_time: fixtures.metadata?.runtime_now || new Date().toISOString()
  };
}

function buildSearchResponse(runtimeState, query = "", filters = {}, limit = 20) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const items = runtimeState.discoveryCatalog
    .filter((item) => {
      const issueMeta = getIssueMeta(item);
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [item.title, item.summary, item.publication_key, ...(item.tags || [])]
        .concat([
          item.publication_name,
          issueMeta.issue_label,
          issueMeta.issue_display_label,
          item.quick_preview_body,
          item.body_preview,
          item.original_title,
          item.section_label,
          item.raw_section_label,
          item.canonical_section_label,
          item.discovery_bucket,
          item.author
        ])
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .filter((item) => !filters.publication || [].concat(filters.publication).includes(item.publication_key))
    .filter((item) => !filters.issue_id || [].concat(filters.issue_id).includes(getIssueMeta(item).issue_id))
    .filter((item) => !filters.canonical_section_key || [].concat(filters.canonical_section_key).includes(item.canonical_section_key))
    .filter((item) => !filters.discovery_bucket || [].concat(filters.discovery_bucket).includes(item.discovery_bucket))
    .slice(0, limit);

  return {
    items,
    facets: {
      publication: [...new Set(runtimeState.discoveryCatalog.map((item) => item.publication_key))],
      issue_id: [...new Set(runtimeState.discoveryCatalog.map((item) => getIssueMeta(item).issue_id).filter(Boolean))],
      canonical_section_key: [...new Set(runtimeState.discoveryCatalog.map((item) => item.canonical_section_key).filter(Boolean))],
      discovery_bucket: [...new Set(runtimeState.discoveryCatalog.map((item) => item.discovery_bucket).filter(Boolean))]
    },
    cursor: null,
    has_more: false
  };
}

function buildNotificationInbox(runtimeState, request = {}) {
  const followedSet = buildPersistedFollowSet(request.user_id);
  const items = (runtimeState.inbox || [])
    .filter((item) => !request.user_id || item.user_id === request.user_id)
    .filter((item) => !request.status_filter || request.status_filter === "all" || item.status === request.status_filter)
    .filter((item) => {
      const article = runtimeState.discoveryCatalog.find(
        (entry) => entry.article_id === item.action_target || entry.article_id === item.target
      );
      const context = {
        publication_key: article?.publication_key || item.publication_key || null,
        publication_id: article?.publication_key || item.publication_key || null,
        tags: article?.tags || item.tags || []
      };
      const sourceType = item.source_type || item.type || "";
      if (!["publish_batch", "follow_subject"].includes(sourceType)) {
        return true;
      }
      return matchesFollowSelectionForContent(context, followedSet);
    })
    .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));

  const unreadCount = items.filter((item) => item.status !== "read" && item.status !== "archived").length;

  return {
    items: cloneValue(items.map((item) => ({
      ...item,
      type: item.source_type,
      body: item.body_preview || "",
      reason: item.change_summary || item.source_type,
      target: item.action_target || null,
      is_read: item.status === "read"
    }))),
    unread_count: unreadCount,
    cursor: null,
    has_more: false
  };
}

export function createFixtureRuntimeApi(fixtures, options = {}) {
  const runtimeState = buildState(fixtures);
  const runtimeMetadata = {
    runtime_mode: options.runtimeMode || "remote",
    runtime_source: options.runtimeSource || "remote_channel_head",
    remote_ready: options.remoteReady !== false,
    fallback_used: Boolean(options.fallbackUsed),
    remote_base_url: options.remoteBaseUrl || null,
    remote_channel: options.channel || null,
    remote_release_id: options.releaseId || null
  };

  return {
    async getBootstrapConfig() {
      return cloneValue(fixtures.bootstrapConfig.response);
    },

    async getContentSyncDelta(request) {
      const snapshot = cloneValue(fixtures.contentSyncDelta.response);
      const limit = Number(request.limit || snapshot.items.length);
      return {
        ...snapshot,
        items: snapshot.items.slice(0, limit),
        has_more: snapshot.items.length > limit
      };
    },

    async getContentDetail(request) {
      const response = fixtures.contentDetail.responses[buildDetailKey(request)];
      if (!response) {
        throw new Error("REMOTE_RUNTIME_CONTENT_DETAIL_MISSING");
      }
      return cloneValue(response);
    },

    async getHomeDiscovery(request = {}) {
      return buildHomeDiscovery(runtimeState, fixtures, request.user_id);
    },

    async searchContent(request) {
      return buildSearchResponse(runtimeState, request.query, request.filters || {}, Number(request.limit || 20));
    },

    async getFollowCatalog(request = {}) {
      const catalogType = request.catalog_type || "all";
      const subjects =
        catalogType === "publication"
          ? runtimeState.followCatalog.publications || []
          : catalogType === "topic_tag"
            ? runtimeState.followCatalog.tags || []
            : [
                ...(runtimeState.followCatalog.publications || []),
                ...(runtimeState.followCatalog.tags || [])
              ];
      return {
        subjects: cloneValue(
          applyPersistedFollowState(
            subjects,
            request.user_id || null
          )
        ),
        cursor: null,
        has_more: false
      };
    },

    async toggleFollow(request) {
      return cloneValue(
        togglePersistedFollowSubject(
          request.user_id,
          request.subject_type,
          request.subject_key,
          request.desired_state,
          request.notify_level || "immediate"
        )
      );
    },

    async getContentResume(request) {
      return {
        items: buildHomeDiscovery(runtimeState, fixtures, request.user_id).continue_reading,
        server_time: fixtures.metadata?.runtime_now || new Date().toISOString()
      };
    },

    async getNotificationInbox(request) {
      return buildNotificationInbox(runtimeState, request);
    },

    async getPublishBatchSummary(request) {
      if (!request?.publish_batch_id) {
        const publishBatches = runtimeState.publishBatches.map((item) => ({
          ...item,
          article_count: listPublishBatchItems(runtimeState, item._id, item).length
        }));
        return {
          publish_batches: cloneValue(publishBatches),
          publish_batch: publishBatches[0] || null,
          items: [],
          follow_match_count: 0,
          inbox_item: null
        };
      }
      const publishBatch = runtimeState.publishBatches.find((item) => item._id === request.publish_batch_id) || null;
      const items = listPublishBatchItems(runtimeState, request.publish_batch_id, publishBatch);
      const inboxItem = (runtimeState.inbox || []).find(
        (item) => (!request.user_id || item.user_id === request.user_id) && item.publish_batch_id === request.publish_batch_id
      ) || null;
      const followedSet = buildPersistedFollowSet(request.user_id);
      return {
        publish_batch: cloneValue(publishBatch),
        items: cloneValue(items),
        follow_match_count: items.filter((item) => matchesFollowSelectionForContent(item, followedSet)).length,
        inbox_item: cloneValue(inboxItem)
      };
    },

    listAvailableSurfaces() {
      return cloneValue(fixtures.surfaceStatus || []);
    },

    getFixtureMetadata() {
      return {
        ...cloneValue(fixtures.metadata || {}),
        runtime_source: runtimeMetadata
      };
    }
  };
}
