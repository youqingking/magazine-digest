function cleanText(value = "") {
  return String(value || "").replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function normalizeCompare(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[“”"'‘’`~!@#$%^&*()_+=\-[\]{};:,.<>/?|\\]/g, "")
    .replace(/[（）【】《》、，。；：！？]/g, "");
}

function buildBlocker({ code, message, level = "error", articleId = null, title = null, field = null, details = null }) {
  return {
    code,
    level,
    article_id: articleId,
    title,
    field,
    message,
    details: details || null
  };
}

function hasMeaningfulText(value, minimumLength = 1) {
  return cleanText(value).length >= minimumLength;
}

function isPlaceholderTitle(title) {
  const normalized = normalizeCompare(title);
  return ["untitledarticle", "untitled", "无标题", "阅读详情", "article"].includes(normalized);
}

function buildSummaryPrefix(summary = "", quickBody = "") {
  const summaryText = cleanText(summary);
  const quickText = cleanText(quickBody);
  if (!summaryText || !quickText) {
    return false;
  }
  const compareLength = Math.min(Math.max(12, Math.min(summaryText.length, 32)), quickText.length, summaryText.length);
  return normalizeCompare(quickText.slice(0, compareLength)) === normalizeCompare(summaryText.slice(0, compareLength));
}

function validateRecord(record, options = {}) {
  const blockers = [];
  const articleId = record.article_id || null;
  const title = cleanText(record.title);
  const summary = cleanText(record.summary);
  const quickAdult = cleanText(record.quick_30s);
  const deepAdult = cleanText(record.deep_3m);
  const quickTeen = cleanText(record.teen_quick_30s);
  const deepTeen = cleanText(record.teen_deep_3m);
  const quickGeneral = cleanText(record.general_quick_30s);
  const deepGeneral = cleanText(record.general_deep_3m);
  const importWarnings = Array.isArray(record.import_warnings) ? record.import_warnings : [];

  if (!hasMeaningfulText(articleId, 3)) {
    blockers.push(buildBlocker({
      code: "missing_article_id",
      articleId,
      title,
      field: "article_id",
      message: "article_id 缺失，无法建立稳定内容主键。"
    }));
  }

  if (!hasMeaningfulText(record.article_uid, 3)) {
    blockers.push(buildBlocker({
      code: "missing_article_uid",
      articleId,
      title,
      field: "article_uid",
      message: "article_uid 缺失，无法建立稳定内容映射。"
    }));
  }

  if (!hasMeaningfulText(title, 2) || isPlaceholderTitle(title)) {
    blockers.push(buildBlocker({
      code: "invalid_title",
      articleId,
      title,
      field: "title",
      message: "标题缺失或仍是占位值，不能进入导入。"
    }));
  }

  if (!hasMeaningfulText(summary, 12)) {
    blockers.push(buildBlocker({
      code: "missing_summary",
      articleId,
      title,
      field: "summary",
      message: "摘要缺失或过短，30 秒流内阅读无法成立。"
    }));
  }

  if (!hasMeaningfulText(quickAdult, 24)) {
    blockers.push(buildBlocker({
      code: "missing_adult_quick_30s",
      articleId,
      title,
      field: "quick_30s",
      message: "成人版 quick_30s 缺失或过短。"
    }));
  }
  if (!hasMeaningfulText(deepAdult, 80)) {
    blockers.push(buildBlocker({
      code: "missing_adult_deep_3m",
      articleId,
      title,
      field: "deep_3m",
      message: "成人版 deep_3m 缺失或过短。"
    }));
  }
  if (!hasMeaningfulText(quickTeen, 24)) {
    blockers.push(buildBlocker({
      code: "missing_teen_quick_30s",
      articleId,
      title,
      field: "teen_quick_30s",
      message: "青少年版 quick_30s 缺失或过短。"
    }));
  }
  if (!hasMeaningfulText(deepTeen, 80)) {
    blockers.push(buildBlocker({
      code: "missing_teen_deep_3m",
      articleId,
      title,
      field: "teen_deep_3m",
      message: "青少年版 deep_3m 缺失或过短。"
    }));
  }
  if (!hasMeaningfulText(quickGeneral, 24)) {
    blockers.push(buildBlocker({
      code: "missing_general_quick_30s",
      articleId,
      title,
      field: "general_quick_30s",
      message: "通用版 quick_30s 缺失或过短。"
    }));
  }
  if (!hasMeaningfulText(deepGeneral, 80)) {
    blockers.push(buildBlocker({
      code: "missing_general_deep_3m",
      articleId,
      title,
      field: "general_deep_3m",
      message: "通用版 deep_3m 缺失或过短。"
    }));
  }

  if (summary && quickGeneral && !buildSummaryPrefix(summary, quickGeneral)) {
    blockers.push(buildBlocker({
      code: "summary_quick_mismatch",
      articleId,
      title,
      field: "summary",
      message: "summary 与 quick_30s 前缀不一致，疑似标题/摘要/正文串位。",
      details: {
        summary_preview: summary.slice(0, 40),
        quick_preview: quickGeneral.slice(0, 40)
      }
    }));
  }

  const fatalWarningCodes = new Set([
    "adult_content_incomplete",
    "youth_content_incomplete",
    "adult_youth_title_mismatch",
    "adult_youth_original_title_mismatch",
    "merged_title_mismatch"
  ]);

  importWarnings
    .filter((warning) => fatalWarningCodes.has(warning))
    .forEach((warning) => {
      blockers.push(buildBlocker({
        code: warning,
        articleId,
        title,
        field: "import_warnings",
        message: `导入解析命中致命告警：${warning}`
      }));
    });

  return {
    article_id: articleId,
    title,
    is_valid: blockers.length === 0,
    blockers
  };
}

function buildPackageLevelBlockers({ parserWarnings = [], parserSignals = {}, route = null }) {
  const blockers = [];
  parserWarnings.forEach((warning) => {
    if (warning?.type === "missing_youth_pair") {
      blockers.push(buildBlocker({
        code: "missing_youth_pair",
        field: "package",
        message: `存在 adult 文件缺少 youth 配对：${warning.adult_file || "unknown"}`,
        details: {
          route,
          adult_file: warning.adult_file || null
        }
      }));
    }
  });

  if (Number(parserSignals.title_conflict_count || 0) > 0) {
    blockers.push(buildBlocker({
      code: "title_conflict",
      field: "package",
      message: `目录标题 / TOC 标题存在 ${parserSignals.title_conflict_count} 处冲突。`,
      details: {
        conflicts: parserSignals.title_conflict_count
      }
    }));
  }

  if (Array.isArray(parserSignals.missing_block_records) && parserSignals.missing_block_records.length > 0) {
    blockers.push(buildBlocker({
      code: "missing_required_variants",
      field: "package",
      message: `存在 ${parserSignals.missing_block_records.length} 篇文章缺少必要 variant。`,
      details: {
        records: parserSignals.missing_block_records
      }
    }));
  }

  return blockers;
}

export function buildContentPackageGateReport({
  records = [],
  route = null,
  sourcePack = null,
  publicationId = null,
  issueLabel = null,
  parserWarnings = [],
  parserSignals = {}
} = {}) {
  const seenArticleIds = new Set();
  const recordResults = records.map((record) => validateRecord(record));
  const duplicateBlockers = [];
  const zeroRecordBlockers = records.length === 0
    ? [
        buildBlocker({
          code: "no_publishable_records",
          field: "package",
          message: "内容包未解析出任何文章记录，已阻止导入。"
        })
      ]
    : [];

  recordResults.forEach((result) => {
    if (!result.article_id) {
      return;
    }
    if (seenArticleIds.has(result.article_id)) {
      duplicateBlockers.push(buildBlocker({
        code: "duplicate_article_id",
        articleId: result.article_id,
        title: result.title,
        field: "article_id",
        message: `article_id 重复：${result.article_id}`
      }));
      return;
    }
    seenArticleIds.add(result.article_id);
  });

  const packageLevelBlockers = buildPackageLevelBlockers({
    parserWarnings,
    parserSignals,
    route
  });
  const blockedResults = recordResults.filter((result) => !result.is_valid);
  const validResults = recordResults.filter((result) => result.is_valid);

  return {
    generated_at: new Date().toISOString(),
    status: packageLevelBlockers.length || duplicateBlockers.length || zeroRecordBlockers.length || blockedResults.length ? "blocked" : "ok",
    error_code: packageLevelBlockers.length || duplicateBlockers.length || zeroRecordBlockers.length || blockedResults.length ? "CONTENT_PACKAGE_GATE_BLOCKED" : null,
    route,
    source_pack: sourcePack,
    publication_id: publicationId,
    issue_label: issueLabel,
    record_count: records.length,
    valid_record_count: validResults.length,
    blocked_record_count: blockedResults.length,
    blocker_count:
      zeroRecordBlockers.length +
      packageLevelBlockers.length +
      duplicateBlockers.length +
      blockedResults.reduce((sum, result) => sum + result.blockers.length, 0),
    package_level_blockers: zeroRecordBlockers.concat(packageLevelBlockers, duplicateBlockers),
    blocked_records: blockedResults.map((result) => ({
      article_id: result.article_id,
      title: result.title,
      blockers: result.blockers
    })),
    valid_article_ids: validResults.map((result) => result.article_id)
  };
}

export function assertContentPackageGate(report, message = "内容包未通过导入门禁") {
  if (!report || report.status === "ok") {
    return;
  }
  const error = new Error(`${report.error_code || "CONTENT_PACKAGE_GATE_BLOCKED"}:${report.blocker_count}`);
  error.code = report.error_code || "CONTENT_PACKAGE_GATE_BLOCKED";
  error.report = report;
  error.user_message = message;
  throw error;
}

export function filterPublishableRecords(records = []) {
  const report = buildContentPackageGateReport({ records });
  const validIdSet = new Set(report.valid_article_ids || []);
  return {
    report,
    validRecords: records.filter((record) => validIdSet.has(record.article_id))
  };
}
