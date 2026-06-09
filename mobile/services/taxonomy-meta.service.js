import { recordObservabilityEvent } from "./observability.service.js";
import { formatIssueDisplayLabel, getIssueMeta } from "../shared/utils/issue-meta.js";

function joinMeta(parts = []) {
  return parts.filter(Boolean).join(" · ");
}

const bucketLabelMap = {
  news: "新闻",
  business: "商业",
  opinion: "观点",
  culture: "文化",
  lifestyle: "生活",
  essays: "特写",
  international: "国际",
  markets: "市场",
  investing: "投资",
  companies: "公司",
  technology: "科技",
  world_dispatch: "国际",
  feature: "特写",
  cover_story: "封面",
  departments: "专栏",
  briefing: "速览",
  letters: "来信"
};

export function localizedDiscoveryBucket(value = "") {
  return bucketLabelMap[value] || value || "";
}

export function canonicalSectionLabel(item = {}) {
  if (!item.canonical_section_label && !item.discovery_bucket && (item.raw_section_label || item.section_label)) {
    void recordObservabilityEvent({
      event_type: "unmapped_taxonomy_encountered",
      source_surface: "app",
      severity: "warning",
      publication_id: item.publication_id || item.publication_key || null,
      article_id: item.article_id || null,
      warning_taxonomy: ["taxonomy_unmapped"],
      details: {
        raw_section_label: item.raw_section_label || item.section_label || null
      }
    });
  }
  return item.canonical_section_label || localizedDiscoveryBucket(item.discovery_bucket) || item.raw_section_label || item.section_label || "";
}

export function rawSectionLabel(item = {}) {
  return item.raw_section_label || item.section_label || "";
}

export function taxonomySummaryLabel(item = {}) {
  const canonical = canonicalSectionLabel(item);
  const raw = rawSectionLabel(item);
  if (canonical && raw && canonical !== raw) {
    return `${canonical} · ${raw}`;
  }
  return canonical || raw;
}

export function issueDisplayLabel(value = {}) {
  if (typeof value === "string") {
    return formatIssueDisplayLabel(value);
  }
  return getIssueMeta(value).issue_display_label || "";
}

export function issueSummaryLabel(item = {}) {
  const issueMeta = getIssueMeta(item);
  return issueMeta.issue_display_label || issueMeta.issue_label || "";
}

export function discoveryKicker(item = {}) {
  return joinMeta([
    item.publication_name || item.publication_key || item.publication_id || "",
    issueSummaryLabel(item),
    item.canonical_section_label || localizedDiscoveryBucket(item.discovery_bucket) || ""
  ]);
}

export function discoveryMetaLine(item = {}) {
  return joinMeta([
    localizedDiscoveryBucket(item.discovery_bucket) || "",
    item.raw_section_label || item.section_label || ""
  ]);
}
