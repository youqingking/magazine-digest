const modeLabelMap = {
  quick_30s: "30 秒摘要",
  deep_3m: "3 分钟精读"
};

const audienceLabelMap = {
  teen: "青少年",
  general: "通用",
  adult: "成人"
};

export function formatReadingModeLabel(mode) {
  return modeLabelMap[mode] || mode || "Unknown mode";
}

export function formatAudienceLabel(audience) {
  return audienceLabelMap[audience] || audience || "Unknown audience";
}

export function formatIsoMeta(isoString) {
  if (!isoString) {
    return "No timestamp";
  }

  const parts = String(isoString).split("T");
  if (parts.length < 2) {
    return isoString;
  }

  return parts[0] + " " + parts[1].slice(0, 5);
}

export function buildFeedCardMeta(article) {
  const meta = [];

  if (article.publication_id) {
    meta.push(article.publication_id);
  }

  if (article.updated_at) {
    meta.push("Updated " + formatIsoMeta(article.updated_at));
  }

  return meta;
}

export function buildFeedCardChips(article) {
  const chips = [];

  (article.available_modes || []).forEach((mode) => {
    chips.push({
      label: formatReadingModeLabel(mode),
      tone: mode === "deep_3m" ? "accent" : "neutral"
    });
  });

  (article.available_audiences || []).forEach((audience) => {
    chips.push({
      label: formatAudienceLabel(audience),
      tone: audience === "adult" ? "muted" : "neutral"
    });
  });

  if (article.updated_at) {
    chips.push({
      label: "Updated",
      tone: "info"
    });
  }

  return chips;
}

export function buildDetailMeta(detail, entitlement) {
  const items = [];

  if (detail && detail.selection_reason) {
    items.push("Selection " + detail.selection_reason);
  }

  if (detail && detail.resolved_variant) {
    items.push("Revision " + detail.resolved_variant.revision);
    items.push(formatAudienceLabel(detail.resolved_variant.audience_segment));
    items.push(formatReadingModeLabel(detail.resolved_variant.reading_mode));
  }

  if (entitlement && entitlement.access_state) {
    items.push("Access " + entitlement.access_state);
  }

  return items;
}

export function buildAudienceHint(currentAudience, resolvedAudience) {
  if (!currentAudience) {
    return "当前内容会按适读人群自动选择。";
  }

  if (!resolvedAudience || currentAudience === resolvedAudience) {
    return "当前显示的是" + formatAudienceLabel(currentAudience) + "版本。";
  }

  return "当前为" + formatAudienceLabel(currentAudience) + "优先展示" + formatAudienceLabel(resolvedAudience) + "可用版本。";
}
