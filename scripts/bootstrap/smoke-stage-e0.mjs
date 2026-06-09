import currentRuntimeFixtures from "../../mobile/fixtures/runtime/current/index.js";
import { loadFeedSnapshot } from "../../mobile/services/content-sync.service.js";
import { loadEntitlementSnapshot } from "../../mobile/services/entitlement.service.js";
import { ingestRuntimeEvent, listQueuedEvents } from "../../mobile/services/event-ingest.service.js";
import { loadPricingPreviewCatalog, formatFenToPrice } from "../../mobile/services/pricing.service.js";
import { loadExperimentAssignment } from "../../mobile/services/experiment.service.js";
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";
import {
  getReaderState,
  setAudienceMode,
  setCurrentArticle,
  setReadingMode
} from "../../mobile/stores/reader.store.js";
import { getSessionState, resetSessionState, setRuntimeMode } from "../../mobile/stores/session.store.js";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

resetSessionState();
setRuntimeMode("local");

const feed = await loadFeedSnapshot();
assertCondition(feed.articles.length > 0, "Feed must contain at least one article");

const articleId = feed.articles[0].article_id;
const adultFixtureEntry =
  Object.entries(currentRuntimeFixtures.contentDetail.responses).find(
    ([key, value]) => key.startsWith(`${articleId}|zh-CN|adult|deep_3m`) && value.resolved_variant
  ) ||
  Object.entries(currentRuntimeFixtures.contentDetail.responses).find(
    ([key, value]) => key.startsWith(`${articleId}|zh-CN|adult|`) && value.resolved_variant
  );

setCurrentArticle(articleId);
setAudienceMode("teen");
setReadingMode("quick_30s");

const teenDetail = await runtimeGateway.getContentDetail({
  article_id: articleId,
  language: "zh-CN",
  audience_segment: "teen",
  reading_mode: getReaderState().readingMode,
  request_id: "req_smoke_teen"
});

assertCondition(
  teenDetail.resolved_variant &&
    teenDetail.resolved_variant.audience_segment !== "adult",
  "Teen detail must not resolve to adult"
);

setAudienceMode("adult");
setReadingMode(adultFixtureEntry && adultFixtureEntry[0].endsWith("|deep_3m") ? "deep_3m" : "quick_30s");

const adultDetail = await runtimeGateway.getContentDetail({
  article_id: articleId,
  language: "zh-CN",
  audience_segment: "adult",
  reading_mode: getReaderState().readingMode,
  request_id: "req_smoke_adult"
});

assertCondition(
  adultDetail.resolved_variant,
  "Adult detail must resolve in an available mode"
);

const entitlement = await loadEntitlementSnapshot();
assertCondition(entitlement.access_state === "denied", "Local runtime entitlement should be denied");

const pricing = await loadPricingPreviewCatalog();
assertCondition(pricing.previews.length >= 2, "Pricing catalog should include active plans");

const experiment = await loadExperimentAssignment();
assertCondition(
  ["local_fixture_backed", "synthetic_fixture"].includes(experiment.assignment_source),
  "Experiment must come from fixture-backed assignment"
);

await ingestRuntimeEvent("article_open", {
  article_id: articleId,
  article_variant_id: teenDetail.resolved_variant.article_variant_id
});
await ingestRuntimeEvent("article_open", {
  article_id: articleId,
  article_variant_id: teenDetail.resolved_variant.article_variant_id
});

assertCondition(listQueuedEvents().length === 2, "Event queue should record attempts");

setRuntimeMode("remote");
const cachedFeed = await loadFeedSnapshot();
assertCondition(
  cachedFeed.source === "cache" || (cachedFeed.source === "runtime" && cachedFeed.syncDelta?.fallback_used),
  "Remote stub should stay fixture-backed when switching runtime"
);

console.log(
  JSON.stringify(
    {
      status: "passed",
      runtime_mode: getSessionState().runtimeMode,
      feed_state: feed.state,
      cached_feed_state: cachedFeed.state,
      teen_variant_audience: teenDetail.resolved_variant.audience_segment,
      adult_variant_mode: adultDetail.resolved_variant.reading_mode,
      pricing_preview_display: formatFenToPrice(pricing.previews[0].final_amount_fen),
      event_attempts: listQueuedEvents().length
    },
    null,
    2
  )
);
