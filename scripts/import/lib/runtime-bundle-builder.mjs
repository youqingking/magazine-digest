import crypto from "node:crypto";
import { filterPublishableRecords } from "./content-package-gate.mjs";
import { getIssueMeta } from "../../../shared/utils/issue-meta.js";

export const defaultUserId = "user_local_stage_e0";

function contentHash(value) {
  return crypto.createHash("sha1").update(String(value || "")).digest("hex");
}

export function buildRuntimeBundleFromNormalizedRecords({
  records,
  scenarioId,
  sourceKind,
  canonicalSource,
  buildLabel,
  freeQuotaLimit = 8,
  baseRuntimeFixtures,
  runtimeNow,
  userId = defaultUserId,
  description = ""
}) {
  const publishedAt = runtimeNow || new Date().toISOString();
  const {
    report: gateReport,
    validRecords
  } = filterPublishableRecords(records);
  const publishableRecords = validRecords;
  const recordById = new Map(publishableRecords.map((record) => [record.article_id, record]));
  const commercialOffer = baseRuntimeFixtures.stageG?.commercialOffer?.response || { available_plans: [] };
  const campaignLanding = baseRuntimeFixtures.stageG?.campaignLanding?.response || null;
  const referralSummary = baseRuntimeFixtures.stageG?.referralSummary?.response || null;
  const rewardSummary = baseRuntimeFixtures.stageG?.rewardSummary?.response || null;
  const bootstrapResponse = baseRuntimeFixtures.bootstrapConfig?.response || null;
  const experimentAssign = baseRuntimeFixtures.experimentAssign?.response || null;
  const surfaceStatus = baseRuntimeFixtures.surfaceStatus || [];

  const discoveryCatalog = publishableRecords.map((record, index) => ({
    ...getIssueMeta(record),
    article_id: record.article_id,
    article_key: record.article_uid,
    title: record.title,
    original_title: record.original_title,
    summary: record.summary,
    publication_id: `pub_${record.publication_id || record.publication_key}`,
    publication_key: record.publication_id || record.publication_key,
    publication_name: record.publication_display_name || record.publication_name,
    tags: record.tags || [],
    section_label: record.section_label || null,
    section_key: record.section_key || null,
    raw_section_label: record.raw_section_label || record.section_label || null,
    canonical_section_key: record.canonical_section_key || null,
    canonical_section_label: record.canonical_section_label || null,
    discovery_bucket: record.discovery_bucket || null,
    publication_section_path: record.publication_section_path || null,
    taxonomy_warnings: record.taxonomy_warnings || [],
    start_page: record.start_page ?? null,
    canonical_url: record.canonical_url ?? null,
    cover: record.cover ?? null,
    author: record.author ?? null,
    available_modes: ["quick_30s", "deep_3m"],
    available_audiences: ["teen", "general", "adult"],
    updated_at: record.updated_at || publishedAt,
    publish_batch_id: record.publish_batch_id,
    update_type: "new_publish",
    update_priority: 100 - index,
    change_summary: record.change_summary || `${record.issue_label} 真实样本导入`,
    notify_level: "default",
    is_breaking: false,
    available_from: publishedAt,
    available_until: null,
    primary_reading_mode: "quick_30s",
    primary_audience: "general"
  }));

  const articleItems = publishableRecords.map((record) => ({
    entity_type: "article",
    ...getIssueMeta(record),
    article_id: record.article_id,
    article_key: record.article_uid,
    publication_id: `pub_${record.publication_id || record.publication_key}`,
    publication_key: record.publication_id || record.publication_key,
    title: record.title,
    summary: record.summary,
    tags: record.tags || [],
    raw_section_label: record.raw_section_label || record.section_label || null,
    canonical_section_key: record.canonical_section_key || null,
    canonical_section_label: record.canonical_section_label || null,
    discovery_bucket: record.discovery_bucket || null,
    publication_section_path: record.publication_section_path || null,
    taxonomy_warnings: record.taxonomy_warnings || [],
    status: "active",
    updated_at: record.updated_at || publishedAt,
    publish_batch_id: record.publish_batch_id || null
  }));

  const variantItems = publishableRecords.flatMap((record) => [
    { article_variant_id: `var_${record.article_id}_general_quick_30s`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "general", reading_mode: "quick_30s", content_hash: contentHash(record.general_quick_30s) },
    { article_variant_id: `var_${record.article_id}_general_deep_3m`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "general", reading_mode: "deep_3m", content_hash: contentHash(record.general_deep_3m) },
    { article_variant_id: `var_${record.article_id}_teen_quick_30s`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "teen", reading_mode: "quick_30s", content_hash: contentHash(record.teen_quick_30s) },
    { article_variant_id: `var_${record.article_id}_teen_deep_3m`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "teen", reading_mode: "deep_3m", content_hash: contentHash(record.teen_deep_3m) },
    { article_variant_id: `var_${record.article_id}_adult_quick_30s`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "adult", reading_mode: "quick_30s", content_hash: contentHash(record.quick_30s) },
    { article_variant_id: `var_${record.article_id}_adult_deep_3m`, article_id: record.article_id, tags: record.tags || [], language: "zh-CN", audience_segment: "adult", reading_mode: "deep_3m", content_hash: contentHash(record.deep_3m) }
  ]).map((variant) => ({
    entity_type: "article_variant",
    ...getIssueMeta(recordById.get(variant.article_id)),
    publication_key: recordById.get(variant.article_id)?.publication_id || recordById.get(variant.article_id)?.publication_key || null,
    publish_status: "published",
    publish_at: publishedAt,
    revision: 1,
    publish_batch_id: recordById.get(variant.article_id)?.publish_batch_id || null,
    update_type: "new_publish",
    update_priority: 80,
    change_summary: recordById.get(variant.article_id)?.change_summary || "真实样本导入",
    notify_level: "default",
    is_breaking: false,
    available_from: publishedAt,
    available_until: null,
    is_deleted: false,
    updated_at: recordById.get(variant.article_id)?.updated_at || publishedAt,
    ...variant
  }));

  const contentDetailResponses = {};
  publishableRecords.forEach((record) => {
    const variants = [
      { audience: "teen", mode: "quick_30s", body: record.teen_quick_30s, sourceField: "teen_quick_30s" },
      { audience: "teen", mode: "deep_3m", body: record.teen_deep_3m, sourceField: "teen_deep_3m" },
      { audience: "general", mode: "quick_30s", body: record.general_quick_30s, sourceField: "general_quick_30s" },
      { audience: "general", mode: "deep_3m", body: record.general_deep_3m, sourceField: "general_deep_3m" },
      { audience: "adult", mode: "quick_30s", body: record.quick_30s, sourceField: "quick_30s" },
      { audience: "adult", mode: "deep_3m", body: record.deep_3m, sourceField: "deep_3m" }
    ];
    variants.forEach((variant) => {
      contentDetailResponses[`${record.article_id}|zh-CN|${variant.audience}|${variant.mode}`] = {
        article: {
          ...getIssueMeta(record),
          article_id: record.article_id,
          article_key: record.article_uid,
          title: record.title,
          original_title: record.original_title,
          summary: record.summary,
          publication_key: record.publication_id || record.publication_key,
          publication_name: record.publication_display_name || record.publication_name,
          section_label: record.section_label || null,
          raw_section_label: record.raw_section_label || record.section_label || null,
          canonical_section_key: record.canonical_section_key || null,
          canonical_section_label: record.canonical_section_label || null,
          discovery_bucket: record.discovery_bucket || null,
          publication_section_path: record.publication_section_path || null,
          taxonomy_warnings: record.taxonomy_warnings || [],
          start_page: record.start_page ?? null,
          canonical_url: record.canonical_url ?? null,
          cover: record.cover ?? null,
          author: record.author ?? null
        },
        resolved_variant: {
          article_variant_id: `var_${record.article_id}_${variant.audience}_${variant.mode}`,
          audience_segment: variant.audience,
          reading_mode: variant.mode,
          revision: 1,
          title: record.title,
          markdown_body: variant.body,
          content_hash: contentHash(variant.body),
          premium_tier: record.runtime_test_rule?.derived_paywall_state === "preview_locked" ? "premium" : "free",
          publish_batch_id: record.publish_batch_id,
          update_type: "new_publish",
          update_priority: 80,
          change_summary: record.change_summary || `${record.issue_label} 真实样本导入`,
          notify_level: "default",
          is_breaking: false,
          available_from: publishedAt,
          available_until: null,
          source_field: variant.sourceField
        },
        selection_reason: "exact_match",
        fallback_applied: false,
        unavailable_reason: null
      };
    });
  });

  const publicationMap = new Map();
  for (const record of publishableRecords) {
    const key = record.publication_id || record.publication_key;
    const issueMeta = getIssueMeta(record);
    if (!publicationMap.has(key)) {
      publicationMap.set(key, {
        publication_id: `pub_${key}`,
        publication_key: key,
        display_name: record.publication_display_name || record.publication_name,
        latest_issue_id: issueMeta.issue_id,
        latest_issue_label: issueMeta.issue_label,
        latest_issue_sort_key: issueMeta.issue_sort_key,
        latest_issue_display_label: issueMeta.issue_display_label,
        description: `${record.publication_display_name || record.publication_name} ${issueMeta.issue_display_label || record.issue_label}`
      });
      continue;
    }

    const current = publicationMap.get(key);
    if (String(issueMeta.issue_sort_key || "").localeCompare(String(current.latest_issue_sort_key || "")) > 0) {
      current.latest_issue_id = issueMeta.issue_id;
      current.latest_issue_label = issueMeta.issue_label;
      current.latest_issue_sort_key = issueMeta.issue_sort_key;
      current.latest_issue_display_label = issueMeta.issue_display_label;
      current.description = `${record.publication_display_name || record.publication_name} ${issueMeta.issue_display_label || record.issue_label}`;
    }
  }

  const followTagSet = new Set();
  publishableRecords.forEach((record) => {
    for (const tag of record.tags || []) {
      if (tag) {
        followTagSet.add(tag);
      }
    }
  });

  const batches = Array.from(new Map(publishableRecords.map((record) => {
    const issueMeta = getIssueMeta(record);
    const fallbackBatchId = `batch_${record.publication_id || record.publication_key}_${issueMeta.issue_label || record.issue_label}`;
    return [record.publish_batch_id || fallbackBatchId, {
      _id: record.publish_batch_id || fallbackBatchId,
      product_key: "demo_cn_content",
      publish_batch_key: String(record.publish_batch_id || fallbackBatchId).replace(/^batch_/, ""),
      issue_id: issueMeta.issue_id,
      issue_label: issueMeta.issue_label,
      issue_sort_key: issueMeta.issue_sort_key,
      issue_display_label: issueMeta.issue_display_label,
      title: `${record.publication_display_name || record.publication_name} ${issueMeta.issue_display_label || record.issue_label}`,
      description: description || "多刊真实内容 scenario 批次",
      publication_key: record.publication_id || record.publication_key,
      status: "published",
      created_at: publishedAt,
      updated_at: record.updated_at || publishedAt
    }];
  })).values());

  const inboxItems = discoveryCatalog.slice(0, 3).map((item, index) => ({
    _id: `notif_${scenarioId}_${String(index + 1).padStart(2, "0")}`,
    product_key: "demo_cn_content",
    user_id: userId,
    status: index === 0 ? "unread" : "read",
    source_type: index === 0 ? "publish_batch" : "follow_subject",
    body_preview: item.summary,
    issue_id: item.issue_id,
    issue_label: item.issue_label,
    issue_display_label: item.issue_display_label,
    change_summary: `${item.publication_name} · ${item.issue_display_label || item.issue_label || ""} · ${item.section_label || item.title}`,
    action_target: item.article_id,
    publish_batch_id: item.publish_batch_id,
    created_at: item.updated_at,
    updated_at: item.updated_at
  }));

  const userContentState = {
    items: discoveryCatalog.slice(0, 2).map((item, index) => ({
      _id: `ucs_${userId}_${item.article_id}`,
      product_key: "demo_cn_content",
      user_id: userId,
      article_id: item.article_id,
      reading_state: index === 0 ? "in_progress" : "seen",
      bookmark_status: index === 1 ? "saved" : "none",
      newness_state: "new",
      resume_progress_basis_points: index === 0 ? 4200 : 0,
      last_opened_at: item.updated_at,
      last_read_mode: "quick_30s",
      saved_at: index === 1 ? item.updated_at : null,
      created_at: item.updated_at,
      updated_at: item.updated_at
    })),
    last_seen_publish_batch: batches[0]?._id || null
  };

  return {
    metadata: {
      exported_at: new Date().toISOString(),
      canonical_source: canonicalSource,
      product_key: "demo_cn_content",
      scenario_id: scenarioId,
      runtime_now: publishedAt,
      source_kind: sourceKind,
      runtime_fixture_role: "scenario_bundle_source",
      build_label: buildLabel,
      free_quota_limit: freeQuotaLimit,
      excluded_invalid_record_count: records.length - publishableRecords.length,
      content_package_gate: {
        status: gateReport.status,
        blocked_record_count: gateReport.blocked_record_count,
        blocker_count: gateReport.blocker_count
      }
    },
    surfaceStatus,
    bootstrapConfig: {
      response: {
        ...(bootstrapResponse || {}),
        product_key: "demo_cn_content",
        config_source: sourceKind
      }
    },
    contentSyncDelta: {
      response: {
        server_cursor: `${publishedAt}|${variantItems.at(-1)?.article_variant_id || "empty"}`,
        has_more: false,
        items: articleItems.concat(variantItems),
        tombstones: []
      }
    },
    contentDetail: {
      responses: contentDetailResponses
    },
    entitlementSnapshot: {
      response: {
        product_key: "demo_cn_content",
        subject_id: `inst_${scenarioId}`,
        access_state: "denied",
        decision_source: `${sourceKind}_runtime_rule`,
        quota_remaining: 0,
        entitlement_snapshot: null,
        denial_reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED"
      }
    },
    pricingPreview: {
      responses: baseRuntimeFixtures.pricingPreview?.responses || []
    },
    experimentAssign: {
      response: experimentAssign || {
        product_key: "demo_cn_content",
        installation_id: `inst_${scenarioId}`,
        experiment_id: null,
        experiment_key: null,
        assignment_version: 0,
        bucket_key: null,
        assignment_source: sourceKind,
        cache_ttl_seconds: 3600
      }
    },
    discoveryCatalog: {
      items: discoveryCatalog
    },
    followCatalog: {
      publications: Array.from(publicationMap.values()),
      tags: Array.from(followTagSet.values()).map((tag) => ({
        tag_key: tag,
        display_name: tag
      }))
    },
    publishBatches: {
      items: batches
    },
    userFollows: {
      items: Array.from(publicationMap.values()).map((publication) => ({
        _id: `follow_publication_${publication.publication_key}_${userId}`,
        product_key: "demo_cn_content",
        user_id: userId,
        subject_type: "publication",
        subject_key: publication.publication_key,
        status: "active",
        notify_level: "immediate",
        source_surface: "follow_catalog",
        created_at: publishedAt,
        updated_at: publishedAt
      }))
    },
    notificationPrefs: {
      response: {
        _id: `unp_${userId}`,
        product_key: "demo_cn_content",
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
        timezone: "Asia/Shanghai",
        created_at: publishedAt,
        updated_at: publishedAt
      }
    },
    notificationInbox: {
      response: {
        items: inboxItems,
        unread_count: inboxItems.filter((item) => item.status === "unread").length,
        cursor: null,
        has_more: false
      },
      inbox_last_seen_at: null
    },
    userContentState,
    notificationDeliveries: {
      items: []
    },
    stageG: {
      commercialOffer: {
        response: {
          ...commercialOffer,
          quota_reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED",
          entitlement_reason: "REAL_CONTENT_TEST_RULE",
          audience_context_hint: description || buildLabel
        }
      },
      quotaStatus: {
        response: {
          product_key: "demo_cn_content",
          free_quota_total: freeQuotaLimit,
          free_quota_used: freeQuotaLimit,
          quota_remaining: 0,
          paywall_triggered: true,
          reset_at: null,
          reset_timezone: "Asia/Shanghai",
          quota_reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED",
          reset_hint: "当前为 real-content test scenario。"
        }
      },
      promoPreview: {
        default_plan_id:
          baseRuntimeFixtures.stageG?.promoPreview?.default_plan_id ||
          baseRuntimeFixtures.stageG?.promoPreview?.responses?.[0]?.pricing_plan_id ||
          null,
        responses: baseRuntimeFixtures.stageG?.promoPreview?.responses || []
      },
      referralSummary: {
        response: referralSummary || {
          product_key: "demo_cn_content",
          invite_code: null,
          share_preview: "",
          inviter_summary: "",
          invitee_summary: "",
          reward_rule_summary: []
        }
      },
      rewardSummary: {
        response: rewardSummary || {
          product_key: "demo_cn_content",
          ledger_preview: [],
          vip_days_total: 0,
          active_vip_days: 0,
          status_summary: "none"
        }
      },
      campaignLanding: {
        response: {
          ...(campaignLanding || {
            product_key: "demo_cn_content",
            campaign_id: null,
            campaign_key: null,
            title: "Campaign preview",
            subtitle: "",
            discount_label: null,
            eligibility_summary: [],
            cta_primary: "View offer",
            cta_secondary: "Later"
          }),
          subtitle: description || buildLabel
        }
      },
      profileBenefits: {
        response: {
          product_key: "demo_cn_content",
          subscription_status: "free",
          entitlement_status: "inactive",
          entitlement_badge: "Free Reader",
          grace_like_summary: `test free quota ${freeQuotaLimit}`,
          lifecycle_projection: [],
          quota: {
            remaining: 0,
            total: freeQuotaLimit,
            reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED"
          },
          saved_count: userContentState.items.filter((item) => item.bookmark_status === "saved").length,
          inbox_unread_count: inboxItems.filter((item) => item.status === "unread").length,
          reward_summary: {
            vip_days_total: rewardSummary?.vip_days_total ?? 0,
            active_rewards: rewardSummary?.active_vip_days ?? 0
          },
          benefit_summary: [
            description || buildLabel,
            `${records.length} 篇真实文章已导入`,
            `free quota test limit ${freeQuotaLimit}`
          ]
        }
      }
    }
  };
}
