function normalizeString(value) {
  return String(value || "").trim();
}

function padTwoDigits(value) {
  return String(value || "").padStart(2, "0");
}

function isValidMonth(value) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function isValidDay(value) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function buildDayMeta(year, month, day, sourceLabel) {
  return {
    issue_label: sourceLabel,
    issue_sort_key: `${year}${padTwoDigits(month)}${padTwoDigits(day)}`,
    issue_display_label: `${year}.${padTwoDigits(month)}.${padTwoDigits(day)}`,
    issue_precision: "day"
  };
}

function buildMonthMeta(year, month, sourceLabel) {
  return {
    issue_label: sourceLabel,
    issue_sort_key: `${year}${padTwoDigits(month)}00`,
    issue_display_label: `${year}.${padTwoDigits(month)}`,
    issue_precision: "month"
  };
}

function parseDelimitedIssueLabel(issueLabel) {
  const value = normalizeString(issueLabel);
  const matched = value.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/);
  if (!matched) {
    return null;
  }

  const [, year, month, day] = matched;
  if (!isValidMonth(month)) {
    return null;
  }
  if (day) {
    if (!isValidDay(day)) {
      return null;
    }
    return buildDayMeta(year, month, day, value);
  }
  return buildMonthMeta(year, month, value);
}

function parseCompactIssueLabel(issueLabel) {
  const value = normalizeString(issueLabel);
  if (!/^\d{6,8}$/.test(value)) {
    return null;
  }

  if (value.length === 8 && value.startsWith("20")) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    if (isValidMonth(month) && isValidDay(day)) {
      return buildDayMeta(year, month, day, value);
    }
  }

  if (value.length === 8) {
    const month = value.slice(0, 2);
    const day = value.slice(2, 4);
    const year = value.slice(4, 8);
    if (isValidMonth(month) && isValidDay(day)) {
      return buildDayMeta(year, month, day, value);
    }
  }

  if (value.length === 6 && value.startsWith("20")) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    if (isValidMonth(month)) {
      return buildMonthMeta(year, month, value);
    }
  }

  if (value.length === 6) {
    const month = value.slice(0, 2);
    const year = value.slice(2, 6);
    if (isValidMonth(month)) {
      return buildMonthMeta(year, month, value);
    }
  }

  return null;
}

function parseIssueLabel(issueLabel) {
  const value = normalizeString(issueLabel);
  if (!value) {
    return {
      issue_label: "",
      issue_sort_key: "",
      issue_display_label: "",
      issue_precision: "unknown"
    };
  }

  return (
    parseDelimitedIssueLabel(value) ||
    parseCompactIssueLabel(value) || {
      issue_label: value,
      issue_sort_key: `raw:${value.toLowerCase()}`,
      issue_display_label: value,
      issue_precision: "raw"
    }
  );
}

export function buildIssueId(publicationId, issueLabel) {
  const normalizedPublicationId = normalizeString(publicationId);
  const normalizedIssueLabel = normalizeString(issueLabel);
  if (!normalizedPublicationId || !normalizedIssueLabel) {
    return null;
  }
  return `${normalizedPublicationId}__${normalizedIssueLabel}`;
}

export function extractIssueLabelFromTags(tags = []) {
  return (tags || [])
    .map((item) => normalizeString(item))
    .find((item) => item.toLowerCase().startsWith("issue:"))
    ?.slice("issue:".length) || null;
}

export function getIssueMeta(input = {}) {
  const issueLabel = normalizeString(input.issue_label || extractIssueLabelFromTags(input.tags));
  const issueId = normalizeString(input.issue_id) || buildIssueId(input.publication_id || input.publication_key, issueLabel) || "";
  const parsed = parseIssueLabel(issueLabel);
  return {
    issue_id: issueId || null,
    issue_label: parsed.issue_label || null,
    issue_sort_key: parsed.issue_sort_key || null,
    issue_display_label: parsed.issue_display_label || null,
    issue_precision: parsed.issue_precision || "unknown"
  };
}

export function formatIssueDisplayLabel(issueLabel) {
  return parseIssueLabel(issueLabel).issue_display_label;
}

export function compareIssueMetaDescending(left = {}, right = {}) {
  const leftMeta = getIssueMeta(left);
  const rightMeta = getIssueMeta(right);
  if (leftMeta.issue_sort_key !== rightMeta.issue_sort_key) {
    return String(rightMeta.issue_sort_key || "").localeCompare(String(leftMeta.issue_sort_key || ""));
  }
  return String(rightMeta.issue_label || "").localeCompare(String(leftMeta.issue_label || ""));
}
