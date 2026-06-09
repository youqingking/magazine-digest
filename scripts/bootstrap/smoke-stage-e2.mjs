import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import currentRuntimeFixtures from "../../mobile/fixtures/runtime/current/index.js";
import { tokens } from "../../mobile/theme/tokens.js";
import { typography } from "../../mobile/theme/typography.js";
import { formatMoneyFromFen } from "../../mobile/utils/format-money.js";
import { buildAudienceHint, buildFeedCardChips, formatReadingModeLabel } from "../../mobile/utils/format-reading-meta.js";
import { loadFeedSnapshot } from "../../mobile/services/content-sync.service.js";
import { runtimeGateway } from "../../mobile/services/runtime-gateway.service.js";
import { getReaderState, setAudienceMode, setCurrentArticle, setReadingMode } from "../../mobile/stores/reader.store.js";
import { resetSessionState, setRuntimeMode } from "../../mobile/stores/session.store.js";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "../../output/stage-e2");

fs.mkdirSync(outputDir, { recursive: true });

resetSessionState();
setRuntimeMode("local");

const feed = await loadFeedSnapshot();
assertCondition(feed.articles.length > 0, "Feed must contain at least one article in Stage E2 smoke");

const firstArticle = feed.articles[0];
const availableAdultEntry =
  Object.entries(currentRuntimeFixtures.contentDetail.responses).find(
    ([key, value]) => key.startsWith(`${firstArticle.article_id}|zh-CN|adult|deep_3m`) && value.resolved_variant
  ) ||
  Object.entries(currentRuntimeFixtures.contentDetail.responses).find(
    ([key, value]) => key.startsWith(`${firstArticle.article_id}|zh-CN|adult|`) && value.resolved_variant
  );

setCurrentArticle(firstArticle.article_id);
setAudienceMode("adult");
setReadingMode(availableAdultEntry && availableAdultEntry[0].endsWith("|deep_3m") ? "deep_3m" : "quick_30s");

const detail = await runtimeGateway.getContentDetail({
  article_id: firstArticle.article_id,
  language: "zh-CN",
  audience_segment: getReaderState().audienceMode,
  reading_mode: getReaderState().readingMode,
  request_id: "req_stage_e2_smoke"
});

assertCondition(Boolean(tokens.colors.accentPrimary), "Theme tokens must expose accentPrimary");
assertCondition(Boolean(typography.body.fontSize), "Typography must expose body size");
assertCondition(formatMoneyFromFen(3000) === "CNY 30.00", "Fen formatting must remain canonical");
assertCondition(formatReadingModeLabel("quick_30s") === "Quick 30s", "Reading mode labels must format");
assertCondition(buildFeedCardChips(firstArticle).length > 0, "Feed chip formatting must produce chips");
assertCondition(Boolean(detail.resolved_variant), "Stage E2 smoke requires a readable detail variant");
assertCondition(
  buildAudienceHint("adult", detail.resolved_variant.audience_segment).indexOf("Adult") >= 0,
  "Audience hint should reflect the active audience"
);

setRuntimeMode("remote");
const cachedFeed = await loadFeedSnapshot();
assertCondition(
  cachedFeed.source === "cache" || (cachedFeed.source === "runtime" && cachedFeed.syncDelta?.fallback_used),
  "Remote stub should remain fixture-backed in Stage E2 smoke"
);

const report = {
  status: "passed",
  token_roles: Object.keys(tokens.colors),
  typography_roles: Object.keys(typography),
  formatted_money: formatMoneyFromFen(3000),
  formatted_mode: formatReadingModeLabel(detail.resolved_variant.reading_mode),
  feed_state: feed.state,
  article_id: firstArticle.article_id,
  detail_mode: detail.resolved_variant.reading_mode,
  cached_feed_state: cachedFeed.state
};

fs.writeFileSync(path.join(outputDir, "smoke-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
