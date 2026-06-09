const DEFAULT_LANGUAGE = "zh-CN";
const QUICK_READING_MODE = "quick_30s";
const AUDIENCE_PRIORITY = ["general", "teen", "adult"];

import { getReaderState } from "../stores/reader.store.js";
import { getIssueMeta } from "../shared/utils/issue-meta.js";

function cleanText(value = "") {
  return String(value || "").replace(/\r/g, "").trim();
}

function dedupeValues(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const key = cleanText(value);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getPreferredAudienceOrder(article = {}) {
  const readerAudience = getReaderState().audienceMode || "general";
  return dedupeValues([
    readerAudience,
    article.primary_audience,
    article.audience_segment
  ].concat(AUDIENCE_PRIORITY));
}

function buildQuickPreviewKeys(article = {}) {
  const articleId = cleanText(article.article_id);
  if (!articleId) {
    return [];
  }

  const languages = dedupeValues([article.language, article.locale, DEFAULT_LANGUAGE]);
  const audiences = getPreferredAudienceOrder(article);

  return languages.flatMap((language) =>
    audiences.map((audience) => [articleId, language, audience, QUICK_READING_MODE].join("|"))
  );
}

function resolveQuickPreviewBody(article = {}, fixtures = {}) {
  const detailResponses = fixtures?.contentDetail?.responses || {};
  const responseBody = buildQuickPreviewKeys(article)
    .map((key) => cleanText(detailResponses[key]?.resolved_variant?.markdown_body || ""))
    .find(Boolean);

  return (
    responseBody ||
    cleanText(article.quick_preview_body) ||
    cleanText(article.quick_body) ||
    cleanText(article.body_preview) ||
    cleanText(article.summary)
  );
}

export function hydrateDiscoveryItem(article = {}, fixtures = {}) {
  const quickPreviewBody = resolveQuickPreviewBody(article, fixtures);
  return {
    ...getIssueMeta(article),
    ...article,
    quick_preview_body: quickPreviewBody || cleanText(article.quick_preview_body),
    quick_body: cleanText(article.quick_body) || quickPreviewBody,
    body_preview: cleanText(article.body_preview) || quickPreviewBody
  };
}

export function hydrateDiscoveryCatalog(items = [], fixtures = {}) {
  return items.map((item) => hydrateDiscoveryItem(item, fixtures));
}

export function buildDiscoveryCardItem(article = {}, fixtures = {}, extra = {}) {
  const hydratedArticle = hydrateDiscoveryItem(article, fixtures);
  return {
    ...hydratedArticle,
    article_id: hydratedArticle.article_id || extra.article_id,
    title: hydratedArticle.title || extra.article_id || "",
    summary: hydratedArticle.summary || "",
    ...extra
  };
}
