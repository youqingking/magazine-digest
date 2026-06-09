import fs from "node:fs";
import path from "node:path";

import { ensureDir, writeJson, writeText } from "../lib/content-pipeline.mjs";

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function normalizeCompare(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"'‘’`~!@#$%^&*()_+=\-[\]{};:,.<>/?|\\]/g, "")
    .replace(/[（）【】《》、，。；：！？]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function stripMarkdown(value) {
  return String(value || "").replace(/\*\*/g, "").trim();
}

function parseTitleLine(line) {
  const cleaned = stripMarkdown(String(line || "").replace(/^#\s+/, ""));
  const match = cleaned.match(/^(.*?)[（(]([^()（）]+)[）)]$/);
  if (match) {
    return {
      title: match[1].trim(),
      original_title: match[2].trim()
    };
  }
  return {
    title: cleaned,
    original_title: null
  };
}

function findLine(lines, pattern) {
  return lines.find((line) => pattern.test(line.trim())) || "";
}

function parseAuthor(lines) {
  const line = findLine(lines, /^-\s*Author:/i);
  const value = line.replace(/^-\s*Author:\s*/i, "").trim();
  return value || null;
}

function parseCompliance(lines) {
  const line = findLine(lines, /^-\s*合规状态:/);
  return line.replace(/^-\s*合规状态:\s*/, "").trim() || "未标注";
}

function extractBlock(text, startPattern, endPatterns) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const startIndex = lines.findIndex((line) => startPattern.test(line.trim()));
  if (startIndex < 0) {
    return "";
  }
  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (endPatterns.some((pattern) => pattern.test(lines[index].trim()))) {
      endIndex = index;
      break;
    }
  }
  return lines.slice(startIndex + 1, endIndex).join("\n").trim();
}

function parseVariantFile(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const heading = findLine(lines, /^#\s+/);
  const titleData = parseTitleLine(heading);
  const shortBody = extractBlock(
    normalized,
    /短版/,
    [/^(?:🧠|🚀)?\s*(?:长版|深度探索|深度解析)/, /^---$/]
  );
  const deepBody = extractBlock(
    normalized,
    /^(?:🧠|🚀)?\s*(?:长版|深度探索|深度解析)/,
    [/^---$/]
  );

  return {
    title: titleData.title,
    original_title: titleData.original_title,
    author: parseAuthor(lines),
    compliance_status: parseCompliance(lines),
    short_body: shortBody,
    long_body: deepBody
  };
}

function parseMergedBlocks(text) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n---\n/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const heading = lines.find((line) => /^##\s+/.test(line.trim())) || "";
      const h1 = lines.find((line) => /^#\s+/.test(line.trim())) || "";
      return {
        heading: heading.replace(/^##\s+/, "").trim(),
        title_line: h1.replace(/^#\s+/, "").trim()
      };
    })
    .filter((block) => block.heading || block.title_line);
}

function safeRead(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function deriveTitleFromMerged(block) {
  if (!block) {
    return { title: null, original_title: null };
  }
  if (block.heading) {
    return parseTitleLine(block.heading);
  }
  if (block.title_line) {
    return parseTitleLine(block.title_line);
  }
  return { title: null, original_title: null };
}

export function parseSplitAudienceRelease({
  releaseRoot,
  publicationId,
  publicationDisplayName,
  issueLabel,
  parserProfile,
  sourcePack,
  sourceReleaseDir,
  issueDataRoot,
  freeQuotaLimit = 8,
  overlay
}) {
  const adultRoot = path.join(releaseRoot, "adult");
  const youthRoot = path.join(releaseRoot, "youth");
  const mergedRoot = path.join(releaseRoot, "merged");
  const rawRoot = path.join(issueDataRoot, "raw");
  const normalizedRoot = path.join(issueDataRoot, "normalized");
  ensureDir(path.join(rawRoot, "adult"));
  ensureDir(path.join(rawRoot, "youth"));
  ensureDir(path.join(rawRoot, "merged"));
  ensureDir(normalizedRoot);

  const adultFiles = fs.readdirSync(adultRoot).filter((name) => name.endsWith(".md")).sort();
  const youthFiles = fs.readdirSync(youthRoot).filter((name) => name.endsWith(".md")).sort();
  const mergedFiles = fs.readdirSync(mergedRoot).filter((name) => name.endsWith(".md")).sort();
  const youthSet = new Set(youthFiles);
  const warnings = [];
  const pairs = adultFiles.map((adultFile, index) => {
    const youthFile = youthSet.has(adultFile) ? adultFile : youthFiles[index] || null;
    if (!youthFile) {
      warnings.push({
        type: "missing_youth_pair",
        adult_file: adultFile
      });
      return null;
    }
    return {
      basename: adultFile,
      adultFile,
      youthFile
    };
  }).filter(Boolean);

  const adultMergedPath = mergedFiles.includes("adult_merged.md") ? path.join(mergedRoot, "adult_merged.md") : null;
  const youthMergedPath = mergedFiles.includes("youth_merged.md") ? path.join(mergedRoot, "youth_merged.md") : null;
  const adultMergedBlocks = adultMergedPath ? parseMergedBlocks(safeRead(adultMergedPath)) : [];
  const youthMergedBlocks = youthMergedPath ? parseMergedBlocks(safeRead(youthMergedPath)) : [];
  if (adultMergedPath) {
    writeText(path.join(rawRoot, "merged", "adult_merged.md"), safeRead(adultMergedPath));
  }
  if (youthMergedPath) {
    writeText(path.join(rawRoot, "merged", "youth_merged.md"), safeRead(youthMergedPath));
  }

  const records = pairs.map((pair, index) => {
    const adultPath = path.join(adultRoot, pair.adultFile);
    const youthPath = path.join(youthRoot, pair.youthFile);
    const adultText = safeRead(adultPath);
    const youthText = safeRead(youthPath);
    writeText(path.join(rawRoot, "adult", pair.adultFile), adultText);
    writeText(path.join(rawRoot, "youth", pair.youthFile), youthText);

    const adultParsed = parseVariantFile(adultText);
    const youthParsed = parseVariantFile(youthText);
    const mergedAdult = adultMergedBlocks[index] || null;
    const mergedYouth = youthMergedBlocks[index] || null;
    const mergedTitle = deriveTitleFromMerged(mergedAdult || mergedYouth);
    const ordinalMatch = pair.basename.match(/^(\d{3})_/);
    const ordinal = ordinalMatch ? Number(ordinalMatch[1]) : index + 1;
    const sourceStem = pair.basename.replace(/\.md$/i, "");
    const baseRecord = {
      article_index: index + 1,
      ordinal,
      source_file_stem: sourceStem,
      article_id: `art_${publicationId}_${issueLabel}_${String(index + 1).padStart(3, "0")}`,
      article_uid: `real_${publicationId}_${issueLabel}_${String(index + 1).padStart(3, "0")}`,
      product_key: "demo_cn_content",
      publication_id: publicationId,
      publication_key: publicationId,
      publication_name: publicationDisplayName,
      publication_display_name: publicationDisplayName,
      issue_label: issueLabel,
      source_pack: sourcePack,
      source_release_dir: sourceReleaseDir,
      source_adult_path: `${sourceReleaseDir}/adult/${pair.adultFile}`,
      source_youth_path: `${sourceReleaseDir}/youth/${pair.youthFile}`,
      title: adultParsed.title || youthParsed.title || mergedTitle.title || sourceStem,
      original_title: adultParsed.original_title || youthParsed.original_title || mergedTitle.original_title || null,
      summary: adultParsed.short_body.split(/\n+/)[0].slice(0, 140),
      quick_30s: adultParsed.short_body,
      deep_3m: adultParsed.long_body,
      teen_quick_30s: youthParsed.short_body,
      teen_deep_3m: youthParsed.long_body,
      general_quick_30s: adultParsed.short_body,
      general_deep_3m: adultParsed.long_body,
      general_variant_derivation: "derived_from_adult_for_general_runtime_compat",
      audience_policy_key: "adult_to_general_compat_v1",
      compliance_status: adultParsed.compliance_status || youthParsed.compliance_status || "未标注",
      section_label: null,
      section_key: null,
      start_page: null,
      canonical_url: null,
      cover: null,
      author: adultParsed.author || youthParsed.author || null,
      tags: [`issue:${issueLabel}`, `publication:${publicationId}`],
      import_warnings: [],
      parser_profile: parserProfile,
      runtime_test_rule: {
        free_quota_limit: freeQuotaLimit,
        derived_paywall_state: index < freeQuotaLimit ? "free" : "preview_locked",
        source: "derived_from_runtime_test_rule"
      },
      publish_batch_id: `batch_${publicationId}_${issueLabel}`,
      change_summary: `${publicationDisplayName} ${issueLabel} split-audience 导入`,
      updated_at: new Date().toISOString(),
      merged_adult_heading: mergedAdult?.heading || null,
      merged_youth_heading: mergedYouth?.heading || null
    };

    if (!adultParsed.short_body || !adultParsed.long_body) {
      baseRecord.import_warnings.push("adult_content_incomplete");
    }
    if (!youthParsed.short_body || !youthParsed.long_body) {
      baseRecord.import_warnings.push("youth_content_incomplete");
    }
    if (
      adultParsed.title &&
      youthParsed.title &&
      normalizeCompare(adultParsed.title) !== normalizeCompare(youthParsed.title)
    ) {
      baseRecord.import_warnings.push("adult_youth_title_mismatch");
    }
    if (
      adultParsed.original_title &&
      youthParsed.original_title &&
      normalizeCompare(adultParsed.original_title) !== normalizeCompare(youthParsed.original_title)
    ) {
      baseRecord.import_warnings.push("adult_youth_original_title_mismatch");
    }
    if (
      mergedTitle.title &&
      baseRecord.title &&
      normalizeCompare(mergedTitle.title) !== normalizeCompare(baseRecord.title)
    ) {
      baseRecord.import_warnings.push("merged_title_mismatch");
    }

    const overlaid = overlay.applyRecordOverlay(baseRecord, {
      index,
      pair,
      adultParsed,
      youthParsed,
      mergedAdult,
      mergedYouth,
      allPairs: pairs
    });
    overlaid.section_key = overlaid.section_label ? slugify(overlaid.section_label) : null;
    overlaid.tags = Array.from(new Set([...(overlaid.tags || []), overlaid.section_label].filter(Boolean)));
    writeJson(path.join(normalizedRoot, `article-${String(index + 1).padStart(3, "0")}.json`), overlaid);
    return overlaid;
  });

  return {
    adult_count: adultFiles.length,
    youth_count: youthFiles.length,
    merged_count: mergedFiles.length,
    paired_count: pairs.length,
    warnings,
    records,
    merged_files: mergedFiles
  };
}
