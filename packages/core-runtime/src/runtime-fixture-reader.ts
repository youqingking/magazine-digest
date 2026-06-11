export type RuntimeFixtureBundle = {
  metadata?: Record<string, unknown>;
  bootstrapConfig?: { response?: Record<string, unknown> };
  contentSyncDelta?: { response?: { items?: unknown[]; tombstones?: unknown[] } };
  contentDetail?: { responses?: Record<string, RuntimeFixtureDetailResponse> };
  discoveryCatalog?: { items?: unknown[] };
  surfaceStatus?: unknown[];
};

export type RuntimeFixtureDetailResponse = {
  article?: Record<string, unknown>;
  resolved_variant?: Record<string, unknown> | null;
  selection_reason?: string | null;
  fallback_applied?: boolean;
  unavailable_reason?: string | null;
};

export type RuntimeShellMetadata = {
  productKey: string;
  scenarioId: string;
  runtimeNow: string;
  sourceKind: string;
  sourceLabel: string;
  requestedScenarioId: string;
};

export type RuntimeShellArticle = {
  articleId: string;
  articleKey: string;
  title: string;
  summary: string;
  publicationKey: string;
  publicationName: string;
  issueLabel: string;
  primaryAudience: string;
  primaryReadingMode: string;
};

export type RuntimeShellDetail = {
  detailKey: string;
  articleId: string;
  title: string;
  markdownBody: string;
  audienceSegment: string;
  readingMode: string;
  revision: number;
  unavailableReason: string | null;
};

export type RuntimeShellState =
  | {
      status: "ready";
      metadata: RuntimeShellMetadata;
      articles: RuntimeShellArticle[];
      detailsByArticleId: Record<string, RuntimeShellDetail>;
      surfaceCount: number;
    }
  | {
      status: "empty";
      metadata: RuntimeShellMetadata;
      articles: [];
      detailsByArticleId: Record<string, never>;
      surfaceCount: number;
      message: string;
    }
  | {
      status: "unavailable";
      metadata: RuntimeShellMetadata;
      reason: "missing_env" | "not_implemented";
      missingEnv: string[];
      message: string;
    }
  | {
      status: "missing";
      message: string;
    };

export type RuntimeShellBuildOptions = {
  sourceLabel?: string;
  requestedScenarioId?: string;
};

export function buildRuntimeShellState(
  bundle: RuntimeFixtureBundle | null | undefined,
  options: RuntimeShellBuildOptions = {}
): RuntimeShellState {
  if (!bundle) {
    return {
      status: "missing",
      message: "No selected runtime fixture bundle was available; using documented local fallback."
    };
  }

  const metadata = buildMetadata(bundle, options);
  const detailResponses = bundle.contentDetail?.responses || {};
  const articles = buildArticles(bundle);
  const detailsByArticleId = buildDetailsByArticleId(articles, detailResponses);
  const surfaceCount = Array.isArray(bundle.surfaceStatus) ? bundle.surfaceStatus.length : 0;

  if (articles.length === 0) {
    return {
      status: "empty",
      metadata,
      articles: [],
      detailsByArticleId: {},
      surfaceCount,
      message: "The fixture loaded, but discoveryCatalog did not expose article rows."
    };
  }

  return {
    status: "ready",
    metadata,
    articles,
    detailsByArticleId,
    surfaceCount
  };
}

export type RuntimeShellUnavailableOptions = {
  productKey: string;
  sourceKind: string;
  sourceLabel: string;
  requestedScenarioId?: string;
  runtimeNow?: string;
  reason: "missing_env" | "not_implemented";
  missingEnv?: string[];
  message: string;
};

export function buildUnavailableRuntimeShellState(options: RuntimeShellUnavailableOptions): RuntimeShellState {
  return {
    status: "unavailable",
    metadata: {
      productKey: options.productKey,
      scenarioId: "unavailable",
      runtimeNow: options.runtimeNow || "not provided",
      sourceKind: options.sourceKind,
      sourceLabel: options.sourceLabel,
      requestedScenarioId: options.requestedScenarioId || "current"
    },
    reason: options.reason,
    missingEnv: options.missingEnv || [],
    message: options.message
  };
}

function buildMetadata(bundle: RuntimeFixtureBundle, options: RuntimeShellBuildOptions): RuntimeShellMetadata {
  const metadata = bundle.metadata || {};
  const bootstrapProduct = bundle.bootstrapConfig?.response?.product as Record<string, unknown> | undefined;
  const productKey = readString(metadata.product_key) || readString(bootstrapProduct?.product_key) || "fixture_unknown";
  const scenarioId =
    readString(metadata.selected_scenario_id) ||
    readString(metadata.scenario_id) ||
    options.requestedScenarioId ||
    "fixture_unknown";

  return {
    productKey,
    scenarioId,
    runtimeNow: readString(metadata.runtime_now) || "not provided",
    sourceKind: readString(metadata.source_kind) || "fixture",
    sourceLabel: options.sourceLabel || "mobile runtime fixture",
    requestedScenarioId: options.requestedScenarioId || "current"
  };
}

function buildArticles(bundle: RuntimeFixtureBundle): RuntimeShellArticle[] {
  const discoveryItems = Array.isArray(bundle.discoveryCatalog?.items) ? bundle.discoveryCatalog?.items || [] : [];
  const syncItems = Array.isArray(bundle.contentSyncDelta?.response?.items)
    ? bundle.contentSyncDelta?.response?.items || []
    : [];
  const sourceItems = discoveryItems.length > 0 ? discoveryItems : syncItems;
  const seen = new Set<string>();
  const articles: RuntimeShellArticle[] = [];

  for (const item of sourceItems) {
    const row = asRecord(item);
    const articleId = readString(row.article_id);
    if (!articleId || seen.has(articleId)) {
      continue;
    }
    seen.add(articleId);
    articles.push({
      articleId,
      articleKey: readString(row.article_key) || articleId,
      title: readString(row.title) || "Untitled fixture article",
      summary: readString(row.summary),
      publicationKey: readString(row.publication_key),
      publicationName: readString(row.publication_name) || readString(row.publication_key),
      issueLabel: readString(row.issue_display_label) || readString(row.issue_label),
      primaryAudience: readString(row.primary_audience) || "general",
      primaryReadingMode: readString(row.primary_reading_mode) || "quick_30s"
    });
  }

  return articles.slice(0, 30);
}

function buildDetailsByArticleId(
  articles: RuntimeShellArticle[],
  detailResponses: Record<string, RuntimeFixtureDetailResponse>
): Record<string, RuntimeShellDetail> {
  const entries = Object.entries(detailResponses);
  const details: Record<string, RuntimeShellDetail> = {};

  for (const article of articles) {
    const selected = selectDetailEntry(entries, article);
    if (!selected) {
      continue;
    }

    const [detailKey, response] = selected;
    const variant = response.resolved_variant || {};
    const responseArticle = response.article || {};
    details[article.articleId] = {
      detailKey,
      articleId: article.articleId,
      title: readString(variant.title) || readString(responseArticle.title) || article.title,
      markdownBody: readString(variant.markdown_body),
      audienceSegment: readString(variant.audience_segment) || article.primaryAudience,
      readingMode: readString(variant.reading_mode) || article.primaryReadingMode,
      revision: readNumber(variant.revision) || 0,
      unavailableReason: response.unavailable_reason || null
    };
  }

  return details;
}

function selectDetailEntry(
  entries: [string, RuntimeFixtureDetailResponse][],
  article: RuntimeShellArticle
): [string, RuntimeFixtureDetailResponse] | undefined {
  const articleEntries = entries.filter(([key, response]) => {
    const responseArticleId = readString(response.article?.article_id);
    return key.startsWith(`${article.articleId}|`) || responseArticleId === article.articleId;
  });

  return (
    articleEntries.find(([key]) => key.includes(`|${article.primaryAudience}|${article.primaryReadingMode}`)) ||
    articleEntries.find(([key]) => key.includes("|general|quick_30s")) ||
    articleEntries.find(([key]) => key.includes("|teen|quick_30s")) ||
    articleEntries[0]
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}
