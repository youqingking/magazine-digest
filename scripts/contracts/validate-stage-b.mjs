import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function fail(category, message) {
  console.error(`[${category}] ${message}`);
  process.exit(1);
}

function readRequiredFile(relativePath, kind = "file") {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail("missing file", `Missing required ${kind}: ${relativePath}`);
  }

  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    fail("missing file", `Unable to read ${kind}: ${relativePath} (${error.message})`);
  }
}

function readJson(relativePath, kind = "JSON file") {
  const raw = readRequiredFile(relativePath, kind);

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail("JSON parse error", `${relativePath}: ${error.message}`);
  }
}

function expect(condition, category, message) {
  if (!condition) {
    fail(category, message);
  }
}

function expectRequired(record, fieldName, context) {
  expect(Object.prototype.hasOwnProperty.call(record, fieldName), "missing required field", `${context} is missing required field \"${fieldName}\"`);
  expect(record[fieldName] !== null && record[fieldName] !== undefined, "missing required field", `${context} has empty required field \"${fieldName}\"`);
}

function validateType(value, schema, context) {
  if (value === null || value === undefined || !schema || !schema.type) {
    return;
  }

  let isValid = true;

  switch (schema.type) {
    case "string":
      isValid = typeof value === "string";
      break;
    case "boolean":
      isValid = typeof value === "boolean";
      break;
    case "integer":
      isValid = Number.isInteger(value);
      break;
    case "number":
      isValid = typeof value === "number" && Number.isFinite(value);
      break;
    case "object":
      isValid = typeof value === "object" && !Array.isArray(value);
      break;
    case "array":
      isValid = Array.isArray(value);
      break;
    default:
      return;
  }

  expect(isValid, "missing required field", `${context} has invalid type for expected ${schema.type}`);

  if (typeof schema.minimum === "number") {
    expect(value >= schema.minimum, "missing required field", `${context} is below minimum ${schema.minimum}`);
  }

  if (typeof schema.maximum === "number") {
    expect(value <= schema.maximum, "missing required field", `${context} is above maximum ${schema.maximum}`);
  }
}

function validateEnum(value, schema, context, fieldName) {
  if (!schema?.enum || value === null || value === undefined) {
    return;
  }

  expect(schema.enum.includes(value), "invalid enum", `${context} uses invalid enum for \"${fieldName}\": ${JSON.stringify(value)}`);
}

function validateRecordAgainstSchema(record, schema, context) {
  for (const fieldName of schema.required || []) {
    expectRequired(record, fieldName, context);
  }

  for (const [fieldName, fieldSchema] of Object.entries(schema.properties || {})) {
    if (!Object.prototype.hasOwnProperty.call(record, fieldName)) {
      continue;
    }

    validateType(record[fieldName], fieldSchema, `${context}.${fieldName}`);
    validateEnum(record[fieldName], fieldSchema, context, fieldName);
  }
}

function assertExplicitOffset(timestamp, context) {
  expect(typeof timestamp === "string" && /([+-]\d\d:\d\d|Z)$/.test(timestamp), "fixture minimum-loop failure", `${context} must be an ISO timestamp with explicit offset`);
}

const schemaFiles = [
  "database/products.schema.json",
  "database/publications.schema.json",
  "database/articles.schema.json",
  "database/article_variants.schema.json",
  "database/user_profiles.schema.json",
  "database/user_product_profiles.schema.json",
  "database/device_installations.schema.json",
  "database/entitlements.schema.json",
  "database/quota_policies.schema.json",
  "database/quota_consumption_logs.schema.json",
  "database/pricing_plans.schema.json",
  "database/payment_orders.schema.json",
  "database/subscription_records.schema.json",
  "database/promo_campaigns.schema.json",
  "database/promo_codes.schema.json",
  "database/promo_redemptions.schema.json",
  "database/referrals.schema.json",
  "database/reward_ledger.schema.json",
  "database/feature_flags.schema.json",
  "database/experiments.schema.json",
  "database/experiment_assignments.schema.json",
  "database/event_logs_raw.schema.json",
  "database/event_metrics_daily.schema.json",
  "database/audit_logs.schema.json"
];

const docFiles = [
  "docs/ROUTES.md",
  "docs/API_CONTRACTS.md",
  "docs/CONTENT_SYNC.md",
  "docs/RULE_PRECEDENCE.md",
  "docs/INDEX_AND_IDEMPOTENCY.md",
  "docs/STATE_MACHINES.md",
  "docs/RBAC.md",
  "docs/LEGACY_MAPPING.md",
  "docs/STAGE_B_DECISIONS.md",
  "docs/OUT_OF_SCOPE.md",
  "docs/TIME_AND_MONEY_RULES.md"
];

const seedFiles = {
  products: "fixtures/db/seed/products.seed.json",
  publications: "fixtures/db/seed/publications.seed.json",
  articles: "fixtures/db/seed/articles.seed.json",
  article_variants: "fixtures/db/seed/article_variants.seed.json",
  pricing_plans: "fixtures/db/seed/pricing_plans.seed.json",
  promo_campaigns: "fixtures/db/seed/promo_campaigns.seed.json",
  promo_codes: "fixtures/db/seed/promo_codes.seed.json",
  experiments: "fixtures/db/seed/experiments.seed.json",
  referrals: "fixtures/db/seed/referrals.seed.json",
  event_logs_raw: "fixtures/db/seed/event_logs_raw.seed.json"
};

const schemaByCollection = new Map();
for (const relativePath of schemaFiles) {
  const schema = readJson(relativePath, "schema");
  expect(schema.collection, "missing required field", `${relativePath} is missing \"collection\"`);
  expect(Array.isArray(schema.required) && schema.required.length > 0, "missing required field", `${relativePath} is missing required fields`);
  schemaByCollection.set(schema.collection, schema);
}

for (const relativePath of docFiles) {
  readRequiredFile(relativePath, "doc");
}

const seeds = {};
for (const [collection, relativePath] of Object.entries(seedFiles)) {
  const data = readJson(relativePath, "seed");
  expect(Array.isArray(data), "JSON parse error", `${relativePath} must contain a top-level array`);
  const schema = schemaByCollection.get(collection);
  expect(schema, "missing file", `Schema missing for seeded collection: ${collection}`);
  data.forEach((record, index) => {
    expect(typeof record === "object" && record !== null && !Array.isArray(record), "JSON parse error", `${relativePath}[${index}] must be an object`);
    validateRecordAgainstSchema(record, schema, `${collection}[${index}]`);
  });
  seeds[collection] = data;
}

const products = seeds.products;
const publications = seeds.publications;
const articles = seeds.articles;
const variants = seeds.article_variants;
const plans = seeds.pricing_plans;
const campaigns = seeds.promo_campaigns;
const codes = seeds.promo_codes;
const experiments = seeds.experiments;
const referrals = seeds.referrals;
const events = seeds.event_logs_raw;

expect(products.length >= 1, "fixture minimum-loop failure", "At least one product seed is required");
expect(publications.length >= 1, "fixture minimum-loop failure", "At least one publication seed is required");
expect(articles.length >= 1, "fixture minimum-loop failure", "At least one article seed is required");
expect(variants.length >= 4, "fixture minimum-loop failure", "At least four article variants are required");
expect(plans.length >= 2, "fixture minimum-loop failure", "Monthly and annual pricing plans are required");
expect(campaigns.length >= 1, "fixture minimum-loop failure", "At least one promo campaign is required");
expect(codes.length >= 1, "fixture minimum-loop failure", "At least one promo code is required");
expect(experiments.length >= 1, "fixture minimum-loop failure", "At least one experiment seed is required");
expect(referrals.length >= 1, "fixture minimum-loop failure", "At least one referral seed is required");
expect(events.length >= 1, "fixture minimum-loop failure", "At least one event seed is required");

const productKeys = [...new Set(products.map((item) => item.product_key))];
expect(productKeys.length === 1, "fixture minimum-loop failure", "Stage B seed expects exactly one default product");
expect(productKeys[0] === "demo_cn_content", "fixture minimum-loop failure", "Default product_key must be demo_cn_content in Stage B fixture");

const publicationIds = new Set(publications.map((item) => item._id));
const articleIds = new Set(articles.map((item) => item._id));
const campaignIds = new Set(campaigns.map((item) => item._id));

for (const publication of publications) {
  expect(productKeys.includes(publication.product_key), "broken cross-file reference", `Publication references missing product: ${publication._id}`);
}

for (const article of articles) {
  expect(productKeys.includes(article.product_key), "broken cross-file reference", `Article references missing product: ${article._id}`);
  if (article.publication_id) {
    expect(publicationIds.has(article.publication_id), "broken cross-file reference", `Article references missing publication: ${article._id}`);
  }
}

const planCycles = new Set();
for (const plan of plans) {
  expect(productKeys.includes(plan.product_key), "broken cross-file reference", `Pricing plan references missing product: ${plan._id}`);
  planCycles.add(plan.billing_cycle);
  expect(Number.isInteger(plan.price_fen), "missing required field", `${plan._id} price_fen must be an integer fen amount`);
  expect(Number.isInteger(plan.price_floor_fen), "missing required field", `${plan._id} price_floor_fen must be an integer fen amount`);
  expect(plan.price_floor_fen <= plan.price_fen, "fixture minimum-loop failure", `${plan._id} price floor cannot exceed base price`);
  assertExplicitOffset(plan.created_at, `${plan._id}.created_at`);
  assertExplicitOffset(plan.updated_at, `${plan._id}.updated_at`);
}

expect(planCycles.has("monthly"), "fixture minimum-loop failure", "Monthly plan missing");
expect(planCycles.has("annual"), "fixture minimum-loop failure", "Annual plan missing");

const internalBetaCampaign = campaigns.find((item) => item.campaign_key === "internal_beta_30off");
expect(Boolean(internalBetaCampaign), "fixture minimum-loop failure", "Internal beta 3-discount campaign missing");

for (const campaign of campaigns) {
  expect(productKeys.includes(campaign.product_key), "broken cross-file reference", `Campaign references missing product: ${campaign._id}`);
  if (campaign.price_multiplier_basis_points !== undefined) {
    expect(Number.isInteger(campaign.price_multiplier_basis_points), "missing required field", `${campaign._id} price_multiplier_basis_points must be an integer`);
    expect(campaign.price_multiplier_basis_points >= 0 && campaign.price_multiplier_basis_points <= 10000, "fixture minimum-loop failure", `${campaign._id} price_multiplier_basis_points must be between 0 and 10000`);
  }
  if (campaign.reward_vip_days !== undefined) {
    expect(Number.isInteger(campaign.reward_vip_days), "missing required field", `${campaign._id} reward_vip_days must be an integer`);
  }
  assertExplicitOffset(campaign.starts_at, `${campaign._id}.starts_at`);
  assertExplicitOffset(campaign.ends_at, `${campaign._id}.ends_at`);
}

expect(internalBetaCampaign.price_multiplier_basis_points === 3000, "fixture minimum-loop failure", "Internal beta campaign must model 3-discount as price_multiplier_basis_points=3000");
expect(!("adjustment_type" in internalBetaCampaign), "fixture minimum-loop failure", "Internal beta campaign must not keep legacy adjustment_type");
expect(!("adjustment_value" in internalBetaCampaign), "fixture minimum-loop failure", "Internal beta campaign must not keep legacy adjustment_value");

const variantBusinessKeys = new Set();
const readingModes = new Set();
const audienceModes = new Set();
for (const variant of variants) {
  expect(articleIds.has(variant.article_id), "broken cross-file reference", `Variant references missing article: ${variant._id}`);
  expect(productKeys.includes(variant.product_key), "broken cross-file reference", `Variant references missing product: ${variant._id}`);

  const businessKey = [variant.product_key, variant.article_id, variant.language, variant.audience_segment, variant.reading_mode, variant.revision].join("|");
  expect(!variantBusinessKeys.has(businessKey), "fixture minimum-loop failure", `Duplicate article variant business key: ${businessKey}`);
  variantBusinessKeys.add(businessKey);
  readingModes.add(variant.reading_mode);
  audienceModes.add(variant.audience_segment);
}

expect(readingModes.has("quick_30s"), "fixture minimum-loop failure", "quick_30s variant missing");
expect(readingModes.has("deep_3m"), "fixture minimum-loop failure", "deep_3m variant missing");
expect(audienceModes.has("teen"), "fixture minimum-loop failure", "Teen variant missing");
expect(audienceModes.has("adult"), "fixture minimum-loop failure", "Adult variant missing");

for (const [audienceSegment, readingMode] of [["teen", "quick_30s"], ["teen", "deep_3m"], ["adult", "quick_30s"], ["adult", "deep_3m"]]) {
  expect(variants.some((item) => item.audience_segment === audienceSegment && item.reading_mode === readingMode), "fixture minimum-loop failure", `Missing article variant loop for ${audienceSegment}/${readingMode}`);
}

const generalFallbacks = variants.filter((item) => item.audience_segment === "general");
if (generalFallbacks.length > 0) {
  for (const fallback of generalFallbacks) {
    expect(fallback.fallback_policy === "allow_same_audience_only", "fixture minimum-loop failure", `General fallback must stay audience-safe: ${fallback._id}`);
  }

  const generalByReadingMode = new Set(generalFallbacks.map((item) => item.reading_mode));
  for (const readingMode of ["quick_30s", "deep_3m"]) {
    const teenVariantExists = variants.some((item) => item.audience_segment === "teen" && item.reading_mode === readingMode);
    expect(teenVariantExists || generalByReadingMode.has(readingMode), "fixture minimum-loop failure", `Teen ${readingMode} request must resolve to teen or general only`);
  }
}

for (const code of codes) {
  expect(productKeys.includes(code.product_key), "broken cross-file reference", `Promo code references missing product: ${code._id}`);
  expect(campaignIds.has(code.campaign_id), "broken cross-file reference", `Promo code references missing campaign: ${code._id}`);
}

for (const referral of referrals) {
  expect(productKeys.includes(referral.product_key), "broken cross-file reference", `Referral references missing product: ${referral._id}`);
  expect(referral.inviter_user_id !== referral.invitee_user_id, "fixture minimum-loop failure", `Referral cannot self-invite: ${referral._id}`);
  expect(campaignIds.has(referral.campaign_id), "broken cross-file reference", `Referral references missing campaign: ${referral._id}`);
}

const installationBindings = new Set();
for (const referral of referrals) {
  const refKey = `${referral.product_key}|${referral.installation_id}`;
  expect(!installationBindings.has(refKey), "fixture minimum-loop failure", `Duplicate referral installation binding detected: ${refKey}`);
  installationBindings.add(refKey);
}

const allowedEventNames = new Set(["article_impression", "article_open", "variant_switch", "read_progress", "paywall_impression", "paywall_dismiss", "plan_select", "purchase_success", "purchase_fail", "share_click", "share_success", "invite_bind_success", "promo_redeem_success"]);
const eventDedupKeys = new Set();
for (const event of events) {
  expect(productKeys.includes(event.product_key), "broken cross-file reference", `Event references missing product: ${event._id}`);
  expect(allowedEventNames.has(event.event_name), "invalid enum", `Event uses non-frozen event enum: ${event.event_name}`);
  expect(!eventDedupKeys.has(event.dedup_key), "fixture minimum-loop failure", `Duplicate event dedup_key: ${event.dedup_key}`);
  eventDedupKeys.add(event.dedup_key);
}

const rulePrecedenceText = readRequiredFile("docs/RULE_PRECEDENCE.md", "doc");
expect(rulePrecedenceText.includes("teen request"), "fixture minimum-loop failure", "RULE_PRECEDENCE must document teen fallback boundary");
expect(rulePrecedenceText.includes("price_fen"), "fixture minimum-loop failure", "RULE_PRECEDENCE must document pricing precedence using fen semantics");

const legacyText = readRequiredFile("docs/LEGACY_MAPPING.md", "doc");
expect(legacyText.includes("free_quota_per_day"), "fixture minimum-loop failure", "LEGACY_MAPPING must map free_quota_per_day");
expect(legacyText.includes("current_discount_rate"), "fixture minimum-loop failure", "LEGACY_MAPPING must map current_discount_rate");
expect(legacyText.includes("is_internal_beta"), "fixture minimum-loop failure", "LEGACY_MAPPING must map is_internal_beta");

const apiContractsText = readRequiredFile("docs/API_CONTRACTS.md", "doc");
expect(apiContractsText.includes("source of truth"), "fixture minimum-loop failure", "API_CONTRACTS must classify source of truth tables");
expect(apiContractsText.includes("current-state projection"), "fixture minimum-loop failure", "API_CONTRACTS must classify current-state projection tables");
expect(apiContractsText.includes("append-only ledger"), "fixture minimum-loop failure", "API_CONTRACTS must classify append-only ledger tables");

const contentSyncText = readRequiredFile("docs/CONTENT_SYNC.md", "doc");
expect(contentSyncText.includes("unpublish"), "fixture minimum-loop failure", "CONTENT_SYNC must define unpublish handling");
expect(contentSyncText.includes("delete"), "fixture minimum-loop failure", "CONTENT_SYNC must define delete handling");

const timeMoneyText = readRequiredFile("docs/TIME_AND_MONEY_RULES.md", "doc");
expect(timeMoneyText.includes("integer `fen`"), "fixture minimum-loop failure", "TIME_AND_MONEY_RULES must freeze integer fen");
expect(timeMoneyText.includes("Asia/Shanghai"), "fixture minimum-loop failure", "TIME_AND_MONEY_RULES must freeze Asia/Shanghai");
expect(timeMoneyText.includes("vip_days"), "fixture minimum-loop failure", "TIME_AND_MONEY_RULES must freeze vip_days");
expect(timeMoneyText.includes("price_multiplier_basis_points"), "fixture minimum-loop failure", "TIME_AND_MONEY_RULES must freeze price_multiplier_basis_points");

console.log(JSON.stringify({ timestamp: new Date().toISOString(), schema_count: schemaFiles.length, doc_count: docFiles.length, seed_count: Object.keys(seedFiles).length, product_key: productKeys[0], article_variant_count: variants.length, validation: "passed" }, null, 2));

