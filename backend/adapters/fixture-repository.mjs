import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getIssueMeta } from "../../shared/utils/issue-meta.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const currentRuntimeBundlePath = path.join(
  repoRoot,
  "mobile",
  "fixtures",
  "runtime",
  "current",
  "runtime.bundle.json"
);

function readSeedFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compareCursor(left, right) {
  if (left.updated_at === right.updated_at) {
    return left._id.localeCompare(right._id);
  }

  return left.updated_at.localeCompare(right.updated_at);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesFacet(item, key, expected) {
  if (!expected || (Array.isArray(expected) && expected.length === 0)) {
    return true;
  }

  const expectedValues = Array.isArray(expected) ? expected : [expected];
  const actualValue = item[key];

  if (Array.isArray(actualValue)) {
    return expectedValues.some((value) => actualValue.includes(value));
  }

  return expectedValues.includes(actualValue);
}

function isInboxActionable(item, nowIso) {
  if (!item) {
    return false;
  }

  if (item.status === "expired" || item.status === "archived") {
    return false;
  }

  if (item.available_until && item.available_until < nowIso) {
    return false;
  }

  return true;
}

function isContentAvailable(item, nowIso) {
  if (!item) {
    return false;
  }

  if (item.available_from && item.available_from > nowIso) {
    return false;
  }

  if (item.available_until && item.available_until < nowIso) {
    return false;
  }

  return true;
}

export class FixtureRepository {
  constructor(runtimeConfig) {
    this.runtimeConfig = runtimeConfig;
    this.products = readSeedFile("fixtures/db/seed/products.seed.json");
    this.publications = readSeedFile("fixtures/db/seed/publications.seed.json");
    this.articles = readSeedFile("fixtures/db/seed/articles.seed.json");
    this.articleVariants = readSeedFile("fixtures/db/seed/article_variants.seed.json");
    this.pricingPlans = readSeedFile("fixtures/db/seed/pricing_plans.seed.json");
    this.promoCampaigns = readSeedFile("fixtures/db/seed/promo_campaigns.seed.json");
    this.promoCodes = readSeedFile("fixtures/db/seed/promo_codes.seed.json");
    this.experiments = readSeedFile("fixtures/db/seed/experiments.seed.json");
    this.eventLogsRaw = readSeedFile("fixtures/db/seed/event_logs_raw.seed.json");
    this.runtimeEvents = [];

    this.currentRuntimeBundle = readOptionalJson(currentRuntimeBundlePath);
    this.discoveryCatalog = cloneValue(this.currentRuntimeBundle?.discoveryCatalog?.items || []);
    this.publishBatches = cloneValue(this.currentRuntimeBundle?.publishBatches?.items || []);
    this.followCatalog = cloneValue(this.currentRuntimeBundle?.followCatalog || { publications: [], tags: [] });
    this.userFollows = cloneValue(this.currentRuntimeBundle?.userFollows?.items || []);
    this.notificationPrefs = this.currentRuntimeBundle?.notificationPrefs?.response
      ? cloneValue(this.currentRuntimeBundle.notificationPrefs.response)
      : null;
    this.notificationInbox = cloneValue(this.currentRuntimeBundle?.notificationInbox?.items || []);
    this.notificationDeliveries = cloneValue(this.currentRuntimeBundle?.notificationDeliveries?.items || []);
    this.userContentState = cloneValue(this.currentRuntimeBundle?.userContentState?.items || []);
    this.inboxLastSeenAt = this.currentRuntimeBundle?.notificationInbox?.inbox_last_seen_at || null;
    this.lastSeenPublishBatch = this.currentRuntimeBundle?.userContentState?.last_seen_publish_batch || null;
    this.stageG = cloneValue(this.currentRuntimeBundle?.stageG || {});
  }

  getProduct(productKey) {
    return this.products.find((item) => item.product_key === productKey) ?? null;
  }

  listArticles(productKey) {
    return this.articles.filter((item) => item.product_key === productKey);
  }

  listArticleVariants(productKey) {
    return this.articleVariants.filter((item) => item.product_key === productKey);
  }

  getArticle(articleId, productKey) {
    return this.articles.find(
      (item) => item._id === articleId && item.product_key === productKey
    ) ?? null;
  }

  getPricingPlan(planId, productKey) {
    return this.pricingPlans.find(
      (item) => item._id === planId && item.product_key === productKey
    ) ?? null;
  }

  getPromoCode(code, productKey) {
    return this.promoCodes.find(
      (item) => item.code === code && item.product_key === productKey
    ) ?? null;
  }

  getPromoCampaign(campaignId, productKey) {
    return this.promoCampaigns.find(
      (item) => item._id === campaignId && item.product_key === productKey
    ) ?? null;
  }

  listExperiments(productKey) {
    return this.experiments.filter((item) => item.product_key === productKey);
  }

  listContentChanges(productKey, lastSyncCursor) {
    const bundleChanges = this.currentRuntimeBundle?.contentSyncDelta?.response?.items;

    if (bundleChanges?.length) {
      return bundleChanges
        .map((payload) => ({
          entity_type: payload.entity_type,
          _id: payload.entity_type === "article" ? payload.article_id : payload.article_variant_id,
          updated_at: payload.updated_at,
          payload
        }))
        .sort(compareCursor)
        .filter((item) => {
          if (!lastSyncCursor) {
            return true;
          }

          const [cursorTimestamp, cursorId] = String(lastSyncCursor).split("|");
          if (item.updated_at > cursorTimestamp) {
            return true;
          }
          if (item.updated_at < cursorTimestamp) {
            return false;
          }
          return item._id > (cursorId ?? "");
        });
    }

    const articleItems = this.listArticles(productKey).map((item) => ({
      entity_type: "article",
      _id: item._id,
      updated_at: item.updated_at,
      payload: {
        entity_type: "article",
        article_id: item._id,
        article_key: item.article_key,
        publication_id: item.publication_id,
        title: item.title,
        summary: item.summary,
        status: item.status,
        updated_at: item.updated_at
      }
    }));

    const variantItems = this.listArticleVariants(productKey).map((item) => ({
      entity_type: "article_variant",
      _id: item._id,
      updated_at: item.updated_at,
      payload: {
        entity_type: "article_variant",
        article_variant_id: item._id,
        article_id: item.article_id,
        language: item.language,
        audience_segment: item.audience_segment,
        reading_mode: item.reading_mode,
        publish_status: item.publish_status,
        publish_at: item.publish_at,
        revision: item.revision,
        content_hash: item.content_hash,
        is_deleted: item.is_deleted,
        updated_at: item.updated_at
      }
    }));

    return [...articleItems, ...variantItems]
      .sort(compareCursor)
      .filter((item) => {
        if (!lastSyncCursor) {
          return true;
        }

        const [cursorTimestamp, cursorId] = String(lastSyncCursor).split("|");
        if (item.updated_at > cursorTimestamp) {
          return true;
        }
        if (item.updated_at < cursorTimestamp) {
          return false;
        }
        return item._id > (cursorId ?? "");
      });
  }

  listEvents(productKey) {
    return [...this.eventLogsRaw, ...this.runtimeEvents].filter(
      (item) => item.product_key === productKey
    );
  }

  ingestEvent(eventRecord) {
    const existing = this.listEvents(eventRecord.product_key).find(
      (item) => item.dedup_key === eventRecord.dedup_key
    );

    if (existing) {
      return {
        status: "duplicate",
        event: existing
      };
    }

    this.runtimeEvents.push(eventRecord);
    return {
      status: "accepted",
      event: eventRecord
    };
  }

  listDiscoveryCatalog(productKey) {
    if (this.discoveryCatalog.length) {
      return this.discoveryCatalog.filter((item) => item.article_id && productKey);
    }

    return [];
  }

  listFollowCatalog() {
    return cloneValue(this.followCatalog);
  }

  listUserFollows(productKey, userId) {
    return this.userFollows.filter(
      (item) => item.product_key === productKey && item.user_id === userId && item.status !== "removed"
    );
  }

  toggleFollow(productKey, userId, subjectType, subjectKey, desiredState, notifyLevel, sourceSurface) {
    const existing = this.userFollows.find(
      (item) =>
        item.product_key === productKey &&
        item.user_id === userId &&
        item.subject_type === subjectType &&
        item.subject_key === subjectKey
    );

    if (desiredState === "followed") {
      const nextRecord = {
        _id: existing?._id || `follow_${subjectType}_${subjectKey}_${userId}`,
        product_key: productKey,
        user_id: userId,
        subject_type: subjectType,
        subject_key: subjectKey,
        status: "active",
        notify_level: notifyLevel || existing?.notify_level || "immediate",
        source_surface: sourceSurface || existing?.source_surface || "follow_catalog",
        created_at: existing?.created_at || this.runtimeConfig.now,
        updated_at: this.runtimeConfig.now
      };

      if (existing) {
        Object.assign(existing, nextRecord);
      } else {
        this.userFollows.push(nextRecord);
      }

      return cloneValue(nextRecord);
    }

    if (existing) {
      existing.status = "removed";
      existing.removed_at = this.runtimeConfig.now;
      existing.updated_at = this.runtimeConfig.now;
      return cloneValue(existing);
    }

    return {
      _id: `follow_${subjectType}_${subjectKey}_${userId}`,
      product_key: productKey,
      user_id: userId,
      subject_type: subjectType,
      subject_key: subjectKey,
      status: "removed",
      notify_level: notifyLevel || "mute",
      source_surface: sourceSurface || "follow_catalog",
      created_at: this.runtimeConfig.now,
      updated_at: this.runtimeConfig.now,
      removed_at: this.runtimeConfig.now
    };
  }

  getNotificationPrefs(productKey, userId) {
    if (this.notificationPrefs?.product_key === productKey && this.notificationPrefs?.user_id === userId) {
      return cloneValue(this.notificationPrefs);
    }

    return {
      _id: `unp_${userId}`,
      product_key: productKey,
      user_id: userId,
      status: "active",
      push_enabled: true,
      inbox_enabled: true,
      digest_enabled: true,
      follow_alert_level: "immediate",
      breaking_push_override: true,
      quiet_hours_enabled: false,
      quiet_hours_start_minute: 1320,
      quiet_hours_end_minute: 420,
      timezone: this.runtimeConfig.timezone,
      digest_frequency: "daily",
      created_at: this.runtimeConfig.now,
      updated_at: this.runtimeConfig.now
    };
  }

  updateNotificationPrefs(productKey, userId, patch) {
    const current = this.getNotificationPrefs(productKey, userId);
    this.notificationPrefs = {
      ...current,
      ...patch,
      product_key: productKey,
      user_id: userId,
      updated_at: this.runtimeConfig.now
    };
    return cloneValue(this.notificationPrefs);
  }

  listNotificationInbox(productKey, userId, statusFilter) {
    return this.notificationInbox
      .filter((item) => item.product_key === productKey && item.user_id === userId)
      .filter((item) => isInboxActionable(item, this.runtimeConfig.now))
      .filter((item) => !statusFilter || statusFilter === "all" || item.status === statusFilter)
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  markInboxRead(productKey, userId, inboxIds = [], markAllBefore = null) {
    let updated = 0;
    this.notificationInbox.forEach((item) => {
      if (item.product_key !== productKey || item.user_id !== userId || item.status === "read") {
        return;
      }

      const byId = inboxIds.length > 0 && inboxIds.includes(item._id);
      const byTime = markAllBefore && item.created_at <= markAllBefore;

      if (byId || byTime) {
        item.status = "read";
        item.read_at = item.read_at || this.runtimeConfig.now;
        item.updated_at = this.runtimeConfig.now;
        updated += 1;
      }
    });

    return {
      updated_count: updated,
      unread_count: this.listNotificationInbox(productKey, userId, "unread").length
    };
  }

  listUserContentState(productKey, userId) {
    return this.userContentState.filter(
      (item) => item.product_key === productKey && item.user_id === userId
    );
  }

  upsertUserContentState(productKey, userId, articleId, patch) {
    const existing = this.userContentState.find(
      (item) => item.product_key === productKey && item.user_id === userId && item.article_id === articleId
    );

    if (existing) {
      Object.assign(existing, patch, { updated_at: this.runtimeConfig.now });
      return cloneValue(existing);
    }

    const nextRecord = {
      _id: `ucs_${userId}_${articleId}`,
      product_key: productKey,
      user_id: userId,
      article_id: articleId,
      reading_state: "unseen",
      bookmark_status: "none",
      newness_state: "new",
      created_at: this.runtimeConfig.now,
      updated_at: this.runtimeConfig.now,
      ...patch
    };
    this.userContentState.push(nextRecord);
    return cloneValue(nextRecord);
  }

  toggleSaveForLater(productKey, userId, articleId, desiredState) {
    const nextBookmarkStatus = desiredState === "saved" ? "saved" : "removed";
    const record = this.upsertUserContentState(productKey, userId, articleId, {
      bookmark_status: nextBookmarkStatus,
      saved_at: desiredState === "saved" ? this.runtimeConfig.now : null
    });

    return {
      article_id: articleId,
      bookmark_status: record.bookmark_status,
      saved_at: record.saved_at || null
    };
  }

  getContentResume(productKey, userId, limit = 5) {
    const items = this.listUserContentState(productKey, userId)
      .filter((item) => item.reading_state === "in_progress" || Number(item.resume_progress_basis_points || 0) > 0)
      .map((item) => {
        const article = this.listDiscoveryCatalog(productKey).find((entry) => entry.article_id === item.article_id);
        return {
          article_id: item.article_id,
          title: article?.title || item.article_id,
          summary: article?.summary || "",
          progress_hint: Number(item.resume_progress_basis_points || 0),
          resume_anchor: item.resume_anchor || null,
          last_opened_at: item.last_opened_at || null,
          reading_mode: item.last_read_mode || article?.primary_reading_mode || "quick_30s",
          update_type: article?.update_type || null,
          change_summary: article?.change_summary || null
        };
      })
      .slice(0, limit);

    return items;
  }

  listPublishBatches(productKey) {
    return this.publishBatches.filter((item) => item.product_key === productKey);
  }

  getPublishBatchSummary(productKey, publishBatchId, userId) {
    const publishBatch = this.listPublishBatches(productKey).find((item) => item._id === publishBatchId) || null;
    const items = this.listDiscoveryCatalog(productKey).filter((item) => item.publish_batch_id === publishBatchId);
    const followSet = new Set(this.listUserFollows(productKey, userId).map((item) => `${item.subject_type}:${item.subject_key}`));
    const followMatchCount = items.filter((item) => {
      return followSet.has(`publication:${item.publication_key}`) || (item.tags || []).some((tag) => followSet.has(`topic_tag:${tag}`));
    }).length;
    const inboxItem = this.notificationInbox.find(
      (item) => item.product_key === productKey && item.user_id === userId && item.publish_batch_id === publishBatchId
    ) || null;

    return {
      publish_batch: publishBatch,
      items,
      follow_match_count: followMatchCount,
      inbox_item: inboxItem
    };
  }

  searchContent(productKey, query = "", filters = {}, limit = 20) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const items = this.listDiscoveryCatalog(productKey)
      .filter((item) => isContentAvailable(item, this.runtimeConfig.now))
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        const issueMeta = getIssueMeta(item);
        const haystack = [item.title, item.summary, item.publication_key, item.publication_name, issueMeta.issue_label, issueMeta.issue_display_label, ...(item.tags || [])]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .filter((item) => matchesFacet(item, "publication_key", filters.publication))
      .filter((item) => !filters.issue_id || [].concat(filters.issue_id).includes(getIssueMeta(item).issue_id))
      .filter((item) => matchesFacet(item, "tags", filters.tag))
      .filter((item) => matchesFacet(item, "primary_reading_mode", filters.reading_mode))
      .filter((item) => matchesFacet(item, "primary_audience", filters.audience))
      .filter((item) => matchesFacet(item, "update_type", filters.newness))
      .slice(0, limit);

    return {
      items,
      facets: {
        publication: [...new Set(this.listDiscoveryCatalog(productKey).map((item) => item.publication_key))],
        issue_id: [...new Set(this.listDiscoveryCatalog(productKey).map((item) => getIssueMeta(item).issue_id).filter(Boolean))],
        tag: [...new Set(this.listDiscoveryCatalog(productKey).flatMap((item) => item.tags || []))],
        reading_mode: [...new Set(this.listDiscoveryCatalog(productKey).map((item) => item.primary_reading_mode))],
        audience: [...new Set(this.listDiscoveryCatalog(productKey).map((item) => item.primary_audience))],
        newness: [...new Set(this.listDiscoveryCatalog(productKey).map((item) => item.update_type).filter(Boolean))]
      }
    };
  }

  buildHomeDiscovery(productKey, userId) {
    const catalog = this.listDiscoveryCatalog(productKey).filter((item) => isContentAvailable(item, this.runtimeConfig.now));
    const follows = this.listUserFollows(productKey, userId);
    const states = this.listUserContentState(productKey, userId);
    const followSet = new Set(follows.map((item) => `${item.subject_type}:${item.subject_key}`));
    const continueReading = this.getContentResume(productKey, userId, 3);
    const savedForLater = states
      .filter((item) => item.bookmark_status === "saved")
      .map((item) => {
        const article = catalog.find((entry) => entry.article_id === item.article_id);
        return {
          article_id: item.article_id,
          title: article?.title || item.article_id,
          summary: article?.summary || "",
          saved_at: item.saved_at || item.updated_at
        };
      });

    const todayNew = catalog.filter((item) => item.update_type === "new_publish");
    const sinceLastVisit = catalog.filter((item) => item.publish_batch_id && item.publish_batch_id !== this.lastSeenPublishBatch);
    const followedUpdates = catalog.filter((item) => {
      return followSet.has(`publication:${item.publication_key}`) || (item.tags || []).some((tag) => followSet.has(`topic_tag:${tag}`));
    });

    return {
      modules: [
        { section_key: "today_new", title: "今日新增", items: todayNew },
        { section_key: "since_last_visit", title: "自上次访问以来", items: sinceLastVisit },
        { section_key: "followed_updates", title: "关注更新", items: followedUpdates },
        { section_key: "continue_reading", title: "继续阅读", items: continueReading },
        { section_key: "saved_for_later", title: "稍后再读", items: savedForLater }
      ],
      continue_reading: continueReading,
      inbox_unread_count: this.listNotificationInbox(productKey, userId, "unread").length,
      next_digest_hint: this.getNotificationPrefs(productKey, userId).digest_enabled ? "digest_available" : "digest_disabled",
      server_time: this.runtimeConfig.now
    };
  }

  getQuotaStatus(productKey) {
    if (this.stageG.quotaStatus?.response?.product_key === productKey) {
      return cloneValue(this.stageG.quotaStatus.response);
    }

    const entitlement = this.currentRuntimeBundle?.entitlementSnapshot?.response || {};
    return {
      product_key: productKey,
      free_quota_total: 0,
      free_quota_used: 0,
      quota_remaining: entitlement.quota_remaining ?? 0,
      paywall_triggered: (entitlement.quota_remaining ?? 0) <= 0 && entitlement.access_state !== "allowed",
      reset_at: null,
      reset_timezone: this.runtimeConfig.timezone,
      quota_reason: entitlement.denial_reason || null,
      reset_hint: null
    };
  }

  getCommercialOffer(productKey) {
    if (this.stageG.commercialOffer?.response?.product_key === productKey) {
      return cloneValue(this.stageG.commercialOffer.response);
    }

    const quotaStatus = this.getQuotaStatus(productKey);
    const plans = this.pricingPlans
      .filter((item) => item.product_key === productKey && item.status === "active")
      .map((plan) => ({
        pricing_plan_id: plan._id,
        plan_key: plan.plan_key,
        display_name: plan.display_name,
        billing_cycle: plan.billing_cycle,
        original_amount_fen: plan.price_fen,
        display_amount_fen: plan.price_fen,
        price_floor_fen: plan.price_floor_fen,
        floor_applied: false,
        currency: plan.currency,
        is_default_display: Boolean(plan.is_default_display)
      }));

    return {
      product_key: productKey,
      available_plans: plans,
      active_campaign_adjustment: null,
      experiment_offer_hint: null,
      promo_input_capability: {
        enabled: true,
        preview_only: true
      },
      floor_guard_explanation: "Display preview still obeys canonical floor guard.",
      quota_reason: quotaStatus.quota_reason,
      entitlement_reason: this.currentRuntimeBundle?.entitlementSnapshot?.response?.denial_reason || null,
      audience_context_hint: null
    };
  }

  previewPromo(productKey, promoCode, pricingPlanId = null) {
    const responses = this.stageG.promoPreview?.responses || [];
    const normalizedCode = String(promoCode || "").trim().toUpperCase();
    const match = responses.find(
      (item) =>
        String(item.promo_code || "").toUpperCase() === normalizedCode &&
        (!pricingPlanId || item.pricing_plan_id === pricingPlanId)
    );

    if (match) {
      return cloneValue({
        product_key: productKey,
        ...match
      });
    }

    const plan = this.getPricingPlan(pricingPlanId || this.stageG.promoPreview?.default_plan_id || "plan_demo_monthly", productKey);
    return {
      product_key: productKey,
      promo_code: promoCode,
      pricing_plan_id: plan?._id || pricingPlanId || null,
      status: "invalid",
      final_amount_fen: plan?.price_fen ?? 0,
      original_amount_fen: plan?.price_fen ?? 0,
      applied_price_multiplier_basis_points: 10000,
      campaign_id: null,
      floor_applied: false,
      message: "券码不存在或未配置本地预览。"
    };
  }

  getReferralSummary(productKey) {
    if (this.stageG.referralSummary?.response?.product_key === productKey) {
      return cloneValue(this.stageG.referralSummary.response);
    }

    return {
      product_key: productKey,
      invite_code: null,
      share_preview: "",
      inviter_summary: "",
      invitee_summary: "",
      reward_rule_summary: []
    };
  }

  getRewardSummary(productKey) {
    if (this.stageG.rewardSummary?.response?.product_key === productKey) {
      return cloneValue(this.stageG.rewardSummary.response);
    }

    return {
      product_key: productKey,
      ledger_preview: [],
      vip_days_total: 0,
      active_vip_days: 0,
      status_summary: "none"
    };
  }

  getCampaignLanding(productKey) {
    if (this.stageG.campaignLanding?.response?.product_key === productKey) {
      return cloneValue(this.stageG.campaignLanding.response);
    }

    return {
      product_key: productKey,
      campaign_id: null,
      campaign_key: null,
      title: "Campaign preview",
      subtitle: "Display-only campaign placeholder.",
      discount_label: null,
      eligibility_summary: [],
      cta_primary: "View offer",
      cta_secondary: "Later"
    };
  }

  getProfileBenefits(productKey) {
    if (this.stageG.profileBenefits?.response?.product_key === productKey) {
      return cloneValue(this.stageG.profileBenefits.response);
    }

    const quotaStatus = this.getQuotaStatus(productKey);
    const rewardSummary = this.getRewardSummary(productKey);
    return {
      product_key: productKey,
      subscription_status: "free",
      entitlement_status: "inactive",
      entitlement_badge: "Free Reader",
      grace_like_summary: null,
      lifecycle_projection: [],
      quota: {
        remaining: quotaStatus.quota_remaining,
        total: quotaStatus.free_quota_total,
        reason: quotaStatus.quota_reason
      },
      saved_count: this.userContentState.filter((item) => item.bookmark_status === "saved").length,
      inbox_unread_count: this.notificationInbox.filter((item) => item.status === "unread").length,
      reward_summary: {
        vip_days_total: rewardSummary.vip_days_total,
        active_rewards: (rewardSummary.ledger_preview || []).filter((item) => item.status === "granted").length
      },
      benefit_summary: []
    };
  }
}
