import path from "node:path";

import { importReadersDigestPilot } from "../../import/import-readers-digest-pilot.mjs";
import { repoRoot } from "../content-contract.fixtures.mjs";

export async function runReadersDigestGolden() {
  const result = await importReadersDigestPilot();
  const mergedSkipped = result.manifest.skipped_assets?.includes("Reader's Digest-12112025_adult.md");
  const first = result.normalizedCatalog.article_ids[0];
  return {
    id: "readers_digest_v1",
    status:
      result.manifest.imported_article_count === 15 &&
      mergedSkipped &&
      result.parseReport.missing_block_records.length === 0 &&
      Boolean(first)
        ? "passed"
        : "failed",
    assertions: {
      imported_article_count: result.manifest.imported_article_count,
      merged_skipped: mergedSkipped,
      missing_block_count: result.parseReport.missing_block_records.length,
      runtime_bundle: path.relative(repoRoot, result.runtimeBundlePath).replace(/\\/g, "/")
    }
  };
}
