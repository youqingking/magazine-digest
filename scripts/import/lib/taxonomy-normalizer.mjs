import fs from "node:fs";
import path from "node:path";

import { pipelinePaths, readJson } from "./content-pipeline.mjs";

export const taxonomyPaths = {
  root: path.join(pipelinePaths.dataRoot, "taxonomy"),
  canonicalSections: path.join(pipelinePaths.dataRoot, "taxonomy", "canonical-sections.json"),
  discoveryBuckets: path.join(pipelinePaths.dataRoot, "taxonomy", "discovery-buckets.json"),
  publicationMapsRoot: path.join(pipelinePaths.dataRoot, "taxonomy", "publication-section-maps")
};

function normalizePublicationKey(publicationKey) {
  return String(publicationKey || "").replace(/-/g, "_");
}

export function resolvePublicationDataDir(publicationKey) {
  const normalized = normalizePublicationKey(publicationKey);
  if (normalized === "readers_digest") {
    return path.join(pipelinePaths.dataRoot, "readers-digest");
  }
  return path.join(pipelinePaths.dataRoot, normalized);
}

function loadCanonicalSections() {
  const data = readJson(taxonomyPaths.canonicalSections, { sections: [] });
  return new Map((data.sections || []).map((section) => [section.key, section]));
}

function loadDiscoveryBuckets() {
  const data = readJson(taxonomyPaths.discoveryBuckets, { buckets: [] });
  return new Map((data.buckets || []).map((bucket) => [bucket.key, bucket]));
}

function loadPublicationMap(publicationKey) {
  const normalized = normalizePublicationKey(publicationKey);
  const filePath = path.join(taxonomyPaths.publicationMapsRoot, `${normalized}.json`);
  const mapFile = readJson(filePath, { mappings: [] });
  return {
    filePath,
    publication_key: normalized,
    byRawLabel: new Map(
      (mapFile.mappings || [])
        .filter((item) => item.enabled !== false)
        .map((item) => [item.raw_label, item])
    )
  };
}

export function createTaxonomyContext() {
  return {
    canonicalSections: loadCanonicalSections(),
    discoveryBuckets: loadDiscoveryBuckets()
  };
}

export function normalizeTaxonomyRecord(record, context = createTaxonomyContext()) {
  const publicationKey = normalizePublicationKey(record.publication_id || record.publication_key);
  const publicationMap = loadPublicationMap(publicationKey);
  const rawSectionLabel = record.raw_section_label || record.section_label || null;
  const mapping = rawSectionLabel ? publicationMap.byRawLabel.get(rawSectionLabel) || null : null;
  const canonicalSection = mapping ? context.canonicalSections.get(mapping.canonical_section_key) || null : null;
  const discoveryBucket = canonicalSection ? context.discoveryBuckets.get(canonicalSection.discovery_bucket) || null : null;
  const taxonomyWarnings = new Set((record.taxonomy_warnings || []).filter((warning) => !String(warning).startsWith("taxonomy_")));

  if (!rawSectionLabel) {
    taxonomyWarnings.add("taxonomy_missing_raw_section_label");
  }
  if (!mapping && rawSectionLabel) {
    taxonomyWarnings.add("taxonomy_unmapped_section");
  }
  if (mapping?.mapping_kind === "publication_specific") {
    taxonomyWarnings.add("taxonomy_publication_specific_fallback");
  }

  return {
    ...record,
    raw_section_label: rawSectionLabel,
    canonical_section_key: mapping?.canonical_section_key || null,
    canonical_section_label: canonicalSection?.label || null,
    discovery_bucket: discoveryBucket?.label || null,
    publication_section_path: mapping?.publication_section_path || rawSectionLabel || null,
    taxonomy_warnings: Array.from(taxonomyWarnings).sort()
  };
}

export function loadNormalizedRecordsForIssue(publicationKey, issueLabel) {
  const normalizedRoot = path.join(resolvePublicationDataDir(publicationKey), issueLabel, "normalized");
  if (!fs.existsSync(normalizedRoot)) {
    return [];
  }
  return fs.readdirSync(normalizedRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({
      filePath: path.join(normalizedRoot, name),
      record: readJson(path.join(normalizedRoot, name), null)
    }))
    .filter((item) => Boolean(item.record));
}
