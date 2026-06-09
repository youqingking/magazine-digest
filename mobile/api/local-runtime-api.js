import { getRuntimeSourceSummary, resolveRuntimeFixtures } from "../services/runtime-source.service.js";
import { getBaseRuntimeFixtures, getCurrentRuntimeFixtures } from "../services/runtime-fixtures.service.js";
import {
  applyPersistedFollowState,
  buildPersistedFollowSet,
  matchesFollowSelectionForContent,
  togglePersistedFollowSubject
} from "../services/follow-state.service.js";
import { buildDiscoveryCardItem, hydrateDiscoveryCatalog } from "./runtime-preview-lib.js";
import { getReaderState } from "../stores/reader.store.js";
import { getIssueMeta } from "../shared/utils/issue-meta.js";

const eventDedupMap = new Map();

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function activeFixtures(fixturesOverride = null) {
  return fixturesOverride || resolveRuntimeFixtures() || getCurrentRuntimeFixtures() || getBaseRuntimeFixtures();
}

function buildDetailKey(request) {
  return [
    request.article_id,
    request.language,
    request.audience_segment,
    request.reading_mode
  ].join("|");
}

function dedupeByArticleId(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const articleId = item?.article_id || item?._id || null;
    if (!articleId) {
      return true;
    }
    if (seen.has(articleId)) {
      return false;
    }
    seen.add(articleId);
    return true;
  });
}

function buildDiscoveryCatalogFromSync(fixtures = {}) {
  return ((fixtures?.contentSyncDelta?.response?.items || []))
    .filter((item) => item?.entity_type === "article")
    .map((item) => ({
      ...item,
      ...getIssueMeta(item),
      primary_reading_mode: item.primary_reading_mode || "quick_30s",
      primary_audience: item.primary_audience || "general"
    }));
}

function getDiscoveryCatalogItems(fixtures = {}) {
  const directItems = hydrateDiscoveryCatalog(fixtures?.discoveryCatalog?.items || [], fixtures);
  if (directItems.length > 0) {
    return dedupeByArticleId(directItems);
  }
  return dedupeByArticleId(hydrateDiscoveryCatalog(buildDiscoveryCatalogFromSync(fixtures), fixtures));
}

function buildState(fixturesOverride = null) {
  const fixtures = activeFixtures(fixturesOverride);
  return {
    inbox: cloneValue(fixtures.notificationInbox?.response?.items || []),
    prefs: fixtures.notificationPrefs?.response ? cloneValue(fixtures.notificationPrefs.response) : null,
    contentState: cloneValue(fixtures.userContentState?.items || []),
    discoveryCatalog: getDiscoveryCatalogItems(fixtures),
    publishBatches: cloneValue(fixtures.publishBatches?.items || []),
    followCatalog: cloneValue(fixtures.followCatalog || { publications: [], tags: [] })
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

const mutableRuntimeState = {
  signature: null,
  data: null
};

function buildRuntimeStateSignature(fixtures) {
  const metadata = fixtures?.metadata || {};
  return JSON.stringify({
    scenario_id: metadata.scenario_id || null,
    exported_at: metadata.exported_at || null,
    runtime_fixture_role: metadata.runtime_fixture_role || null,
    audience_mode: getReaderState().audienceMode || "general",
    discovery_count: fixtures?.discoveryCatalog?.items?.length || 0,
    sync_count: fixtures?.contentSyncDelta?.response?.items?.length || 0
  });
}

function getRuntimeStateData(fixturesOverride = null) {
  const fixtures = activeFixtures(fixturesOverride);
  const signature = buildRuntimeStateSignature(fixtures);
  if (mutableRuntimeState.signature !== signature || !mutableRuntimeState.data) {
    mutableRuntimeState.signature = signature;
    mutableRuntimeState.data = buildState(fixtures);
  }
  return mutableRuntimeState.data;
}

function resolveInboxContentContext(item, runtimeState) {
  const article = runtimeState.discoveryCatalog.find(
    (entry) => entry.article_id === item.action_target || entry.article_id === item.target
  );
  const batch = runtimeState.publishBatches.find((entry) => entry._id === item.publish_batch_id) || null;
  return {
    publication_key: article?.publication_key || batch?.publication_key || item.publication_key || null,
    publication_id: article?.publication_key || batch?.publication_key || item.publication_key || null,
    tags: article?.tags || item.tags || []
  };
}

function buildVisibleInboxItems(runtimeState, userId, statusFilter = "all") {
  const followedSet = buildPersistedFollowSet(userId);
  return runtimeState.inbox
    .filter((item) => !userId || item.user_id === userId)
    .filter((item) => !statusFilter || statusFilter === "all" || item.status === statusFilter)
    .filter((item) => {
      const sourceType = item.source_type || item.type || "";
      if (!["publish_batch", "follow_subject"].includes(sourceType)) {
        return true;
      }
      return matchesFollowSelectionForContent(resolveInboxContentContext(item, runtimeState), followedSet);
    })
    .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
}

function listUnreadInbox(userId = null, fixturesOverride = null) {
  const runtimeState = getRuntimeStateData(fixturesOverride);
  return buildVisibleInboxItems(runtimeState, userId, "all").filter(
    (item) => item.status !== "read" && item.status !== "archived"
  );
}

function listContentResume(limit = 5, fixturesOverride = null) {
  const runtimeState = getRuntimeStateData(fixturesOverride);
  const fixtures = activeFixtures(fixturesOverride);
  return runtimeState.contentState
    .filter((item) => item.reading_state === "in_progress" || Number(item.resume_progress_basis_points || 0) > 0)
    .map((item) => {
      const article = runtimeState.discoveryCatalog.find((entry) => entry.article_id === item.article_id);
      return buildDiscoveryCardItem(article, fixtures, {
        article_id: item.article_id,
        progress_hint: Number(item.resume_progress_basis_points || 0),
        last_opened_at: item.last_opened_at || null,
        last_read_mode: item.last_read_mode || article?.primary_reading_mode || "quick_30s",
        change_summary: article?.change_summary || null,
        update_type: article?.update_type || null
      });
    })
    .slice(0, limit);
}

function buildHomeDiscovery(userId, fixturesOverride = null) {
  const runtimeState = getRuntimeStateData(fixturesOverride);
  const fixtures = activeFixtures(fixturesOverride);
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
  const continueReading = listContentResume(3, fixturesOverride);

  return {
    modules: [
      { section_key: "today_new", title: "今日新增", items: runtimeState.discoveryCatalog.filter((item) => item.update_type === "new_publish") },
      { section_key: "since_last_visit", title: "自上次访问以来", items: runtimeState.discoveryCatalog.filter((item) => item.publish_batch_id) },
      { section_key: "followed_updates", title: "关注更新", items: followedUpdates },
      { section_key: "continue_reading", title: "继续阅读", items: continueReading },
      { section_key: "saved_for_later", title: "稍后再读", items: saved }
    ],
    continue_reading: continueReading,
    inbox_unread_count: listUnreadInbox(userId, fixturesOverride).length,
    next_digest_hint: runtimeState.prefs?.digest_enabled ? "digest_available" : "digest_disabled",
    server_time: activeFixtures(fixturesOverride).metadata?.runtime_now || new Date().toISOString()
  };
}

function buildSearchResponse(query = "", filters = {}, limit = 20, fixturesOverride = null) {
  const runtimeState = getRuntimeStateData(fixturesOverride);
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
    .filter((item) => !filters.tag || [].concat(filters.tag).some((tag) => (item.tags || []).includes(tag)))
    .filter((item) => !filters.canonical_section_key || [].concat(filters.canonical_section_key).includes(item.canonical_section_key))
    .filter((item) => !filters.discovery_bucket || [].concat(filters.discovery_bucket).includes(item.discovery_bucket))
    .filter((item) => !filters.reading_mode || [].concat(filters.reading_mode).includes(item.primary_reading_mode))
    .filter((item) => !filters.newness || [].concat(filters.newness).includes(item.update_type))
    .slice(0, limit);

  return {
    items: dedupeByArticleId(items),
    facets: {
      publication: [...new Set(runtimeState.discoveryCatalog.map((item) => item.publication_key))],
      issue_id: [...new Set(runtimeState.discoveryCatalog.map((item) => getIssueMeta(item).issue_id).filter(Boolean))],
      tag: [...new Set(runtimeState.discoveryCatalog.flatMap((item) => item.tags || []))],
      canonical_section_key: [...new Set(runtimeState.discoveryCatalog.map((item) => item.canonical_section_key).filter(Boolean))],
      discovery_bucket: [...new Set(runtimeState.discoveryCatalog.map((item) => item.discovery_bucket).filter(Boolean))],
      reading_mode: [...new Set(runtimeState.discoveryCatalog.map((item) => item.primary_reading_mode))],
      audience: [...new Set(runtimeState.discoveryCatalog.map((item) => item.primary_audience))],
      newness: [...new Set(runtimeState.discoveryCatalog.map((item) => item.update_type).filter(Boolean))]
    },
    cursor: null,
    has_more: false
  };
}

function normalizePrefs(record, request) {
  const prefs = record || {
    _id: `unp_${request.user_id || "local"}`,
    product_key: request.product_key,
    user_id: request.user_id,
    status: "active",
    push_enabled: true,
    inbox_enabled: true,
    digest_enabled: true,
    follow_alert_level: "immediate",
    breaking_push_override: true,
    quiet_hours_enabled: false,
    quiet_hours_start_minute: 1320,
    quiet_hours_end_minute: 420,
    timezone: "Asia/Shanghai",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    ...cloneValue(prefs),
    enable_instant: Boolean(prefs.push_enabled),
    enable_digest: Boolean(prefs.digest_enabled),
    quiet_hours: {
      enabled: Boolean(prefs.quiet_hours_enabled),
      start_minute: prefs.quiet_hours_start_minute ?? 0,
      end_minute: prefs.quiet_hours_end_minute ?? 0
    },
    max_daily_push: prefs.max_daily_push ?? 3,
    followed_only: prefs.follow_alert_level === "immediate" || prefs.follow_alert_level === "digest_only"
  };
}

export function createLocalRuntimeApi(options = {}) {
  const fixturesOverride = options.fixtures || null;
  return {
    async getBootstrapConfig() {
      return cloneValue(activeFixtures(fixturesOverride).bootstrapConfig.response);
    },

    async getContentSyncDelta(request) {
      const snapshot = cloneValue(activeFixtures(fixturesOverride).contentSyncDelta.response);
      const limit = Number(request.limit || snapshot.items.length);

      return {
        ...snapshot,
        items: snapshot.items.slice(0, limit),
        has_more: snapshot.items.length > limit
      };
    },

    async getContentDetail(request) {
      const response = activeFixtures(fixturesOverride).contentDetail.responses[buildDetailKey(request)];

      if (!response) {
        throw new Error("LOCAL_RUNTIME_CONTENT_DETAIL_FIXTURE_MISSING");
      }

      return cloneValue(response);
    },

    async getEntitlementSnapshot(request) {
      const response = cloneValue(activeFixtures(fixturesOverride).entitlementSnapshot.response);
      response.subject_id = request.user_id || request.installation_id || response.subject_id;
      return response;
    },

    async getPricingPreviewCatalog() {
      return cloneValue(activeFixtures(fixturesOverride).pricingPreview.responses);
    },

    async getExperimentAssignment(request) {
      const response = cloneValue(activeFixtures(fixturesOverride).experimentAssign.response);
      response.installation_id = request.installation_id || response.installation_id;
      return response;
    },

    async getHomeDiscovery(request) {
      return buildHomeDiscovery(request.user_id, fixturesOverride);
    },

    async searchContent(request) {
      return buildSearchResponse(request.query, request.filters || {}, Number(request.limit || 20), fixturesOverride);
    },

    async getFollowCatalog(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      const catalogType = request.catalog_type || "all";
      const withState = (items) => applyPersistedFollowState(items, request.user_id);
      return {
        subjects:
          catalogType === "publication"
            ? cloneValue(withState(runtimeState.followCatalog.publications || []))
            : catalogType === "topic_tag"
              ? cloneValue(withState(runtimeState.followCatalog.tags || []))
              : cloneValue([
                  ...withState(runtimeState.followCatalog.publications || []),
                  ...withState(runtimeState.followCatalog.tags || [])
                ]),
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

    async getNotificationInbox(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      const items = buildVisibleInboxItems(runtimeState, request.user_id, request.status_filter || "all");

      return {
        items: items.map((item) => ({
          ...cloneValue(item),
          type: item.source_type,
          body: item.body_preview || "",
          reason: item.change_summary || item.source_type,
          target: item.action_target || null,
          is_read: item.status === "read"
        })),
        unread_count: listUnreadInbox(request.user_id, fixturesOverride).length,
        cursor: null,
        has_more: false
      };
    },

    async getNotificationPrefs(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      return normalizePrefs(runtimeState.prefs, request);
    },

    async updateNotificationPrefs(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      runtimeState.prefs = {
        ...(runtimeState.prefs || {}),
        ...request.update,
        product_key: request.product_key,
        user_id: request.user_id,
        updated_at: new Date().toISOString()
      };
      return normalizePrefs(runtimeState.prefs, request);
    },

    async markInboxRead(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      let updatedCount = 0;
      runtimeState.inbox.forEach((item) => {
        const byId = (request.inbox_ids || []).includes(item._id);
        const byTime = request.mark_all_before && item.created_at <= request.mark_all_before;
        if (item.user_id === request.user_id && item.status !== "read" && (byId || byTime)) {
          item.status = "read";
          item.read_at = item.read_at || new Date().toISOString();
          item.updated_at = item.read_at;
          updatedCount += 1;
        }
      });

      return {
        updated_count: updatedCount,
        unread_count: listUnreadInbox(request.user_id, fixturesOverride).length
      };
    },

    async getContentResume(request) {
      return {
        items: listContentResume(Number(request.limit || 5), fixturesOverride),
        server_time: activeFixtures(fixturesOverride).metadata?.runtime_now || new Date().toISOString()
      };
    },

    async saveForLater(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
      let record = runtimeState.contentState.find(
        (item) => item.user_id === request.user_id && item.article_id === request.article_id
      );

      if (!record) {
        record = {
          _id: `ucs_${request.user_id}_${request.article_id}`,
          product_key: request.product_key,
          user_id: request.user_id,
          article_id: request.article_id,
          reading_state: "unseen",
          bookmark_status: "none",
          newness_state: "new",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        runtimeState.contentState.push(record);
      }

      record.bookmark_status = request.desired_state === "saved" ? "saved" : "removed";
      record.saved_at = request.desired_state === "saved" ? new Date().toISOString() : null;
      record.updated_at = new Date().toISOString();

      return cloneValue({
        article_id: request.article_id,
        bookmark_status: record.bookmark_status,
        saved_at: record.saved_at
      });
    },

    async getPublishBatchSummary(request) {
      const runtimeState = getRuntimeStateData(fixturesOverride);
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
      const inboxItem = runtimeState.inbox.find(
        (item) => (!request.user_id || item.user_id === request.user_id) && item.publish_batch_id === request.publish_batch_id
      ) || null;
      const followSet = buildPersistedFollowSet(request.user_id);

      return {
        publish_batch: cloneValue(publishBatch),
        items: cloneValue(items),
        follow_match_count: items.filter((item) => matchesFollowSelectionForContent(item, followSet)).length,
        inbox_item: cloneValue(inboxItem)
      };
    },

    async getCommercialOffer() {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.commercialOffer?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        available_plans: [],
        active_campaign_adjustment: null,
        experiment_offer_hint: null,
        promo_input_capability: {
          enabled: true,
          preview_only: true
        },
        floor_guard_explanation: "",
        quota_reason: null,
        entitlement_reason: null,
        audience_context_hint: null
      });
    },

    async getQuotaStatus() {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.quotaStatus?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        free_quota_total: 0,
        free_quota_used: 0,
        quota_remaining: 0,
        paywall_triggered: false,
        reset_at: null,
        reset_timezone: "Asia/Shanghai",
        quota_reason: null,
        reset_hint: null
      });
    },

    async previewPromo(request) {
      const responses = activeFixtures(fixturesOverride).stageG?.promoPreview?.responses || [];
      const normalizedCode = String(request.promo_code || "").trim().toUpperCase();
      const match = responses.find(
        (item) =>
          String(item.promo_code || "").toUpperCase() === normalizedCode &&
          (!request.pricing_plan_id || item.pricing_plan_id === request.pricing_plan_id)
      );

      if (match) {
        return cloneValue({
          product_key: request.product_key,
          ...match
        });
      }

      return {
        product_key: request.product_key,
        promo_code: request.promo_code,
        pricing_plan_id: request.pricing_plan_id || activeFixtures(fixturesOverride).stageG?.promoPreview?.default_plan_id || null,
        status: "invalid",
        final_amount_fen: 0,
        original_amount_fen: 0,
        applied_price_multiplier_basis_points: 10000,
        campaign_id: null,
        floor_applied: false,
        message: "券码不存在或未配置本地预览。"
      };
    },

    async getReferralSummary() {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.referralSummary?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        invite_code: null,
        share_preview: "",
        inviter_summary: "",
        invitee_summary: "",
        reward_rule_summary: []
      });
    },

    async getRewardSummary() {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.rewardSummary?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        ledger_preview: [],
        vip_days_total: 0,
        active_vip_days: 0,
        status_summary: "none"
      });
    },

    async getCampaignLanding() {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.campaignLanding?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        campaign_id: null,
        campaign_key: null,
        title: "Campaign preview",
        subtitle: "",
        discount_label: null,
        eligibility_summary: [],
        cta_primary: "View offer",
        cta_secondary: "Later"
      });
    },

    async getProfileBenefits(request = {}) {
      return cloneValue(activeFixtures(fixturesOverride).stageG?.profileBenefits?.response || {
        product_key: activeFixtures(fixturesOverride).metadata?.product_key || "demo_cn_content",
        subscription_status: "free",
        entitlement_status: "inactive",
        entitlement_badge: "Free Reader",
        grace_like_summary: null,
        lifecycle_projection: [],
        quota: {
          remaining: 0,
          total: 0,
          reason: null
        },
        saved_count: 0,
        inbox_unread_count: listUnreadInbox(request.user_id, fixturesOverride).length,
        reward_summary: {
          vip_days_total: 0,
          active_rewards: 0
        },
        benefit_summary: []
      });
    },

    async ingestEvent(request) {
      const existing = eventDedupMap.get(request.dedup_key);

      if (existing) {
        return cloneValue(existing);
      }

      const response = {
        product_key: request.product_key,
        ingest_status: "accepted",
        dedup_key: request.dedup_key,
        event_id: "evt_mobile_" + request.request_id
      };

      eventDedupMap.set(request.dedup_key, response);
      return cloneValue(response);
    },

    async getAuthSession(request) {
      return {
        session_state: "active_local_stub",
        auth_provider: "local_stub",
        user_id: request.user_id,
        session_id: `sess_local_${request.user_id}`,
        token_state: "local_present",
        runtime_mode: request.runtime_mode || "local"
      };
    },

    async refreshAuthSession(request) {
      return {
        session_state: "refreshed",
        auth_provider: "local_stub",
        user_id: request.user_id,
        session_id: `sess_local_${request.user_id}`,
        token_state: "local_rotated",
        runtime_mode: request.runtime_mode || "local"
      };
    },

    async signOutAuthSession(request) {
      return {
        signout_state: "cleared",
        session_state: "signed_out",
        user_id: request.user_id,
        runtime_mode: request.runtime_mode || "local"
      };
    },

    async registerDevice(request) {
      return {
        registration_state: "registered",
        installation_id: request.installation_id,
        device_id: request.device_id || request.installation_id,
        push_clientid: request.push_clientid || null,
        appid: request.appid || "demo-mobile-app",
        last_seen_at: request.last_seen_at || new Date().toISOString(),
        runtime_mode: request.runtime_mode || "local"
      };
    },

    async getPushCapability(request) {
      return {
        capability_state: request.push_clientid ? "cid_present" : "cid_missing",
        permission_state: request.permission_state || "prompt",
        transport_state: "local_stubbed",
        push_enabled: Boolean(request.push_clientid),
        push_clientid_present: Boolean(request.push_clientid),
        push_clientid: request.push_clientid || null,
        push_appid: request.appid || "demo-push-app",
        installation_id: request.installation_id,
        runtime_mode: request.runtime_mode || "local"
      };
    },

    async getNotificationDeliveryPreview(request) {
      return {
        preview_state: request.force_digest
          ? "digest_queued"
          : request.dedupe_hit
            ? "deduped"
            : request.quiet_hours_active
              ? "suppressed"
              : "eligible",
        transport_decision: request.force_digest
          ? "digest_queued"
          : request.dedupe_hit
            ? "deduped"
            : request.quiet_hours_active
              ? "suppressed_by_quiet_hours"
              : "eligible_for_delivery",
        suppression_reason: request.quiet_hours_active ? "quiet_hours" : request.dedupe_hit ? "delivery_key_reused" : null,
        inbox_truth_state: "durable",
        notification_inbox_id: request.notification_inbox_id || null,
        runtime_mode: request.runtime_mode || "local"
      };
    },

    listAvailableSurfaces() {
      return cloneValue(activeFixtures(fixturesOverride).surfaceStatus);
    },

    getFixtureMetadata() {
      return {
        ...cloneValue(activeFixtures(fixturesOverride).metadata),
        runtime_source: getRuntimeSourceSummary()
      };
    }
  };
}
