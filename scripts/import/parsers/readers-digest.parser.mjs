import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  ensureDir,
  loadBaseRuntimeFixtures,
  loadStageGFallbackBundle,
  pipelinePaths,
  toRepoRelative,
  writeJson,
  writeText
} from "../lib/content-pipeline.mjs";
import { assertContentPackageGate, buildContentPackageGateReport } from "../lib/content-package-gate.mjs";
import { extractZipToDir as extractArchiveToDir } from "../lib/zip-utils.mjs";

const publicationName = "Reader's Digest";
const publicationId = "readers_digest";
const currentUserId = "user_local_stage_e0";

function removeEmptyParentDirs(startPath, stopPath) {
  let current = path.dirname(startPath);
  const normalizedStop = path.resolve(stopPath);
  while (current.startsWith(normalizedStop) && current !== normalizedStop) {
    if (!fs.existsSync(current)) {
      current = path.dirname(current);
      continue;
    }
    if (fs.readdirSync(current).length > 0) {
      break;
    }
    fs.rmSync(current, { recursive: true, force: true });
    current = path.dirname(current);
  }
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function toIssueIsoDate(label) {
  if (/^\d{8}$/.test(label)) {
    const month = label.slice(0, 2);
    const day = label.slice(2, 4);
    const year = label.slice(4);
    return `${year}-${month}-${day}`;
  }
  return "2025-12-11";
}

function contentHash(value) {
  return crypto.createHash("sha1").update(String(value || "")).digest("hex");
}

function hasChinese(value) {
  return /[\p{Script=Han}]/u.test(String(value || ""));
}

function hasLatin(value) {
  return /[A-Za-zÀ-ÿ]/.test(String(value || ""));
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/[📄🛡️🎯🧠🌟🚀]/gu, "")
    .trim();
}

function normalizeCompare(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”‘’'".,!?！？：:（）()\\-_/]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function extractZipToDir(targetZipPath, destinationPath) {
  ensureDir(path.dirname(destinationPath));
  return extractArchiveToDir(targetZipPath, destinationPath, "DATA1B_ZIP");
}

function extractField(line, fieldName) {
  const pattern = new RegExp(`【${fieldName}】[：:]\\*\\*\\s*(.+)$`);
  const match = String(line || "").match(pattern);
  return match ? stripMarkdown(match[1]) : "";
}

function parseTitleParts(rawTitle, tocRow = null) {
  const cleaned = stripMarkdown(rawTitle);
  const parts = cleaned.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  let title = "";
  let originalTitle = null;

  if (parts.length >= 2) {
    const chinesePart = parts.find((part) => hasChinese(part));
    const latinPart = parts.find((part) => hasLatin(part) && !hasChinese(part));
    title = chinesePart || parts[0];
    originalTitle = latinPart || parts.find((part) => part !== title) || null;
  } else {
    title = cleaned;
  }

  if (!hasChinese(title) && tocRow?.section_chinese_title) {
    title = tocRow.section_chinese_title;
  }
  if (!originalTitle && tocRow?.section_english_title) {
    originalTitle = tocRow.section_english_title;
  }

  return {
    title: title || tocRow?.section_chinese_title || cleaned,
    originalTitle: originalTitle || null
  };
}

function parseSectionBlock(rawText, marker, nextMarkers) {
  const startPattern = new RegExp(`^.*${marker}.*$`, "m");
  const startMatch = rawText.match(startPattern);
  if (!startMatch || typeof startMatch.index !== "number") {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const tail = rawText.slice(startIndex);
  let endIndex = tail.length;

  for (const nextMarker of nextMarkers) {
    const nextPattern = new RegExp(`^.*${nextMarker}.*$`, "m");
    const nextMatch = tail.match(nextPattern);
    if (nextMatch && typeof nextMatch.index === "number" && nextMatch.index < endIndex) {
      endIndex = nextMatch.index;
    }
  }

  return tail.slice(0, endIndex).trim();
}

function parseSingleArticle(rawText, entryPath, tocRow, issueLabel, warnings) {
  const lines = rawText.split("\n").map((line) => line.trim());
  const titleLine = lines.find((line) => line.includes("【文章标题】")) || "";
  const complianceLine = lines.find((line) => line.includes("【合规状态】")) || "";
  const titleParts = parseTitleParts(extractField(titleLine, "文章标题"), tocRow);
  const complianceStatus = extractField(complianceLine, "合规状态") || "未标注";
  const adultQuick = parseSectionBlock(rawText, "成人版 - 短版", ["成人版 - 长版", "少年版 - 短版", "少年版 - 长版"]);
  const adultDeep = parseSectionBlock(rawText, "成人版 - 长版", ["少年版 - 短版", "少年版 - 长版"]);
  const teenQuick = parseSectionBlock(rawText, "少年版 - 短版", ["少年版 - 长版"]);
  const teenDeep = parseSectionBlock(rawText, "少年版 - 长版", []);
  const fileName = path.basename(entryPath);
  const fileStem = fileName.replace(/\.md$/i, "");
  const articleNumberMatch = fileStem.match(/^(\d{2})\s+/);
  const articleNumber = articleNumberMatch ? Number(articleNumberMatch[1]) : null;

  if (tocRow) {
    const normalizedFileTitle = normalizeCompare(fileStem.replace(/^\d{2}\s+/, ""));
    const normalizedTocEnglish = normalizeCompare(tocRow.section_english_title);
    const normalizedTocChinese = normalizeCompare(tocRow.section_chinese_title);
    if (![normalizedTocEnglish, normalizedTocChinese].includes(normalizedFileTitle)) {
      warnings.push({
        type: "title_conflict",
        file_name: fileName,
        file_title_candidate: fileStem.replace(/^\d{2}\s+/, ""),
        toc_english_title: tocRow.section_english_title,
        toc_chinese_title: tocRow.section_chinese_title
      });
    }
  }

  return {
    file_name: fileName,
    article_number: articleNumber,
    article_slug: slugify(`${issueLabel}_${fileStem.replace(/^\d{2}\s+/, "")}`),
    title: titleParts.title,
    original_title: titleParts.originalTitle,
    compliance_status: complianceStatus,
    quick_30s: adultQuick,
    deep_3m: adultDeep,
    teen_quick_30s: teenQuick,
    teen_deep_3m: teenDeep,
    section_label: tocRow?.section_label || null,
    start_page: tocRow?.start_page || null,
    section_english_title: tocRow?.section_english_title || null,
    section_chinese_title: tocRow?.section_chinese_title || null,
    issue_date: toIssueIsoDate(issueLabel),
    source_path_in_zip: entryPath
  };
}

function parseAdultCombinedFile(rawText) {
  const [tocBlock] = rawText.split(/\n---\n/);
  const lines = tocBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows = lines.slice(1).map((line, index) => {
    const [sectionLabel, sectionEnglishTitle, sectionChineseTitle, startPageRaw] = splitCsvLine(line);
    return {
      order: index + 1,
      section_label: sectionLabel,
      section_english_title: sectionEnglishTitle,
      section_chinese_title: sectionChineseTitle,
      start_page: Number(startPageRaw)
    };
  });

  return {
    toc_rows: rows
  };
}

function buildNormalizedRecord(article, index, issueLabel, sourceZip, freeQuotaLimit) {
  const runtimePaywallState = index < freeQuotaLimit ? "free" : "preview_locked";
  const summary = article.quick_30s.split(/\n+/)[0].slice(0, 140);

  return {
    article_index: index + 1,
    article_id: `art_rd_${issueLabel}_${String(index + 1).padStart(3, "0")}`,
    article_uid: `real_rd_${issueLabel}_${String(index + 1).padStart(3, "0")}`,
    product_key: "demo_cn_content",
    publication_key: publicationId,
    publication_name: publicationName,
    issue_label: issueLabel,
    issue_date: article.issue_date,
    source_zip: sourceZip,
    source_file_name: article.file_name,
    title: article.title,
    original_title: article.original_title,
    summary,
    quick_30s: article.quick_30s,
    deep_3m: article.deep_3m,
    teen_quick_30s: article.teen_quick_30s,
    teen_deep_3m: article.teen_deep_3m,
    general_quick_30s: article.quick_30s,
    general_deep_3m: article.deep_3m,
    general_variant_derivation: "derived_from_adult_for_general_runtime_compat",
    audience_policy_key: "adult_to_general_compat_v1",
    compliance_status: article.compliance_status,
    section_label: article.section_label,
    section_key: slugify(article.section_label || "issue"),
    start_page: article.start_page,
    canonical_url: null,
    cover: null,
    author: null,
    tags: [article.section_label, `issue:${issueLabel}`].filter(Boolean),
    runtime_test_rule: {
      free_quota_limit: freeQuotaLimit,
      derived_paywall_state: runtimePaywallState,
      source: "derived_from_runtime_test_rule"
    },
    parse_sources: {
      title: "file_title",
      original_title: article.original_title ? "file_title_or_toc_fallback" : "toc_or_null",
      section_label: article.section_label ? "adult_merged_toc" : "missing",
      start_page: article.start_page ? "adult_merged_toc" : "missing"
    }
  };
}

function buildContentDetailResponses(records, publishAt) {
  const responses = {};

  records.forEach((record) => {
    const variants = [
      { audience: "teen", mode: "quick_30s", body: record.teen_quick_30s, sourceField: "teen_quick_30s" },
      { audience: "teen", mode: "deep_3m", body: record.teen_deep_3m, sourceField: "teen_deep_3m" },
      { audience: "general", mode: "quick_30s", body: record.general_quick_30s, sourceField: "general_quick_30s" },
      { audience: "general", mode: "deep_3m", body: record.general_deep_3m, sourceField: "general_deep_3m" },
      { audience: "adult", mode: "quick_30s", body: record.quick_30s, sourceField: "quick_30s" },
      { audience: "adult", mode: "deep_3m", body: record.deep_3m, sourceField: "deep_3m" }
    ];

    variants.forEach((variant) => {
      responses[`${record.article_id}|zh-CN|${variant.audience}|${variant.mode}`] = {
        article: {
          article_id: record.article_id,
          article_key: record.article_uid,
          title: record.title,
          original_title: record.original_title,
          summary: record.summary,
          publication_key: record.publication_key,
          publication_name: record.publication_name,
          section_label: record.section_label,
          start_page: record.start_page,
          canonical_url: record.canonical_url,
          cover: record.cover,
          author: record.author
        },
        resolved_variant: {
          article_variant_id: `var_${record.article_id}_${variant.audience}_${variant.mode}`,
          audience_segment: variant.audience,
          reading_mode: variant.mode,
          revision: 1,
          title: record.title,
          markdown_body: variant.body,
          content_hash: contentHash(variant.body),
          premium_tier: record.runtime_test_rule.derived_paywall_state === "preview_locked" ? "premium" : "free",
          publish_batch_id: `batch_${publicationId}_${record.issue_label}`,
          update_type: "new_publish",
          update_priority: 80,
          change_summary: `${record.issue_label} 真实样本导入`,
          notify_level: "default",
          is_breaking: false,
          available_from: publishAt,
          available_until: null,
          source_field: variant.sourceField
        },
        selection_reason: "exact_match",
        fallback_applied: false,
        unavailable_reason: null
      };
    });
  });

  return responses;
}

function buildRuntimeBundle(records, issueLabel, scenarioId, freeQuotaLimit, baseRuntimeFixtures, sourceZip) {
  const publishAt = `${toIssueIsoDate(issueLabel)}T09:00:00+08:00`;
  const updatedAt = `${toIssueIsoDate(issueLabel)}T12:11:25+08:00`;
  const surfaceStatus = baseRuntimeFixtures.surfaceStatus || [];
  const commercialOffer = baseRuntimeFixtures.stageG?.commercialOffer?.response || { available_plans: [] };
  const campaignLanding = baseRuntimeFixtures.stageG?.campaignLanding?.response || null;
  const referralSummary = baseRuntimeFixtures.stageG?.referralSummary?.response || null;
  const rewardSummary = baseRuntimeFixtures.stageG?.rewardSummary?.response || null;
  const bootstrapResponse = baseRuntimeFixtures.bootstrapConfig?.response || null;
  const experimentAssign = baseRuntimeFixtures.experimentAssign?.response || null;

  const discoveryCatalog = records.map((record, index) => ({
    article_id: record.article_id,
    article_key: record.article_uid,
    title: record.title,
    original_title: record.original_title,
    summary: record.summary,
    publication_id: `pub_${publicationId}`,
    publication_key: record.publication_key,
    publication_name: record.publication_name,
    tags: record.tags,
    section_label: record.section_label,
    section_key: record.section_key,
    start_page: record.start_page,
    canonical_url: record.canonical_url,
    cover: record.cover,
    author: record.author,
    available_modes: ["quick_30s", "deep_3m"],
    available_audiences: ["teen", "general", "adult"],
    updated_at: updatedAt,
    publish_batch_id: `batch_${publicationId}_${issueLabel}`,
    update_type: "new_publish",
    update_priority: 100 - index,
    change_summary: `${issueLabel} 真实样本导入`,
    notify_level: "default",
    is_breaking: false,
    available_from: publishAt,
    available_until: null,
    primary_reading_mode: "quick_30s",
    primary_audience: "general"
  }));

  const articleItems = records.map((record) => ({
    entity_type: "article",
    article_id: record.article_id,
    article_key: record.article_uid,
    publication_id: `pub_${publicationId}`,
    publication_key: record.publication_key,
    title: record.title,
    summary: record.summary,
    tags: record.tags,
    status: "active",
    updated_at: updatedAt
  }));

  const variantItems = records.flatMap((record) => [
    { article_variant_id: `var_${record.article_id}_general_quick_30s`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "general", reading_mode: "quick_30s", content_hash: contentHash(record.general_quick_30s) },
    { article_variant_id: `var_${record.article_id}_general_deep_3m`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "general", reading_mode: "deep_3m", content_hash: contentHash(record.general_deep_3m) },
    { article_variant_id: `var_${record.article_id}_teen_quick_30s`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "teen", reading_mode: "quick_30s", content_hash: contentHash(record.teen_quick_30s) },
    { article_variant_id: `var_${record.article_id}_teen_deep_3m`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "teen", reading_mode: "deep_3m", content_hash: contentHash(record.teen_deep_3m) },
    { article_variant_id: `var_${record.article_id}_adult_quick_30s`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "adult", reading_mode: "quick_30s", content_hash: contentHash(record.quick_30s) },
    { article_variant_id: `var_${record.article_id}_adult_deep_3m`, article_id: record.article_id, tags: record.tags, language: "zh-CN", audience_segment: "adult", reading_mode: "deep_3m", content_hash: contentHash(record.deep_3m) }
  ]).map((variant) => ({
    entity_type: "article_variant",
    publication_key: publicationId,
    publish_status: "published",
    publish_at: publishAt,
    revision: 1,
    publish_batch_id: `batch_${publicationId}_${issueLabel}`,
    update_type: "new_publish",
    update_priority: 80,
    change_summary: `${issueLabel} 真实样本导入`,
    notify_level: "default",
    is_breaking: false,
    available_from: publishAt,
    available_until: null,
    is_deleted: false,
    updated_at: updatedAt,
    ...variant
  }));

  const notificationInbox = {
    items: records.slice(0, 3).map((record, index) => ({
      _id: `notif_rd_${String(index + 1).padStart(2, "0")}`,
      product_key: "demo_cn_content",
      user_id: currentUserId,
      status: index === 0 ? "unread" : "read",
      source_type: index === 0 ? "publish_batch" : "follow_subject",
      body_preview: record.summary,
      change_summary: `${record.section_label || "本期更新"} · P.${record.start_page || "?"}`,
      action_target: record.article_id,
      publish_batch_id: `batch_${publicationId}_${issueLabel}`,
      created_at: updatedAt,
      updated_at: updatedAt
    })),
    inbox_last_seen_at: null
  };

  const userContentState = {
    items: [
      {
        _id: `ucs_${currentUserId}_${records[0].article_id}`,
        product_key: "demo_cn_content",
        user_id: currentUserId,
        article_id: records[0].article_id,
        reading_state: "in_progress",
        bookmark_status: "none",
        newness_state: "new",
        resume_progress_basis_points: 4200,
        last_opened_at: updatedAt,
        last_read_mode: "quick_30s",
        created_at: updatedAt,
        updated_at: updatedAt
      },
      {
        _id: `ucs_${currentUserId}_${records[1].article_id}`,
        product_key: "demo_cn_content",
        user_id: currentUserId,
        article_id: records[1].article_id,
        reading_state: "seen",
        bookmark_status: "saved",
        newness_state: "new",
        saved_at: updatedAt,
        created_at: updatedAt,
        updated_at: updatedAt
      }
    ],
    last_seen_publish_batch: `batch_${publicationId}_${issueLabel}`
  };

  const stageG = {
    commercialOffer: {
      response: {
        ...commercialOffer,
        quota_reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED",
        entitlement_reason: "REAL_CONTENT_TEST_RULE",
        audience_context_hint: `${publicationName} ${issueLabel} real-content pipeline`
      }
    },
    quotaStatus: {
      response: {
        product_key: "demo_cn_content",
        free_quota_total: freeQuotaLimit,
        free_quota_used: freeQuotaLimit,
        quota_remaining: 0,
        paywall_triggered: true,
        reset_at: `${toIssueIsoDate(issueLabel)}T23:59:59+08:00`,
        reset_timezone: "Asia/Shanghai",
        quota_reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED",
        reset_hint: "当前为 DATA1B 多 zip replayable pipeline 测试规则。"
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
        subtitle: `当前 scenario 承载 ${publicationName} ${issueLabel} 真实样本。`
      }
    },
    profileBenefits: {
      response: {
        product_key: "demo_cn_content",
        subscription_status: "free",
        entitlement_status: "inactive",
        entitlement_badge: "Free Reader",
        grace_like_summary: `DATA1B pipeline 使用总量阈值 ${freeQuotaLimit} 做 paywall 测试。`,
        lifecycle_projection: [],
        quota: {
          remaining: 0,
          total: freeQuotaLimit,
          reason: "REAL_CONTENT_TEST_FREE_QUOTA_REACHED"
        },
        saved_count: 1,
        inbox_unread_count: 1,
        reward_summary: {
          vip_days_total: rewardSummary?.vip_days_total ?? 0,
          active_rewards: rewardSummary?.active_vip_days ?? 0
        },
        benefit_summary: [
          `${publicationName} ${issueLabel}`,
          "15 篇真实文章已导入",
          `free quota test limit ${freeQuotaLimit}`
        ]
      }
    }
  };

  return {
    metadata: {
      exported_at: new Date().toISOString(),
      canonical_source: `data/real-content/readers-digest/${issueLabel} + ${sourceZip}`,
      product_key: "demo_cn_content",
      scenario_id: scenarioId,
      runtime_now: updatedAt,
      source_kind: "real_content_pilot",
      pipeline_stage: "stage-data1b-v1",
      parser_profile: "readers_digest_v1",
      publication_key: publicationId,
      issue_label: issueLabel,
      free_quota_limit: freeQuotaLimit
    },
    surfaceStatus,
    bootstrapConfig: {
      response: {
        ...(bootstrapResponse || {
          product_key: "demo_cn_content",
          config_source: "real_content_pipeline",
          timezone: "Asia/Shanghai",
          money_unit: "fen",
          discount_canonical: "price_multiplier_basis_points",
          reward_canonical: "vip_days",
          product: {
            product_key: "demo_cn_content",
            product_id: "prod_demo_cn_content",
            display_name: "Demo CN Content",
            default_language: "zh-CN",
            active_status: "active"
          },
          feature_flags: [],
          experiments: []
        }),
        config_source: "real_content_pipeline"
      }
    },
    contentSyncDelta: {
      response: {
        server_cursor: `${updatedAt}|${variantItems.at(-1)?.article_variant_id || "data1b_empty"}`,
        has_more: false,
        items: articleItems.concat(variantItems),
        tombstones: []
      }
    },
    contentDetail: {
      responses: buildContentDetailResponses(records, publishAt)
    },
    entitlementSnapshot: {
      response: {
        product_key: "demo_cn_content",
        subject_id: "inst_data1b_reader",
        access_state: "denied",
        decision_source: "real_content_pipeline_runtime_rule",
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
        installation_id: "inst_data1b_reader",
        experiment_id: null,
        experiment_key: null,
        assignment_version: 0,
        bucket_key: null,
        assignment_source: "real_content_pipeline",
        cache_ttl_seconds: 3600
      }
    },
    discoveryCatalog: {
      items: discoveryCatalog
    },
    followCatalog: {
      publications: [
        {
          publication_id: `pub_${publicationId}`,
          publication_key: publicationId,
          display_name: publicationName,
          description: `${publicationName} ${issueLabel} replayable scenario`
        }
      ],
      tags: Array.from(new Set(records.map((record) => record.section_label).filter(Boolean))).map((sectionLabel) => ({
        tag_key: sectionLabel,
        display_name: sectionLabel
      }))
    },
    publishBatches: {
      items: [
        {
          _id: `batch_${publicationId}_${issueLabel}`,
          product_key: "demo_cn_content",
          publish_batch_key: `${publicationId}_${issueLabel}`,
          title: `${publicationName} ${issueLabel}`,
          description: "多 zip 可回放内容 pipeline 批次",
          publication_key: publicationId,
          status: "published",
          created_at: publishAt,
          updated_at: updatedAt
        }
      ]
    },
    userFollows: {
      items: [
        {
          _id: `follow_publication_${publicationId}_${currentUserId}`,
          product_key: "demo_cn_content",
          user_id: currentUserId,
          subject_type: "publication",
          subject_key: publicationId,
          status: "active",
          notify_level: "immediate",
          source_surface: "follow_catalog",
          created_at: updatedAt,
          updated_at: updatedAt
        }
      ]
    },
    notificationPrefs: {
      response: {
        _id: `unp_${currentUserId}`,
        product_key: "demo_cn_content",
        user_id: currentUserId,
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
        created_at: updatedAt,
        updated_at: updatedAt
      }
    },
    notificationInbox,
    userContentState,
    notificationDeliveries: {
      items: []
    },
    stageG
  };
}

function resolveIssueLabel({ zipPath, inputDir, issueLabel }) {
  if (issueLabel) {
    return issueLabel;
  }
  const sourceName = path.basename(zipPath || inputDir || "");
  const match = sourceName.match(/(\d{8})/);
  if (match) {
    return match[1];
  }
  throw new Error("DATA1B_RD_ISSUE_LABEL_UNRESOLVED");
}

function resolveSourceZip(zipPath, issueLabel) {
  return zipPath ? path.basename(zipPath) : `Reader's Digest-${issueLabel}.zip`;
}

function resolveScenarioId(issueLabel, scenarioId) {
  return scenarioId || `data1a_readers_digest_${issueLabel}`;
}

function resolveInputDirectory({ zipPath, inputDir, scenarioId }) {
  if (inputDir) {
    return inputDir;
  }

  const extractedRoot = path.join(pipelinePaths.stageData1bOutputRoot, "extracted", scenarioId);
  if (fs.existsSync(extractedRoot)) {
    fs.rmSync(extractedRoot, { recursive: true, force: true });
  }
  ensureDir(extractedRoot);
  extractZipToDir(zipPath, extractedRoot);
  const issueFolders = fs.readdirSync(extractedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (issueFolders.length === 1) {
    return path.join(extractedRoot, issueFolders[0].name);
  }
  return extractedRoot;
}

export function canHandleReadersDigestSource({ zipPath, inputDir }) {
  const sourcePath = String(zipPath || inputDir || "").toLowerCase();
  const sourceName = path.basename(zipPath || inputDir || "").toLowerCase();
  return (
    (sourceName.includes("reader") && sourceName.includes("digest")) ||
    (sourcePath.includes("readers-digest") || sourcePath.includes("reader's digest"))
  );
}

export async function importReadersDigestSource(options = {}) {
  const issueLabel = resolveIssueLabel(options);
  const sourceZip = resolveSourceZip(options.zipPath, issueLabel);
  const scenarioId = resolveScenarioId(issueLabel, options.scenarioId);
  const freeQuotaLimit = Number(options.freeQuotaLimit || 8);
  const issueRoot = path.join(pipelinePaths.dataRoot, "readers-digest", issueLabel);
  const rawRoot = path.join(issueRoot, "raw");
  const normalizedRoot = path.join(issueRoot, "normalized");
  const dataManifestPath = path.join(issueRoot, "manifest.json");
  const inputDirectory = resolveInputDirectory({ zipPath: options.zipPath, inputDir: options.inputDir, scenarioId });

  ensureDir(rawRoot);
  ensureDir(normalizedRoot);
  ensureDir(pipelinePaths.runtimeScenarioRoot);
  ensureDir(pipelinePaths.stageData1bOutputRoot);

  const extractedEntries = fs.readdirSync(inputDirectory).sort();
  const articleEntries = extractedEntries.filter((entry) => /^\d{2}\s+.*\.md$/i.test(entry)).sort();
  const adultMergedEntry = extractedEntries.find((entry) => /_adult\.md$/i.test(entry));

  if (articleEntries.length !== 15) {
    throw new Error(`DATA1B_RD_SINGLE_ARTICLE_COUNT_UNEXPECTED:${articleEntries.length}`);
  }
  if (!adultMergedEntry) {
    throw new Error("DATA1B_RD_ADULT_MERGED_FILE_MISSING");
  }

  const warnings = [];
  const adultMergedRaw = fs.readFileSync(path.join(inputDirectory, adultMergedEntry), "utf8").replace(/\r\n/g, "\n");
  writeText(path.join(rawRoot, adultMergedEntry), adultMergedRaw);
  const adultMerged = parseAdultCombinedFile(adultMergedRaw);

  const parsedArticles = articleEntries.map((entryName, index) => {
    const rawText = fs.readFileSync(path.join(inputDirectory, entryName), "utf8").replace(/\r\n/g, "\n");
    writeText(path.join(rawRoot, entryName), rawText);
    return parseSingleArticle(rawText, entryName, adultMerged.toc_rows[index] || null, issueLabel, warnings);
  });

  const normalizedRecords = parsedArticles.map((article, index) =>
    buildNormalizedRecord(article, index, issueLabel, sourceZip, freeQuotaLimit)
  );
  normalizedRecords.forEach((record, index) => {
    writeJson(path.join(normalizedRoot, `article-${String(index + 1).padStart(3, "0")}.json`), record);
  });

  const manifest = {
    publication_name: publicationName,
    publication_key: publicationId,
    issue_label: issueLabel,
    source_zip: sourceZip,
    imported_article_count: normalizedRecords.length,
    skipped_assets: [adultMergedEntry],
    parser_profile: "readers_digest_v1",
    parse_rule_version: "data1b-readers-digest-v1",
    runtime_test_rule: {
      free_quota_limit: freeQuotaLimit,
      source: "derived_from_runtime_test_rule"
    },
    status: "active",
    articles: normalizedRecords.map((record) => ({
      article_id: record.article_id,
      title: record.title,
      original_title: record.original_title,
      section_label: record.section_label,
      start_page: record.start_page,
      source_file_name: record.source_file_name
    }))
  };

  const parseReport = {
    status: "ok",
    parser_profile: "readers_digest_v1",
    publication_name: publicationName,
    issue_label: issueLabel,
    source_zip_path: options.zipPath || null,
    source_input_dir: toRepoRelative(inputDirectory),
    single_article_md_count: articleEntries.length,
    adult_merged_file: adultMergedEntry,
    adult_merged_imported_as_article: false,
    warnings,
    title_conflict_count: warnings.filter((warning) => warning.type === "title_conflict").length,
    filename_anomalies: warnings.filter((warning) => warning.type === "filename_anomaly"),
    missing_block_records: normalizedRecords
      .filter((record) => !record.quick_30s || !record.deep_3m || !record.teen_quick_30s || !record.teen_deep_3m)
      .map((record) => ({
        article_id: record.article_id,
        title: record.title
      }))
  };
  const gateReport = buildContentPackageGateReport({
    records: normalizedRecords,
    route: "content_batch",
    sourcePack: sourceZip,
    publicationId,
    issueLabel,
    parserSignals: {
      title_conflict_count: parseReport.title_conflict_count,
      missing_block_records: parseReport.missing_block_records
    }
  });
  writeJson(path.join(pipelinePaths.stageData1bOutputRoot, `${scenarioId}.validation-report.json`), gateReport);
  try {
    assertContentPackageGate(gateReport, "内容包未通过导入门禁，已阻止导入");
  } catch (error) {
    fs.rmSync(issueRoot, { recursive: true, force: true });
    removeEmptyParentDirs(issueRoot, pipelinePaths.dataRoot);
    fs.rmSync(path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`), { force: true });
    throw error;
  }

  const normalizedCatalog = {
    publication_name: publicationName,
    publication_key: publicationId,
    issue_label: issueLabel,
    article_count: normalizedRecords.length,
    article_ids: normalizedRecords.map((record) => record.article_id),
    sections: Array.from(new Set(normalizedRecords.map((record) => record.section_label).filter(Boolean))),
    sample_titles: normalizedRecords.slice(0, 5).map((record) => record.title)
  };

  const baseRuntimeFixtures = loadStageGFallbackBundle() || await loadBaseRuntimeFixtures();
  const runtimeBundle = buildRuntimeBundle(normalizedRecords, issueLabel, scenarioId, freeQuotaLimit, baseRuntimeFixtures, sourceZip);
  const runtimeBundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`);

  writeJson(dataManifestPath, manifest);
  writeJson(runtimeBundlePath, runtimeBundle);

  return {
    parserProfile: "readers_digest_v1",
    publicationRecord: {
      id: publicationId,
      display_name: publicationName,
      locale: "zh-CN",
      status: "active",
      parser_profiles: ["readers_digest_v1"]
    },
    issueRecord: {
      issue_id: `${publicationId}__${issueLabel}`,
      publication_id: publicationId,
      issue_label: issueLabel,
      source_zip: sourceZip,
      manifest_path: toRepoRelative(dataManifestPath),
      article_count: normalizedRecords.length,
      parser_profile: "readers_digest_v1",
      import_warnings_count: warnings.length,
      status: "active"
    },
    scenarioRecord: {
      scenario_id: scenarioId,
      scenario_type: "real_content",
      source_kind: runtimeBundle.metadata.source_kind,
      bundle_path: toRepoRelative(runtimeBundlePath),
      included_publications: [publicationId],
      included_issues: [{ publication_id: publicationId, issue_label: issueLabel }],
      paywall_test_rule: {
        rule_key: "global_free_quota_limit",
        free_quota_limit: freeQuotaLimit
      },
      parser_profiles: ["readers_digest_v1"],
      build_label: `${publicationId}_${issueLabel}`,
      enabled_at: new Date().toISOString(),
      status: "active",
      imported_article_count: normalizedRecords.length
    },
    manifest,
    parseReport,
    normalizedCatalog,
    runtimeBundlePath,
    issueRoot
  };
}
