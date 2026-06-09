import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  expect(fs.existsSync(fullPath), `MISSING:${relativePath}`);
  return fullPath;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(requireFile(relativePath), "utf8"));
}

[
  "docs/G_ACCEPTANCE.md",
  "docs/STAGE_G_DECISIONS.md",
  "docs/COMMERCIAL_FOUNDATION.md",
  "docs/GROWTH_FOUNDATION.md"
].forEach(requireFile);

[
  "backend/surfaces/commercial-offer.mjs",
  "backend/surfaces/quota-status.mjs",
  "backend/surfaces/promo-preview.mjs",
  "backend/surfaces/referral-summary.mjs",
  "backend/surfaces/reward-summary.mjs",
  "backend/surfaces/campaign-landing.mjs",
  "backend/surfaces/profile-benefits.mjs",
  "mobile/services/commercial.service.js",
  "mobile/services/quota.service.js",
  "mobile/services/promo.service.js",
  "mobile/services/referral.service.js",
  "mobile/services/reward.service.js",
  "mobile/stores/commercial.store.js",
  "mobile/stores/growth.store.js",
  "mobile/components/commercial/OfferSummaryCard.vue",
  "mobile/components/commercial/QuotaStatusCard.vue",
  "mobile/components/commercial/PromoCodeInput.vue",
  "mobile/components/commercial/EntitlementBadge.vue",
  "mobile/components/commercial/CampaignHero.vue",
  "mobile/components/growth/InviteSummaryCard.vue",
  "mobile/components/growth/RewardSummaryCard.vue",
  "mobile/components/growth/ReferralRuleBlock.vue",
  "scripts/bootstrap/smoke-stage-g.mjs",
  "scripts/bootstrap/smoke-stage-g.ps1",
  "scripts/contracts/validate-stage-g.ps1"
].forEach(requireFile);

const scenarioIndex = readJson("fixtures/test-inputs/manifests/scenario-index.json");
[
  "s16_quota_exhausted_paywall",
  "s17_campaign_discount_offer",
  "s18_promo_code_apply_preview",
  "s19_referral_reward_preview",
  "s20_active_entitlement_profile"
].forEach((scenarioId) => {
  expect(scenarioIndex.scenario_ids.includes(scenarioId), `SCENARIO_INDEX_MISSING:${scenarioId}`);
  requireFile(`fixtures/test-inputs/scenarios/${scenarioId}/scenario.meta.json`);
  requireFile(`fixtures/test-inputs/scenarios/${scenarioId}/expected-outcomes.json`);
});

const backendRegistryText = fs.readFileSync(requireFile("backend/contracts/surfaces.mjs"), "utf8");
[
  "commercial-offer",
  "quota-status",
  "promo-preview",
  "referral-summary",
  "reward-summary",
  "campaign-landing",
  "profile-benefits"
].forEach((surface) => expect(backendRegistryText.includes(surface), `SURFACE_REGISTRY_MISSING:${surface}`));

const runtimeGatewayText = fs.readFileSync(requireFile("mobile/services/runtime-gateway.service.js"), "utf8");
[
  "getCommercialOffer",
  "getQuotaStatus",
  "previewPromo",
  "getReferralSummary",
  "getRewardSummary",
  "getCampaignLanding",
  "getProfileBenefits"
].forEach((symbol) => expect(runtimeGatewayText.includes(symbol), `MOBILE_GATEWAY_MISSING:${symbol}`));

const adminGenerated = fs.readFileSync(requireFile("admin/src/modules/generated/generated-registry.js"), "utf8");
["pricing_plans", "quota_policies", "promo_campaigns", "promo_codes", "referrals", "reward_ledger", "experiments", "feature_flags"].forEach((resource) =>
  expect(adminGenerated.includes(resource), `ADMIN_GENERATED_MISSING:${resource}`)
);

const adminManual = fs.readFileSync(requireFile("admin/src/modules/manual/manual-registry.js"), "utf8");
[
  "offer_preview_inspector",
  "promo_stacking_inspector",
  "quota_policy_inspector",
  "referral_reward_preview",
  "campaign_landing_preview",
  "experiment_offer_preview"
].forEach((moduleKey) => expect(adminManual.includes(moduleKey), `ADMIN_MANUAL_MISSING:${moduleKey}`));

const eventContractText = fs.readFileSync(requireFile("mobile/contracts/runtime-contract.js"), "utf8");
[
  "paywall_offer_impression",
  "quota_exhausted",
  "promo_apply_attempt",
  "promo_apply_success",
  "promo_apply_fail",
  "invite_preview_open",
  "referral_share_click",
  "reward_summary_open",
  "entitlement_view",
  "campaign_open"
].forEach((eventName) => expect(eventContractText.includes(eventName), `EVENT_MISSING:${eventName}`));

console.log(
  JSON.stringify(
    {
      status: "ok",
      stage: "G",
      checked_scenarios: ["s16", "s17", "s18", "s19", "s20"],
      checked_surfaces: 7,
      checked_events: 10
    },
    null,
    2
  )
);
