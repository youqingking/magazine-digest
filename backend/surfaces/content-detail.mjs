import {
  assertAudienceSegment,
  assertProductKey,
  assertReadingMode,
  assertRequiredString
} from "../guards/request-guards.mjs";

function isReadableVariant(variant, now) {
  if (variant.is_deleted) {
    return false;
  }

  if (variant.publish_status === "published") {
    return true;
  }

  return variant.publish_status === "scheduled" && variant.publish_at <= now;
}

function buildAudienceOrder(audienceSegment) {
  if (audienceSegment === "teen") {
    return ["teen", "general"];
  }
  if (audienceSegment === "adult") {
    return ["adult", "general"];
  }
  return ["general"];
}

export function createContentDetailSurface({ repository, runtimeConfig }) {
  return function contentDetail(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const articleId = assertRequiredString("article_id", request.article_id);
    const language = assertRequiredString("language", request.language);
    const audienceSegment = assertAudienceSegment(request.audience_segment);
    const readingMode = assertReadingMode(request.reading_mode);
    const article = repository.getArticle(articleId, productKey);
    const variants = repository
      .listArticleVariants(productKey)
      .filter(
        (item) =>
          item.article_id === articleId &&
          item.language === language &&
          item.reading_mode === readingMode &&
          isReadableVariant(item, runtimeConfig.now)
      )
      .sort((left, right) => right.revision - left.revision);

    const audienceOrder = buildAudienceOrder(audienceSegment);
    const resolvedVariant = audienceOrder
      .map((segment) =>
        variants.find((item) => item.audience_segment === segment) ?? null
      )
      .find(Boolean);

    if (!resolvedVariant) {
      return {
        article: article
          ? {
              article_id: article._id,
              article_key: article.article_key,
              title: article.title,
              summary: article.summary
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
        article_id: article._id,
        article_key: article.article_key,
        title: article.title,
        summary: article.summary
      },
      resolved_variant: {
        article_variant_id: resolvedVariant._id,
        audience_segment: resolvedVariant.audience_segment,
        reading_mode: resolvedVariant.reading_mode,
        revision: resolvedVariant.revision,
        title: resolvedVariant.title,
        markdown_body: resolvedVariant.markdown_body,
        content_hash: resolvedVariant.content_hash
      },
      selection_reason:
        resolvedVariant.audience_segment === audienceSegment
          ? "exact_match"
          : "safe_fallback",
      fallback_applied: resolvedVariant.audience_segment !== audienceSegment,
      unavailable_reason: null
    };
  };
}
