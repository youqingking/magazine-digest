import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { importContentBatch } from "./import-content-batch.mjs";
import { writeJson } from "./lib/content-pipeline.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputRoot = path.join(repoRoot, "output", "stage-data1a-pilot");
const outputManifestPath = path.join(outputRoot, "manifest.json");
const outputParseReportPath = path.join(outputRoot, "parse-report.json");
const outputCatalogPath = path.join(outputRoot, "normalized-catalog.json");

export async function importReadersDigestPilot() {
  const rawInputDir = path.join(repoRoot, "data", "real-content", "readers-digest", "12112025", "raw");
  const zipPath = process.env.DATA1A_ZIP_PATH || null;
  const inputDir = process.env.DATA1A_INPUT_DIR || (fs.existsSync(rawInputDir) ? rawInputDir : null);
  const result = await importContentBatch({
    zip: zipPath,
    inputDir,
    issueLabel: "12112025",
    scenarioId: "data1a_readers_digest_12112025",
    freeQuotaLimit: Number(process.env.DATA1A_FREE_QUOTA_LIMIT || 8),
    publishScenario: "data1a_readers_digest_12112025"
  });

  const importResult = result.importResults[0];
  fs.mkdirSync(outputRoot, { recursive: true });
  writeJson(outputManifestPath, importResult.manifest);
  writeJson(outputParseReportPath, importResult.parseReport);
  writeJson(outputCatalogPath, importResult.normalizedCatalog);

  return {
    manifest: importResult.manifest,
    parseReport: importResult.parseReport,
    normalizedCatalog: importResult.normalizedCatalog,
    runtimeBundlePath: path.join(repoRoot, importResult.scenarioRecord.bundle_path)
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await importReadersDigestPilot();
    console.log(
      JSON.stringify(
        {
          status: "ok",
          article_count: result.manifest.imported_article_count,
          runtime_bundle: path.relative(repoRoot, result.runtimeBundlePath).replace(/\\/g, "/")
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          status: "error",
          message: error.message
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}
