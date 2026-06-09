import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { pipelinePaths, readJson, repoRoot } from "../import/lib/content-pipeline.mjs";
import { observabilityPaths, recordObservabilityEvent, refreshObservabilityReports } from "../ops/lib/observability-lib.mjs";
import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseline = "data1a_readers_digest_12112025";

function run(script, args = [], allowFailure = false) {
  try {
    return JSON.parse(execFileSync(process.execPath, [path.join(repoRoot, script), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024
    }));
  } catch (error) {
    if (allowFailure && error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}

function firstArticleIdFromCurrent() {
  const bundle = readJson(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), null);
  return (bundle?.contentSyncDelta?.response?.items || []).find((item) => item.entity_type === "article")?.article_id || null;
}

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

try {
  report.checks.restore_baseline = run("scripts/ops/rollback-scenario.mjs", ["--scenario", baseline]);
  report.checks.show_runtime_source = run("scripts/ops/show-runtime-source.mjs");
  report.checks.evaluate = run("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  report.checks.build_release = run("scripts/ops/build-release-artifact.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  report.checks.publish_dev = run("scripts/ops/publish-channel.mjs", ["--channel", "dev", "--scenario", "data2_multi_publication_release_candidate", "--apply", "--use-existing-reports"]);
  report.checks.rollback_dev = run("scripts/ops/rollback-channel.mjs", ["--channel", "dev"]);
  report.checks.show_runtime_source = run("scripts/ops/show-runtime-source.mjs");
  report.checks.set_preview = run("scripts/ops/set-runtime-source.mjs", ["--mode", "scenario_preview", "--scenario", "data1c_three_release_mixed_preview"]);
  report.checks.set_channel = run("scripts/ops/set-runtime-source.mjs", ["--mode", "channel_head", "--channel", "dev"]);
  report.checks.invalid_scenario = run("scripts/ops/set-runtime-source.mjs", ["--mode", "scenario_preview", "--scenario", "does_not_exist"], true);
  report.checks.restore_runtime = run("scripts/ops/set-runtime-source.mjs", ["--mode", "current_mirror"]);

  const bundle = readJson(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), null);
  const discoveryItems = bundle?.discoveryCatalog?.items || [];
  const articleId = firstArticleIdFromCurrent();
  if (articleId) {
    const detail = readJson(path.join(pipelinePaths.runtimeCurrentRoot, "content-detail.json"), null);
    const detailKey = `${articleId}|zh-CN|general|quick_30s`;
    const detailPayload = detail?.responses?.[detailKey] || null;
    recordObservabilityEvent({
      event_type: "detail_loaded",
      source_surface: "app",
      user_mode: "dev",
      article_id: articleId,
      publication_id: detailPayload?.article?.publication_id || detailPayload?.article?.publication_key || null,
      canonical_section_key: detailPayload?.article?.canonical_section_key || null,
      discovery_bucket: detailPayload?.article?.discovery_bucket || null,
      details: {
        smoke: true
      }
    });
  }
  recordObservabilityEvent({
    event_type: "feed_loaded",
    source_surface: "app",
    user_mode: "dev",
    details: {
      smoke: true,
      module_count: 5,
      article_count: discoveryItems.length
    }
  });
  recordObservabilityEvent({
    event_type: "search_loaded",
    source_surface: "app",
    user_mode: "dev",
    details: {
      smoke: true,
      result_count: discoveryItems.slice(0, 5).length
    }
  });

  const reports = refreshObservabilityReports();
  report.checks.triage = {
    runtime_source_mode: reports.triageDashboard.runtime_source?.mode || null,
    recent_incidents: reports.triageDashboard.recent_incidents,
    channel_health_items: (reports.channelHealth.channels || []).length
  };
  report.checks.outputs = Object.fromEntries([
    observabilityPaths.runtimeEventsReport,
    observabilityPaths.incidentSummaryReport,
    observabilityPaths.sourceHealthReport,
    observabilityPaths.channelHealthReport,
    observabilityPaths.contentHealthReport,
    observabilityPaths.triageDashboardReport,
    observabilityPaths.errorTaxonomyReport
  ].map((filePath) => [path.basename(filePath), fs.existsSync(filePath)]));
  report.checks.restore = {
    selected_is_baseline: (readSelected().selected_scenario_id || null) === baseline,
    current_is_baseline: (readCurrentMeta().selected_scenario_id || null) === baseline
  };

  const pass =
    report.checks.restore_baseline.status === "ok" &&
    report.checks.show_runtime_source.status === "ok" &&
    report.checks.set_preview.status === "ok" &&
    report.checks.set_channel.status === "ok" &&
    report.checks.invalid_scenario.status === "blocked" &&
    report.checks.evaluate.status === "ok" &&
    report.checks.build_release.status === "ok" &&
    report.checks.publish_dev.status === "ok" &&
    report.checks.rollback_dev.status === "ok" &&
    report.checks.restore.selected_is_baseline &&
    report.checks.restore.current_is_baseline &&
    Object.values(report.checks.outputs).every(Boolean);

  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
}

fs.mkdirSync(path.dirname(observabilityPaths.smokeReport), { recursive: true });
fs.writeFileSync(observabilityPaths.smokeReport, JSON.stringify(report, null, 2) + "\n", "utf8");

if (report.status !== "passed") {
  throw new Error(report.error || "OBS1_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
