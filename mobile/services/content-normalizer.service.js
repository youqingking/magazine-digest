const NOISE_PATTERNS = [
  /^(下面是|以下是|这里是|我来|我将|先来|让我们|总结如下|摘要如下|改写如下|处理结果|输出如下|输出格式|处理说明|系统提示|提示词|思考过程|推理过程|模型自述)/i,
  /^(prompt|system prompt|assistant|user|json|yaml|markdown|template|field|schema|instruction)/i,
  /(真实样本导入|runtime fixture|selection_reason|fallback_applied|source_field|content_hash|article_variant_id|publish_batch_id)/i
];

const META_LABEL_PATTERNS = [
  /^核心结论[:：]\s*/i,
  /^一句话摘要[:：]\s*/i,
  /^摘要[:：]\s*/i,
  /^总结[:：]\s*/i,
  /^结论[:：]\s*/i
];

const WHY_LABEL_PATTERNS = [
  /^为什么重要[:：]\s*/i,
  /^why it matters[:：]\s*/i,
  /^影响[:：]\s*/i
];

const FACT_LABEL_PATTERNS = [
  /^关键数字[:：]\s*/i,
  /^关键事实[:：]\s*/i,
  /^key facts?[:：]\s*/i
];

function normalizeWhitespace(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripMarkdownNoise(text = "") {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*```[a-zA-Z0-9_-]*\s*$/gm, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1");
}

function isJsonLikeLine(line = "") {
  const value = String(line || "").trim();
  if (!value) {
    return true;
  }

  if (/^[\[{].*[\]}]$/.test(value)) {
    return true;
  }

  if (/^"[^"]+"\s*:\s*/.test(value)) {
    return true;
  }

  if (/^[A-Za-z0-9_.-]+\s*:\s*(null|true|false|\[|\{|"|[\d-])/.test(value)) {
    return true;
  }

  return false;
}

function isNoiseLine(line = "") {
  const value = String(line || "").trim();
  if (!value) {
    return true;
  }

  if (NOISE_PATTERNS.some((pattern) => pattern.test(value))) {
    return true;
  }

  if (/^(---|===|\*\*\*)$/.test(value)) {
    return true;
  }

  if (isJsonLikeLine(value)) {
    return true;
  }

  return false;
}

function cleanLine(line = "") {
  return normalizeWhitespace(stripMarkdownNoise(String(line || "")))
    .replace(/\s+([，。；：！？、])/g, "$1")
    .replace(/([（《“])\s+/g, "$1")
    .replace(/\s+([）》”])/g, "$1")
    .trim();
}

function dedupeStrings(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item || "").trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function cleanTextPreservingParagraphs(text = "") {
  const cleanedLines = String(text || "")
    .split("\n")
    .map((line) => cleanLine(line))
    .filter((line) => !isNoiseLine(line));

  return normalizeWhitespace(cleanedLines.join("\n"));
}

function splitSentences(text = "") {
  const normalized = String(text || "").replace(/\r/g, "\n");
  const sentenceMatches = normalized.match(/[^。！？!?;\n]+[。！？!?]?/g) || [];
  const lineMatches = normalized
    .split(/\n+/)
    .map((part) => cleanLine(part))
    .filter(Boolean);
  return dedupeStrings(sentenceMatches.concat(lineMatches).map((part) => cleanLine(part)).filter(Boolean));
}

function splitClauses(text = "") {
  const normalized = String(text || "").replace(/\r/g, "\n");
  const clauses = normalized
    .replace(/[。！？!?]/g, "$&\n")
    .split(/[；;\n]+/)
    .map((part) => cleanLine(part))
    .filter(Boolean);
  return dedupeStrings(clauses);
}

function extractLabeledValue(text = "", patterns = []) {
  const value = cleanLine(text);
  const matched = patterns.find((pattern) => pattern.test(value));
  if (!matched) {
    return "";
  }
  return value.replace(matched, "").trim();
}

function pickLead(text = "") {
  const cleaned = cleanLine(text);
  if (!cleaned) {
    return "";
  }

  const explicitLead = extractLabeledValue(cleaned, META_LABEL_PATTERNS);
  if (explicitLead) {
    return explicitLead;
  }

  return splitSentences(cleaned)[0] || cleaned;
}

function splitLeadAndDetail(text = "") {
  const cleaned = cleanLine(text);
  if (!cleaned) {
    return {
      lead: "",
      detail: ""
    };
  }

  const colonIndex = cleaned.search(/[:：]/);
  if (colonIndex > 0 && colonIndex < 28) {
    const lead = cleaned.slice(0, colonIndex).trim();
    const detail = cleaned.slice(colonIndex + 1).trim();
    if (lead && detail) {
      return {
        lead,
        detail
      };
    }
  }

  return {
    lead: pickLead(cleaned),
    detail: cleaned
  };
}

function pickBulletCandidates(text = "", lead = "", detail = "") {
  const cleaned = cleanLine(detail || text);
  if (!cleaned) {
    return [];
  }

  const withoutLead = lead ? cleaned.replace(lead, "").replace(/^[:：，、]\s*/, "") : cleaned;
  const clauses = splitClauses(withoutLead);
  const bullets = clauses.filter((part) => {
    if (!part || part === lead) {
      return false;
    }
    if (part.length < 3) {
      return false;
    }
    if (NOISE_PATTERNS.some((pattern) => pattern.test(part))) {
      return false;
    }
    return true;
  });

  return dedupeStrings(bullets).slice(0, 4);
}

function pickSupportingNote(text = "", patterns = []) {
  return extractLabeledValue(text, patterns);
}

export function sanitizePlainText(text = "") {
  return cleanTextPreservingParagraphs(text);
}

export function sanitizeMarkdownBody(text = "") {
  const cleaned = String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => cleanTextPreservingParagraphs(paragraph))
    .filter(Boolean)
    .join("\n\n");

  return cleaned;
}

export function buildReadableParagraphs(text = "", limit = 3) {
  const cleaned = sanitizePlainText(text);
  if (!cleaned) {
    return [];
  }

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((part) => cleanLine(part))
    .filter(Boolean);

  if (paragraphs.length) {
    return paragraphs.slice(0, limit);
  }

  return splitSentences(cleaned).slice(0, limit);
}

export function buildSummaryDigest(source = {}) {
  const baseText = sanitizePlainText(
    source.quick_preview_body ||
      source.quick_body ||
      source.summary ||
      source.body_preview ||
      source.body ||
      source.markdown_body ||
      ""
  );
  const changeNote = sanitizePlainText(source.change_summary || "");
  const leadParts = splitLeadAndDetail(baseText);
  const lead = leadParts.lead;
  const bullets = pickBulletCandidates(baseText, lead, leadParts.detail);
  const whyItMatters = pickSupportingNote(changeNote, WHY_LABEL_PATTERNS);
  const keyFact = pickSupportingNote(changeNote, FACT_LABEL_PATTERNS);
  const paragraphs = buildReadableParagraphs(baseText, 2);

  return {
    lead,
    bullets,
    whyItMatters,
    keyFact,
    paragraphs,
    fullText: baseText,
    isMeaningful: Boolean(lead || bullets.length || paragraphs.length)
  };
}

export function normalizeContentItem(item = {}) {
  const normalized = {
    ...item,
    title: sanitizePlainText(item.title || ""),
    summary: sanitizePlainText(item.summary || item.body_preview || item.body || ""),
    change_summary: sanitizePlainText(item.change_summary || ""),
    quick_preview_body: sanitizePlainText(item.quick_preview_body || "")
  };

  normalized.reading_digest = buildSummaryDigest(normalized);
  return normalized;
}

export function normalizeDiscoveryResponse(response = {}) {
  return {
    ...response,
    modules: (response.modules || []).map((section) => ({
      ...section,
      items: (section.items || []).map((item) => normalizeContentItem(item))
    }))
  };
}

export function normalizeSearchResponse(response = {}) {
  return {
    ...response,
    items: (response.items || []).map((item) => normalizeContentItem(item))
  };
}

export function normalizeDetailPayload(detail = {}) {
  if (!detail || typeof detail !== "object") {
    return detail;
  }

  const normalizedArticle = detail.article
    ? {
        ...detail.article,
        title: sanitizePlainText(detail.article.title || ""),
        summary: sanitizePlainText(detail.article.summary || "")
      }
    : detail.article;

  const normalizedVariant = detail.resolved_variant
    ? {
        ...detail.resolved_variant,
        title: sanitizePlainText(detail.resolved_variant.title || ""),
        change_summary: sanitizePlainText(detail.resolved_variant.change_summary || ""),
        markdown_body: sanitizeMarkdownBody(detail.resolved_variant.markdown_body || "")
      }
    : detail.resolved_variant;

  return {
    ...detail,
    article: normalizedArticle,
    resolved_variant: normalizedVariant,
    reading_digest: buildSummaryDigest({
      summary: normalizedArticle?.summary || "",
      markdown_body: normalizedVariant?.reading_mode === "quick_30s" ? normalizedVariant?.markdown_body || "" : "",
      change_summary: normalizedVariant?.change_summary || ""
    })
  };
}
