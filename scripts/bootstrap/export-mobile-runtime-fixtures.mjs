import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalBackendRuntime, listBackendSurfaces } from "../../backend/index.mjs";
import { audienceSegments, readingModes } from "../../shared/contracts/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const mobileFixtureDir = path.join(repoRoot, "mobile", "fixtures", "runtime");
const outputDir = path.join(repoRoot, "output", "stage-e0");

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, JSON.stringify(value, null, 2) + "\n");
}

function buildContentDetailFixtures(runtime) {
  const articles = runtime.repository.listArticles(runtime.runtimeConfig.productKey);
  const responses = {};

  articles.forEach((article) => {
    audienceSegments.forEach((audienceSegment) => {
      readingModes.forEach((readingMode) => {
        const request = {
          product_key: runtime.runtimeConfig.productKey,
          article_id: article._id,
          language: "zh-CN",
          audience_segment: audienceSegment,
          reading_mode: readingMode,
          request_id: "req_export_" + article._id + "_" + audienceSegment + "_" + readingMode
        };
        const key = [
          request.article_id,
          request.language,
          request.audience_segment,
          request.reading_mode
        ].join("|");

        responses[key] = runtime.surfaces["content-detail"](request);
      });
    });
  });

  const firstArticle = articles[0] || null;
  if (firstArticle) {
    responses["art_fixture_unavailable|zh-CN|teen|quick_30s"] = {
      article: {
        article_id: firstArticle._id,
        article_key: firstArticle.article_key,
        title: firstArticle.title,
        summary: firstArticle.summary
      },
      resolved_variant: null,
      selection_reason: null,
      fallback_applied: false,
      unavailable_reason: "CONTENT_UNAVAILABLE_SAFE_FALLBACK_MISSING"
    };
  }

  return {
    responses
  };
}

function buildPricingFixtures(runtime) {
  const plans = runtime.repository.pricingPlans.filter(
    (item) => item.product_key === runtime.runtimeConfig.productKey && item.status === "active"
  );
  const promoCodes = runtime.repository.promoCodes.filter(
    (item) => item.product_key === runtime.runtimeConfig.productKey && item.status === "active"
  );
  const responses = [];

  plans.forEach((plan) => {
    responses.push(
      runtime.surfaces["pricing-preview"]({
        product_key: runtime.runtimeConfig.productKey,
        pricing_plan_id: plan._id
      })
    );

    promoCodes.forEach((promoCode) => {
      responses.push(
        runtime.surfaces["pricing-preview"]({
          product_key: runtime.runtimeConfig.productKey,
          pricing_plan_id: plan._id,
          promo_code: promoCode.code
        })
      );
    });
  });

  return {
    responses
  };
}

const runtime = createLocalBackendRuntime();
const bootstrapConfig = {
  response: runtime.surfaces["bootstrap-config"]({
    product_key: runtime.runtimeConfig.productKey
  })
};
const contentSyncDelta = {
  response: runtime.surfaces["content-sync-delta"]({
    product_key: runtime.runtimeConfig.productKey,
    installation_id: "inst_mobile_export",
    last_sync_cursor: null,
    limit: 50
  })
};
const contentDetail = buildContentDetailFixtures(runtime);
const entitlementSnapshot = {
  response: runtime.surfaces["entitlement-snapshot"]({
    product_key: runtime.runtimeConfig.productKey,
    installation_id: "inst_mobile_export"
  })
};
const pricingPreview = buildPricingFixtures(runtime);
const experimentAssign = {
  response: runtime.surfaces["experiment-assign"]({
    product_key: runtime.runtimeConfig.productKey,
    installation_id: "inst_mobile_export"
  })
};
const surfaceStatus = listBackendSurfaces().map((item) => ({
  surface: item.surface,
  status: item.status
}));
const metadata = {
  exported_at: new Date().toISOString(),
  runtime_mode: runtime.runtimeConfig.runtimeMode,
  canonical_source: "backend/* + fixtures/db/seed/* + docs/Stage B/Stage D contracts",
  product_key: runtime.runtimeConfig.productKey
};
const bundle = {
  metadata,
  surfaceStatus,
  bootstrapConfig,
  contentSyncDelta,
  contentDetail,
  entitlementSnapshot,
  pricingPreview,
  experimentAssign
};

fs.mkdirSync(mobileFixtureDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

writeJson(path.join(mobileFixtureDir, "bootstrap-config.json"), bootstrapConfig);
writeJson(path.join(mobileFixtureDir, "content-sync-delta.json"), contentSyncDelta);
writeJson(path.join(mobileFixtureDir, "content-detail.json"), contentDetail);
writeJson(path.join(mobileFixtureDir, "entitlement-snapshot.json"), entitlementSnapshot);
writeJson(path.join(mobileFixtureDir, "pricing-preview.json"), pricingPreview);
writeJson(path.join(mobileFixtureDir, "experiment-assign.json"), experimentAssign);
writeJson(path.join(outputDir, "mobile-runtime-fixtures.bundle.json"), bundle);
writeJson(path.join(outputDir, "mobile-runtime-fixtures.report.json"), {
  status: "ok",
  product_key: runtime.runtimeConfig.productKey,
  exported_files: 7,
  surfaces: surfaceStatus
});

fs.writeFileSync(
  path.join(mobileFixtureDir, "index.js"),
  "const runtimeFixtures = " + JSON.stringify(bundle, null, 2) + ";\n\nexport default runtimeFixtures;\n",
  "utf8"
);

console.log(
  JSON.stringify(
    {
      status: "ok",
      output: path.join(outputDir, "mobile-runtime-fixtures.bundle.json"),
      mobile_fixture_index: path.join(mobileFixtureDir, "index.js")
    },
    null,
    2
  )
);
