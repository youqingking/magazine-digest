import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..", "..");
export const paths = {
  scenarioRoot: path.join(repoRoot, "fixtures", "test-inputs", "scenarios"),
  publicationFile: path.join(repoRoot, "fixtures", "test-inputs", "publications", "publications.json"),
  manifestFile: path.join(repoRoot, "fixtures", "test-inputs", "manifests", "test-pack.manifest.json"),
  scenarioIndexFile: path.join(repoRoot, "fixtures", "test-inputs", "manifests", "scenario-index.json"),
  outputRoot: path.join(repoRoot, "output", "test-input-pack"),
  outputRuntimeRoot: path.join(repoRoot, "output", "test-input-pack", "runtime"),
  outputReportsRoot: path.join(repoRoot, "output", "test-input-pack", "reports"),
  mobileScenarioRoot: path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios"),
  mobileCurrentRoot: path.join(repoRoot, "mobile", "fixtures", "runtime", "current")
};

const audiences = ["teen", "general", "adult"];
const readingModes = ["quick_30s", "deep_3m"];

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    trimmed.startsWith("[") ||
    trimmed.startsWith("{") ||
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+$/.test(trimmed)
  ) {
    return JSON.parse(trimmed);
  }
  return trimmed;
}

function parseMarkdownVariant(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const endIndex = raw.indexOf("\n---\n", 4);
  if (!raw.startsWith("---\n") || endIndex === -1) {
    throw new Error(`INVALID_FRONTMATTER:${filePath}`);
  }

  const frontmatter = {};
  raw
    .slice(4, endIndex)
    .split("\n")
    .forEach((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) {
        return;
      }
      frontmatter[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
    });

  return {
    filePath,
    fileName: path.basename(filePath),
    frontmatter,
    body: raw.slice(endIndex + 5).trim()
  };
}

function stripMarkdown(value) {
  return String(value).replace(/[#>*`_\-\[\]\(\)\r\n]/g, "").trim();
}

function compareByUpdatedAt(left, right) {
  if (left.updated_at === right.updated_at) {
    return left._id.localeCompare(right._id);
  }
  return left.updated_at.localeCompare(right.updated_at);
}

function getAudienceOrder(audienceSegment) {
  if (audienceSegment === "teen") {
    return ["teen", "general"];
  }
  if (audienceSegment === "adult") {
    return ["adult", "general"];
  }
  return ["general"];
}

function isReadableVariant(variant, runtimeNow) {
  if (variant.is_deleted) {
    return false;
  }
  if (variant.available_from && variant.available_from > runtimeNow) {
    return false;
  }
  if (variant.available_until && variant.available_until < runtimeNow) {
    return false;
  }
  if (variant.publish_status === "published") {
    return true;
  }
  return variant.publish_status === "scheduled" && variant.publish_at <= runtimeNow;
}

function makeContentHash(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

function buildVariantRecord(parsedVariant) {
  const meta = parsedVariant.frontmatter;
  const body = parsedVariant.body.trim();
  return {
    _id: meta.article_variant_id,
    article_id: meta.article_id,
    product_key: meta.product_key,
    language: meta.language,
    audience_segment: meta.audience_segment,
    reading_mode: meta.reading_mode,
    revision: Number(meta.revision),
    publish_status: meta.publish_status,
    publish_at: meta.publish_at,
    updated_at: meta.updated_at || meta.publish_at,
    title: meta.title,
    publication_key: meta.publication_key,
    tags: meta.tags || [],
    markdown_body: body,
    content_hash: makeContentHash(body),
    fallback_policy: meta.fallback_policy || "allow_same_audience_only",
    source_article_uid: meta.article_uid,
    external_content_uid: meta.article_variant_id,
    premium_tier: meta.premium_tier,
    publish_batch_id: meta.publish_batch_id || null,
    update_type: meta.update_type || null,
    update_priority: meta.update_priority || null,
    change_summary: meta.change_summary || null,
    notify_level: meta.notify_level || null,
    is_breaking: Boolean(meta.is_breaking),
    available_from: meta.available_from || meta.publish_at,
    available_until: meta.available_until || null,
    is_deleted: Boolean(meta.is_deleted)
  };
}

function buildArticleRecord(article, publications, productKey) {
  const publication = publications.find((item) => item.publication_key === article.publication_key) || null;
  return {
    _id: article.article_id,
    product_key: productKey,
    publication_id: publication?._id ?? null,
    publication_key: article.publication_key,
    article_key: article.article_key,
    title: article.title,
    summary: article.summary,
    tags: article.tags || [],
    status: article.status,
    created_at: article.created_at,
    updated_at: article.updated_at
  };
}

function resolveVariant(articleRecord, variantRecords, request, runtimeNow) {
  const eligible = variantRecords
    .filter(
      (variant) =>
        variant.article_id === request.article_id &&
        variant.language === request.language &&
        variant.reading_mode === request.reading_mode &&
        isReadableVariant(variant, runtimeNow)
    )
    .sort((left, right) => right.revision - left.revision);
  const resolved = getAudienceOrder(request.audience_segment)
    .map((segment) => eligible.find((variant) => variant.audience_segment === segment) || null)
    .find(Boolean);

  if (!resolved) {
    return {
      article: articleRecord
        ? {
            article_id: articleRecord._id,
            article_key: articleRecord.article_key,
            title: articleRecord.title,
            summary: articleRecord.summary
          }
        : null,
      resolved_variant: null,
      selection_reason: null,
      fallback_applied: false,
      unavailable_reason: "CONTENT_UNAVAILABLE_SAFE_FALLBACK_MISSING"
    };
  }

  return {
    article: {
      article_id: articleRecord._id,
      article_key: articleRecord.article_key,
      title: articleRecord.title,
      summary: articleRecord.summary
    },
      resolved_variant: {
        article_variant_id: resolved._id,
        audience_segment: resolved.audience_segment,
        reading_mode: resolved.reading_mode,
        revision: resolved.revision,
        title: resolved.title,
        markdown_body: resolved.markdown_body,
        content_hash: resolved.content_hash,
        premium_tier: resolved.premium_tier,
        publish_batch_id: resolved.publish_batch_id,
        update_type: resolved.update_type,
        update_priority: resolved.update_priority,
        change_summary: resolved.change_summary,
        notify_level: resolved.notify_level,
        is_breaking: resolved.is_breaking,
        available_from: resolved.available_from,
        available_until: resolved.available_until
      },
    selection_reason: resolved.audience_segment === request.audience_segment ? "exact_match" : "safe_fallback",
    fallback_applied: resolved.audience_segment !== request.audience_segment,
    unavailable_reason: null
  };
}

function computePricingPreview(manifest, planId, promoCode) {
  const plan = manifest.pricing_plans.find((item) => item._id === planId);
  if (!plan) {
    throw new Error(`UNKNOWN_PLAN:${planId}`);
  }
  let campaign = null;
  let multiplier = 10000;
  if (promoCode) {
    const code = manifest.promo_codes.find((item) => item.code === promoCode);
    if (code) {
      campaign = manifest.promo_campaigns.find((item) => item._id === code.campaign_id) || null;
      multiplier = campaign?.price_multiplier_basis_points || 10000;
    }
  }
  const discounted = Math.floor((plan.price_fen * multiplier) / 10000);
  const finalAmount = Math.max(discounted, plan.price_floor_fen);
  return {
    product_key: manifest.product.product_key,
    pricing_plan_id: plan._id,
    original_amount_fen: plan.price_fen,
    final_amount_fen: finalAmount,
    price_floor_fen: plan.price_floor_fen,
    applied_price_multiplier_basis_points: multiplier,
    floor_applied: finalAmount !== discounted,
    campaign_id: campaign?._id || null,
    denial_reason: null
  };
}

function buildCommercialPlans(manifest, commercialOfferConfig = {}) {
  const activeCampaign = commercialOfferConfig.active_campaign_adjustment || null;
  const multiplier = activeCampaign?.price_multiplier_basis_points || 10000;

  return manifest.pricing_plans
    .filter((item) => item.status === "active")
    .map((plan) => {
      const discounted = Math.floor((plan.price_fen * multiplier) / 10000);
      const displayAmount = Math.max(discounted, plan.price_floor_fen);

      return {
        pricing_plan_id: plan._id,
        plan_key: plan.plan_key,
        display_name: plan.display_name,
        billing_cycle: plan.billing_cycle,
        original_amount_fen: plan.price_fen,
        display_amount_fen: displayAmount,
        price_floor_fen: plan.price_floor_fen,
        floor_applied: displayAmount !== discounted,
        currency: plan.currency,
        is_default_display: Boolean(plan.is_default_display)
      };
    });
}

function buildStageGSurfaces(manifest, scenario, selectedExperiment) {
  const runtimeData = scenario.meta.runtime || {};
  const quotaConfig = runtimeData.quota_status || {};
  const rewardConfig = runtimeData.reward_summary || {};
  const profileConfig = runtimeData.profile_benefits || {};
  const commercialConfig = runtimeData.commercial_offer || {};
  const referralConfig = runtimeData.referral_summary || {};
  const promoConfig = runtimeData.promo_preview || {};
  const campaignConfig = runtimeData.campaign_landing || {};

  return {
    commercialOffer: {
      response: {
        product_key: manifest.product.product_key,
        available_plans: buildCommercialPlans(manifest, commercialConfig),
        active_campaign_adjustment: commercialConfig.active_campaign_adjustment || null,
        experiment_offer_hint: commercialConfig.experiment_offer_hint || (selectedExperiment
          ? {
              experiment_id: selectedExperiment._id,
              bucket_key: selectedExperiment.bucket_definitions?.[0]?.bucket_key || null
            }
          : null),
        promo_input_capability: commercialConfig.promo_input_capability || {
          enabled: true,
          preview_only: true
        },
        floor_guard_explanation: commercialConfig.floor_guard_explanation || "Display preview still obeys canonical floor guard.",
        quota_reason: commercialConfig.quota_reason || quotaConfig.quota_reason || null,
        entitlement_reason: commercialConfig.entitlement_reason || runtimeData.entitlement_snapshot?.denial_reason || null,
        audience_context_hint: commercialConfig.audience_context_hint || null
      }
    },
    quotaStatus: {
      response: {
        product_key: manifest.product.product_key,
        free_quota_total: quotaConfig.free_quota_total ?? 0,
        free_quota_used: quotaConfig.free_quota_used ?? 0,
        quota_remaining: quotaConfig.quota_remaining ?? 0,
        paywall_triggered: Boolean(quotaConfig.paywall_triggered),
        reset_at: quotaConfig.reset_at || null,
        reset_timezone: quotaConfig.reset_timezone || manifest.defaults.timezone,
        quota_reason: quotaConfig.quota_reason || null,
        reset_hint: quotaConfig.reset_hint || null
      }
    },
    promoPreview: {
      default_plan_id: promoConfig.default_plan_id || null,
      responses: promoConfig.responses || []
    },
    referralSummary: {
      response: {
        product_key: manifest.product.product_key,
        invite_code: referralConfig.invite_code || null,
        share_preview: referralConfig.share_preview || "",
        inviter_summary: referralConfig.inviter_summary || "",
        invitee_summary: referralConfig.invitee_summary || "",
        reward_rule_summary: referralConfig.reward_rule_summary || []
      }
    },
    rewardSummary: {
      response: {
        product_key: manifest.product.product_key,
        ledger_preview: rewardConfig.ledger_preview || [],
        vip_days_total: rewardConfig.vip_days_total ?? 0,
        active_vip_days: rewardConfig.active_vip_days ?? 0,
        status_summary: rewardConfig.status_summary || "none"
      }
    },
    campaignLanding: {
      response: {
        product_key: manifest.product.product_key,
        campaign_id: campaignConfig.campaign_id || null,
        campaign_key: campaignConfig.campaign_key || null,
        title: campaignConfig.title || "Campaign preview",
        subtitle: campaignConfig.subtitle || "Display-only campaign landing placeholder.",
        discount_label: campaignConfig.discount_label || null,
        eligibility_summary: campaignConfig.eligibility_summary || [],
        cta_primary: campaignConfig.cta_primary || "View offer",
        cta_secondary: campaignConfig.cta_secondary || "Later"
      }
    },
    profileBenefits: {
      response: {
        product_key: manifest.product.product_key,
        subscription_status: profileConfig.subscription_status || "free",
        entitlement_status: profileConfig.entitlement_status || "inactive",
        entitlement_badge: profileConfig.entitlement_badge || "Free Reader",
        grace_like_summary: profileConfig.grace_like_summary || null,
        lifecycle_projection: profileConfig.lifecycle_projection || [],
        quota: profileConfig.quota || {
          remaining: quotaConfig.quota_remaining ?? 0,
          total: quotaConfig.free_quota_total ?? 0,
          reason: quotaConfig.quota_reason || null
        },
        saved_count: profileConfig.saved_count ?? 0,
        inbox_unread_count: profileConfig.inbox_unread_count ?? 0,
        reward_summary: profileConfig.reward_summary || {
          vip_days_total: rewardConfig.vip_days_total ?? 0,
          active_rewards: (rewardConfig.ledger_preview || []).filter((item) => item.status === "granted").length
        },
        benefit_summary: profileConfig.benefit_summary || []
      }
    }
  };
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

export function loadCatalog() {
  const manifest = readJson(paths.manifestFile);
  const publications = readJson(paths.publicationFile);
  const scenarioIndex = readJson(paths.scenarioIndexFile);
  const scenarios = fs
    .readdirSync(paths.scenarioRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((scenarioId) => {
      const scenarioDir = path.join(paths.scenarioRoot, scenarioId);
      return {
        directory: scenarioDir,
        meta: readJson(path.join(scenarioDir, "scenario.meta.json")),
        expectedOutcomes: readJson(path.join(scenarioDir, "expected-outcomes.json")),
        variants: fs
          .readdirSync(scenarioDir)
          .filter((fileName) => fileName.endsWith(".md"))
          .sort()
          .map((fileName) => parseMarkdownVariant(path.join(scenarioDir, fileName)))
      };
    });
  return { manifest, publications, scenarioIndex, scenarios };
}

function validateScenarioSpecificRules(catalog, errors) {
  const variantsByScenario = new Map(catalog.scenarios.map((scenario) => [scenario.meta.scenario_id, scenario.variants]));
  const metaByScenario = new Map(catalog.scenarios.map((scenario) => [scenario.meta.scenario_id, scenario.meta]));
  const hasVariant = (scenarioId, predicate) => (variantsByScenario.get(scenarioId) || []).some(predicate);

  [["teen", "quick_30s"], ["teen", "deep_3m"], ["adult", "quick_30s"], ["adult", "deep_3m"]].forEach(([audience, mode]) => {
    assert(hasVariant("s01_normal_full_matrix", (item) => item.frontmatter.audience_segment === audience && item.frontmatter.reading_mode === mode), `s01 missing ${audience}/${mode}`, errors);
  });
  assert(!(variantsByScenario.get("s02_general_fallback") || []).some((item) => item.frontmatter.audience_segment === "teen"), "s02 must not contain teen variants", errors);
  assert((variantsByScenario.get("s03_teen_unavailable") || []).every((item) => item.frontmatter.audience_segment === "adult"), "s03 must be adult-only", errors);
  const s04Languages = new Set((variantsByScenario.get("s04_multilingual") || []).map((item) => item.frontmatter.language));
  assert(s04Languages.has("zh-CN") && s04Languages.has("en"), "s04 must contain zh-CN and en", errors);
  const s05Revisions = new Set((variantsByScenario.get("s05_revision_update") || []).map((item) => Number(item.frontmatter.revision)));
  assert(s05Revisions.has(1) && s05Revisions.has(2), "s05 must contain revision 1 and 2", errors);
  assert(((metaByScenario.get("s06_tombstone_and_unpublish")?.runtime?.sync?.tombstones) || []).length >= 1, "s06 must contain tombstones", errors);
  assert(hasVariant("s07_premium_paywall", (item) => item.frontmatter.premium_tier === "premium"), "s07 must contain premium content", errors);
  assert(Boolean(metaByScenario.get("s08_experiment_pricing_preview")?.runtime?.experiment_assign?.bucket_key), "s08 must define an experiment bucket", errors);
  assert(((metaByScenario.get("s08_experiment_pricing_preview")?.runtime?.pricing_preview?.promo_codes) || []).length >= 1, "s08 must define preview promo codes", errors);
  assert(Boolean(metaByScenario.get("s09_cache_offline_fallback")?.runtime?.entitlement_snapshot), "s09 must define cacheable entitlement input", errors);
  assert(new Set(metaByScenario.get("s10_multi_publication_feed")?.publications || []).size >= 2, "s10 must contain multiple publications", errors);
  assert((metaByScenario.get("s10_multi_publication_feed")?.article_ids || []).length >= 3, "s10 must contain at least 3 articles", errors);
  assert(((metaByScenario.get("s11_new_publish_batch")?.runtime?.publish_batches) || []).length >= 1, "s11 must define publish batch fixtures", errors);
  assert(hasVariant("s11_new_publish_batch", (item) => item.frontmatter.update_type === "new_publish"), "s11 must contain new_publish variants", errors);
  assert(((metaByScenario.get("s12_followed_topic_alert")?.runtime?.user_follows) || []).length >= 1, "s12 must define follow fixtures", errors);
  assert(((metaByScenario.get("s12_followed_topic_alert")?.runtime?.notification_inbox) || []).some((item) => item.source_type === "follow_subject"), "s12 must define follow inbox items", errors);
  assert(((metaByScenario.get("s13_inbox_digest")?.runtime?.notification_inbox) || []).some((item) => item.source_type === "digest"), "s13 must define digest inbox items", errors);
  assert(hasVariant("s13_inbox_digest", (item) => item.frontmatter.update_type === "highlight_refresh"), "s13 must contain digest-eligible refresh variants", errors);
  assert(hasVariant("s14_revision_highlight", (item) => Number(item.frontmatter.revision) === 2 && item.frontmatter.update_type === "revision"), "s14 must contain a revision highlight variant", errors);
  assert(((metaByScenario.get("s14_revision_highlight")?.runtime?.user_content_state) || []).some((item) => item.reading_state === "in_progress"), "s14 must preserve continue reading state", errors);
  assert(((metaByScenario.get("s15_quiet_hours_and_dedupe")?.runtime?.notification_deliveries) || []).length >= 2, "s15 must define delivery suppression fixtures", errors);
  assert(Boolean(metaByScenario.get("s15_quiet_hours_and_dedupe")?.runtime?.user_notification_prefs?.quiet_hours_enabled), "s15 must enable quiet hours", errors);
  assert(Boolean(metaByScenario.get("s16_quota_exhausted_paywall")?.runtime?.quota_status?.paywall_triggered), "s16 must trigger paywall via quota_status", errors);
  assert(Boolean(metaByScenario.get("s16_quota_exhausted_paywall")?.runtime?.commercial_offer?.quota_reason), "s16 must define commercial offer quota reason", errors);
  assert(Boolean(metaByScenario.get("s17_campaign_discount_offer")?.runtime?.campaign_landing?.campaign_id), "s17 must define campaign landing", errors);
  assert(Boolean(metaByScenario.get("s17_campaign_discount_offer")?.runtime?.commercial_offer?.active_campaign_adjustment?.campaign_id), "s17 must define campaign adjustment", errors);
  assert(((metaByScenario.get("s18_promo_code_apply_preview")?.runtime?.promo_preview?.responses) || []).length >= 4, "s18 must define promo preview responses", errors);
  assert(((metaByScenario.get("s18_promo_code_apply_preview")?.runtime?.promo_preview?.responses) || []).some((item) => item.status === "floor_limited"), "s18 must include floor_limited preview", errors);
  assert(Boolean(metaByScenario.get("s19_referral_reward_preview")?.runtime?.referral_summary?.invite_code), "s19 must define invite code", errors);
  assert(((metaByScenario.get("s19_referral_reward_preview")?.runtime?.reward_summary?.ledger_preview) || []).length >= 1, "s19 must define reward summary ledger preview", errors);
  assert(Boolean(metaByScenario.get("s20_active_entitlement_profile")?.runtime?.profile_benefits?.subscription_status), "s20 must define profile benefit subscription status", errors);
  assert(((metaByScenario.get("s20_active_entitlement_profile")?.business_flow_aliases) || []).some((item) => item.alias_id === "b08_order_idempotency_and_webhook_replay"), "s20 must retain b08 risk asset alias", errors);
  assert(((metaByScenario.get("s20_active_entitlement_profile")?.business_flow_aliases) || []).some((item) => item.alias_id === "b09_event_dedup_and_metrics_rollup"), "s20 must retain b09 risk asset alias", errors);
  assert(((metaByScenario.get("s20_active_entitlement_profile")?.business_flow_aliases) || []).some((item) => item.alias_id === "b10_admin_sensitive_change_audit"), "s20 must retain b10 risk asset alias", errors);
}

export function validateCatalog(catalog = loadCatalog()) {
  const errors = [];
  const publicationKeys = new Set(catalog.publications.map((item) => item.publication_key));
  const scenarioIds = catalog.scenarios.map((item) => item.meta.scenario_id);
  const markdownCount = catalog.scenarios.reduce((total, scenario) => total + scenario.variants.length, 0);
  assert(catalog.scenarios.length === 20, "Stage X must contain exactly 20 scenario families", errors);
  assert(markdownCount >= 20 && markdownCount <= 50, "Markdown count must stay between 20 and 50", errors);
  assert(JSON.stringify(scenarioIds) === JSON.stringify(catalog.scenarioIndex.scenario_ids), "Scenario directories must match scenario-index.json", errors);

  const businessKeys = new Set();
  catalog.scenarios.forEach((scenario) => {
    [
      "scenario_id",
      "title",
      "objective",
      "publications",
      "article_ids",
      "covered_risks",
      "intended_stage",
      "depends_on_surfaces"
    ].forEach((field) => assert(Object.prototype.hasOwnProperty.call(scenario.meta, field), `${scenario.meta.scenario_id} missing ${field}`, errors));
    [
      "expected_variant_selection",
      "expected_fallback_behavior",
      "expected_unavailable_reason",
      "expected_paywall_behavior",
      "expected_sync_behavior",
      "expected_cache_behavior",
      "expected_event_signals",
      "notes"
    ].forEach((field) => assert(Object.prototype.hasOwnProperty.call(scenario.expectedOutcomes, field), `${scenario.meta.scenario_id} missing ${field}`, errors));
    assert(JSON.stringify(scenario.expectedOutcomes.expected_fallback_behavior?.can_fallback_to || []) === JSON.stringify(["teen", "general"]), `${scenario.meta.scenario_id} must declare can_fallback_to [teen, general]`, errors);
    assert(JSON.stringify(scenario.expectedOutcomes.expected_fallback_behavior?.cannot_fallback_to || []) === JSON.stringify(["adult"]), `${scenario.meta.scenario_id} must declare cannot_fallback_to [adult]`, errors);
    scenario.meta.publications.forEach((publicationKey) => assert(publicationKeys.has(publicationKey), `${scenario.meta.scenario_id} uses unknown publication ${publicationKey}`, errors));

    scenario.variants.forEach((variant) => {
      const fm = variant.frontmatter;
      ["scenario_id", "article_variant_id", "article_id", "article_uid", "product_key", "publication_key", "language", "audience_segment", "reading_mode", "title", "deck", "tags", "premium_tier", "publish_status", "revision", "source_kind"].forEach((field) => assert(Object.prototype.hasOwnProperty.call(fm, field), `${variant.fileName} missing ${field}`, errors));
      if (/^s1[1-5]_/.test(scenario.meta.scenario_id)) {
        ["publish_batch_id", "update_type", "update_priority", "change_summary", "notify_level", "is_breaking", "available_from"].forEach((field) =>
          assert(Object.prototype.hasOwnProperty.call(fm, field), `${variant.fileName} missing ${field}`, errors)
        );
      }
      assert(fm.scenario_id === scenario.meta.scenario_id, `${variant.fileName} scenario_id mismatch`, errors);
      assert(fm.source_kind === "synthetic", `${variant.fileName} source_kind must be synthetic`, errors);
      assert(publicationKeys.has(fm.publication_key), `${variant.fileName} uses unknown publication`, errors);
      assert(audiences.includes(fm.audience_segment), `${variant.fileName} invalid audience`, errors);
      assert(readingModes.includes(fm.reading_mode), `${variant.fileName} invalid reading_mode`, errors);
      assert(stripMarkdown(variant.body).length >= (fm.reading_mode === "quick_30s" ? 80 : 180), `${variant.fileName} body too short`, errors);
      const businessKey = [fm.product_key, fm.article_id, fm.language, fm.audience_segment, fm.reading_mode, fm.revision].join("|");
      assert(!businessKeys.has(businessKey), `Duplicate article variant business key ${businessKey}`, errors);
      businessKeys.add(businessKey);
    });
  });

  validateScenarioSpecificRules(catalog, errors);
  return {
    valid: errors.length === 0,
    errors,
    summary: {
      scenario_count: catalog.scenarios.length,
      markdown_count: markdownCount,
      publication_count: catalog.publications.length,
      article_count: catalog.scenarios.reduce((total, scenario) => total + scenario.meta.article_ids.length, 0)
    }
  };
}

function pickLatestVariant(variants, runtimeNow) {
  return variants
    .filter((item) => isReadableVariant(item, runtimeNow))
    .sort((left, right) => {
      if (left.revision === right.revision) {
        return right.updated_at.localeCompare(left.updated_at);
      }
      return right.revision - left.revision;
    })[0] || null;
}

function buildDiscoveryCatalog(articleRecords, variantRecords, runtimeNow) {
  return articleRecords.map((article) => {
    const variants = variantRecords.filter((item) => item.article_id === article._id);
    const latestVariant = pickLatestVariant(variants, runtimeNow);

    return {
      article_id: article._id,
      article_key: article.article_key,
      title: article.title,
      summary: article.summary,
      publication_id: article.publication_id,
      publication_key: article.publication_key,
      tags: article.tags || [],
      available_modes: [...new Set(variants.map((item) => item.reading_mode))],
      available_audiences: [...new Set(variants.map((item) => item.audience_segment))],
      updated_at: article.updated_at,
      publish_batch_id: latestVariant?.publish_batch_id || null,
      update_type: latestVariant?.update_type || null,
      update_priority: latestVariant?.update_priority || null,
      change_summary: latestVariant?.change_summary || null,
      notify_level: latestVariant?.notify_level || null,
      is_breaking: latestVariant?.is_breaking || false,
      available_from: latestVariant?.available_from || null,
      available_until: latestVariant?.available_until || null,
      primary_reading_mode: latestVariant?.reading_mode || "quick_30s",
      primary_audience: latestVariant?.audience_segment || "general"
    };
  });
}

function buildBundleForScenario(manifest, publications, scenario) {
  const runtimeNow = scenario.meta.runtime_now || manifest.defaults.runtime_now;
  const articleRecords = scenario.meta.articles.map((article) => buildArticleRecord(article, publications, manifest.product.product_key));
  const variantRecords = scenario.variants.map(buildVariantRecord);
  const changes = [
    ...articleRecords.map((item) => ({
      _id: item._id,
      updated_at: item.updated_at,
      payload: {
        entity_type: "article",
        article_id: item._id,
        article_key: item.article_key,
        publication_id: item.publication_id,
        publication_key: item.publication_key,
        title: item.title,
        summary: item.summary,
        tags: item.tags,
        status: item.status,
        updated_at: item.updated_at
      }
    })),
    ...variantRecords.map((item) => ({
      _id: item._id,
      updated_at: item.updated_at,
      payload: {
        entity_type: "article_variant",
        article_variant_id: item._id,
        article_id: item.article_id,
        publication_key: item.publication_key,
        tags: item.tags,
        language: item.language,
        audience_segment: item.audience_segment,
        reading_mode: item.reading_mode,
        publish_status: item.publish_status,
        publish_at: item.publish_at,
        revision: item.revision,
        publish_batch_id: item.publish_batch_id,
        update_type: item.update_type,
        update_priority: item.update_priority,
        change_summary: item.change_summary,
        notify_level: item.notify_level,
        is_breaking: item.is_breaking,
        available_from: item.available_from,
        available_until: item.available_until,
        content_hash: item.content_hash,
        is_deleted: item.is_deleted,
        updated_at: item.updated_at
      }
    }))
  ].sort(compareByUpdatedAt);
  const lastChange = changes.at(-1);
  const detailResponses = {};

  articleRecords.forEach((articleRecord) => {
    const languages = [...new Set(variantRecords.filter((item) => item.article_id === articleRecord._id).map((item) => item.language))];
    languages.forEach((language) => {
      audiences.forEach((audienceSegment) => {
        readingModes.forEach((readingMode) => {
          const key = [articleRecord._id, language, audienceSegment, readingMode].join("|");
          detailResponses[key] = resolveVariant(
            articleRecord,
            variantRecords,
            { article_id: articleRecord._id, language, audience_segment: audienceSegment, reading_mode: readingMode },
            runtimeNow
          );
        });
      });
    });
  });

  const experimentIds = scenario.meta.runtime?.experiment_ids || [];
  const experiments = manifest.experiments.filter((item) => experimentIds.includes(item._id));
  const pricingConfig = scenario.meta.runtime?.pricing_preview || { plan_ids: [], promo_codes: [] };
  const promoCodes = pricingConfig.promo_codes?.length ? [null, ...pricingConfig.promo_codes] : [null];
  const pricingResponses = [];
  pricingConfig.plan_ids.forEach((planId) => {
    promoCodes.forEach((promoCode) => {
      pricingResponses.push(computePricingPreview(manifest, planId, promoCode));
    });
  });

  const assignConfig = scenario.meta.runtime?.experiment_assign || {};
  const selectedExperiment = manifest.experiments.find((item) => item._id === assignConfig.experiment_id) || experiments[0] || null;
  const runtimeData = scenario.meta.runtime || {};
  const discoveryCatalog = buildDiscoveryCatalog(articleRecords, variantRecords, runtimeNow);
  const stageGSurfaces = buildStageGSurfaces(manifest, scenario, selectedExperiment);
  const followCatalog = {
    publications: publications.map((item) => ({
      publication_id: item._id,
      publication_key: item.publication_key,
      display_name: item.display_name,
      description: item.description
    })),
    tags: (manifest.tag_catalog || []).map((tag) => ({
      tag_key: tag,
      display_name: tag
    }))
  };

  return {
    metadata: {
      exported_at: new Date().toISOString(),
      canonical_source: "fixtures/test-inputs/scenarios + fixtures/test-inputs/publications + fixtures/test-inputs/manifests",
      product_key: manifest.product.product_key,
      scenario_id: scenario.meta.scenario_id,
      runtime_now: runtimeNow,
      source_kind: "synthetic_test_pack",
      business_flow_aliases: scenario.meta.business_flow_aliases || []
    },
    surfaceStatus: manifest.surface_status,
    scenarioMeta: scenario.meta,
    expectedOutcomes: scenario.expectedOutcomes,
    bootstrapConfig: {
      response: {
        product_key: manifest.product.product_key,
        config_source: "synthetic_test_pack",
        timezone: manifest.defaults.timezone,
        money_unit: manifest.defaults.money_unit,
        discount_canonical: manifest.defaults.discount_canonical,
        reward_canonical: manifest.defaults.reward_canonical,
        product: manifest.product,
        feature_flags: scenario.meta.runtime?.feature_flags || [],
        experiments: experiments.map((item) => ({
          experiment_id: item._id,
          experiment_key: item.experiment_key,
          assignment_unit: item.assignment_unit,
          assignment_version: item.assignment_version,
          status: item.status
        }))
      }
    },
    contentSyncDelta: {
      response: {
        server_cursor: lastChange ? `${lastChange.updated_at}|${lastChange._id}` : `${runtimeNow}|${scenario.meta.scenario_id}_empty`,
        has_more: false,
        items: changes.map((item) => item.payload),
        tombstones: scenario.meta.runtime?.sync?.tombstones || []
      }
    },
    contentDetail: { responses: detailResponses },
    entitlementSnapshot: {
      response: {
        product_key: manifest.product.product_key,
        subject_id: scenario.meta.runtime?.entitlement_snapshot?.subject_id || "inst_stage_x_default",
        access_state: scenario.meta.runtime?.entitlement_snapshot?.access_state || "denied",
        decision_source: scenario.meta.runtime?.entitlement_snapshot?.decision_source || "synthetic_fixture",
        quota_remaining: scenario.meta.runtime?.entitlement_snapshot?.quota_remaining ?? 0,
        entitlement_snapshot: scenario.meta.runtime?.entitlement_snapshot?.entitlement_snapshot ?? null,
        denial_reason: scenario.meta.runtime?.entitlement_snapshot?.denial_reason ?? null
      }
    },
    pricingPreview: { responses: pricingResponses },
    experimentAssign: {
      response: {
        product_key: manifest.product.product_key,
        installation_id: assignConfig.installation_id || scenario.meta.runtime?.entitlement_snapshot?.subject_id || "inst_stage_x_default",
        experiment_id: selectedExperiment?._id || null,
        experiment_key: selectedExperiment?.experiment_key || null,
        assignment_version: selectedExperiment?.assignment_version || 0,
        bucket_key: assignConfig.bucket_key || selectedExperiment?.bucket_definitions?.[0]?.bucket_key || null,
        assignment_source: assignConfig.assignment_source || "synthetic_fixture",
        cache_ttl_seconds: manifest.defaults.cache_ttl_seconds
      }
    },
    discoveryCatalog: {
      items: discoveryCatalog
    },
    followCatalog,
    publishBatches: {
      items: runtimeData.publish_batches || []
    },
    userFollows: {
      items: runtimeData.user_follows || []
    },
    notificationPrefs: {
      response: runtimeData.user_notification_prefs || null
    },
    notificationInbox: {
      items: runtimeData.notification_inbox || [],
      inbox_last_seen_at: runtimeData.inbox_last_seen_at || null
    },
    userContentState: {
      items: runtimeData.user_content_state || [],
      last_seen_publish_batch: runtimeData.last_seen_publish_batch || null
    },
    notificationDeliveries: {
      items: runtimeData.notification_deliveries || []
    },
    stageG: stageGSurfaces
  };
}

export function buildSyntheticTestPack() {
  const catalog = loadCatalog();
  const validation = validateCatalog(catalog);
  if (!validation.valid) {
    const error = new Error("SYNTHETIC_TEST_PACK_VALIDATION_FAILED");
    error.validation = validation;
    throw error;
  }
  [paths.outputRoot, paths.outputRuntimeRoot, paths.outputReportsRoot, paths.mobileScenarioRoot, paths.mobileCurrentRoot].forEach(ensureDir);
  const scenarioSummaries = catalog.scenarios.map((scenario) => ({
    scenario_id: scenario.meta.scenario_id,
    title: scenario.meta.title,
    publications: scenario.meta.publications,
    article_ids: scenario.meta.article_ids,
    markdown_variants: scenario.variants.length,
    covered_risks: scenario.meta.covered_risks
  }));
  writeJson(path.join(paths.outputReportsRoot, "source-index.json"), {
    generated_at: new Date().toISOString(),
    canonical_source: "fixtures/test-inputs/scenarios",
    manifest: catalog.manifest.pack_id,
    publications: catalog.publications,
    scenarios: scenarioSummaries
  });
  writeJson(path.join(paths.outputReportsRoot, "build-report.json"), {
    status: "ok",
    generated_at: new Date().toISOString(),
    summary: validation.summary,
    scenario_ids: catalog.scenarioIndex.scenario_ids
  });
  return { catalog, validation, scenarioSummaries };
}

export function exportRuntimeScenarios() {
  const { catalog } = buildSyntheticTestPack();
  const bundles = catalog.scenarios.map((scenario) => buildBundleForScenario(catalog.manifest, catalog.publications, scenario));
  bundles.forEach((bundle) => {
    const fileName = `${bundle.metadata.scenario_id}.bundle.json`;
    writeJson(path.join(paths.outputRuntimeRoot, fileName), bundle);
    writeJson(path.join(paths.mobileScenarioRoot, fileName), bundle);
  });
  writeJson(path.join(paths.outputReportsRoot, "export-report.json"), {
    status: "ok",
    generated_at: new Date().toISOString(),
    bundle_count: bundles.length,
    scenario_ids: bundles.map((bundle) => bundle.metadata.scenario_id)
  });
  return bundles;
}

function writeCurrentRuntimeFiles(bundle) {
  ensureDir(paths.mobileCurrentRoot);
  writeJson(path.join(paths.mobileCurrentRoot, "runtime.bundle.json"), bundle);
  writeJson(path.join(paths.mobileCurrentRoot, "scenario-meta.json"), bundle.scenarioMeta);
  writeJson(path.join(paths.mobileCurrentRoot, "expected-outcomes.json"), bundle.expectedOutcomes);
  writeJson(path.join(paths.mobileCurrentRoot, "bootstrap-config.json"), bundle.bootstrapConfig);
  writeJson(path.join(paths.mobileCurrentRoot, "content-sync-delta.json"), bundle.contentSyncDelta);
  writeJson(path.join(paths.mobileCurrentRoot, "content-detail.json"), bundle.contentDetail);
  writeJson(path.join(paths.mobileCurrentRoot, "entitlement-snapshot.json"), bundle.entitlementSnapshot);
  writeJson(path.join(paths.mobileCurrentRoot, "pricing-preview.json"), bundle.pricingPreview);
  writeJson(path.join(paths.mobileCurrentRoot, "experiment-assign.json"), bundle.experimentAssign);
  writeJson(path.join(paths.mobileCurrentRoot, "commercial-offer.json"), bundle.stageG.commercialOffer);
  writeJson(path.join(paths.mobileCurrentRoot, "quota-status.json"), bundle.stageG.quotaStatus);
  writeJson(path.join(paths.mobileCurrentRoot, "promo-preview.json"), bundle.stageG.promoPreview);
  writeJson(path.join(paths.mobileCurrentRoot, "referral-summary.json"), bundle.stageG.referralSummary);
  writeJson(path.join(paths.mobileCurrentRoot, "reward-summary.json"), bundle.stageG.rewardSummary);
  writeJson(path.join(paths.mobileCurrentRoot, "campaign-landing.json"), bundle.stageG.campaignLanding);
  writeJson(path.join(paths.mobileCurrentRoot, "profile-benefits.json"), bundle.stageG.profileBenefits);
  fs.writeFileSync(path.join(paths.mobileCurrentRoot, "index.js"), `const runtimeFixtures = ${JSON.stringify(bundle, null, 2)};\n\nexport default runtimeFixtures;\n`, "utf8");
}

export function selectRuntimeScenario(scenarioId) {
  if (!scenarioId) {
    throw new Error("SCENARIO_ID_REQUIRED");
  }
  const bundlePath = path.join(paths.mobileScenarioRoot, `${scenarioId}.bundle.json`);
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`RUNTIME_SCENARIO_BUNDLE_MISSING:${scenarioId}`);
  }
  const bundle = readJson(bundlePath);
  writeCurrentRuntimeFiles(bundle);
  ensureDir(paths.outputReportsRoot);
  writeJson(path.join(paths.outputReportsRoot, "current-scenario.json"), {
    status: "ok",
    selected_at: new Date().toISOString(),
    scenario_id: scenarioId,
    bundle_source: path.relative(repoRoot, bundlePath),
    current_runtime_root: path.relative(repoRoot, paths.mobileCurrentRoot)
  });
  return { scenario_id: scenarioId, bundle };
}

export function smokeTestInputPack() {
  exportRuntimeScenarios();
  const selected = ["s01_normal_full_matrix", "s02_general_fallback", "s03_teen_unavailable"].map((scenarioId) => selectRuntimeScenario(scenarioId).scenario_id);
  const report = { status: "ok", generated_at: new Date().toISOString(), selected_scenarios: selected };
  writeJson(path.join(paths.outputReportsRoot, "smoke-test-input-pack.json"), report);
  return report;
}
