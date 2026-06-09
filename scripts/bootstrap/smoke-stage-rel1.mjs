import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";
import { rel1Paths, writeRel1Json } from "../ops/lib/release-channel-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
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

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

try {
  report.checks.build_release_artifact = run("scripts/ops/build-release-artifact.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"]);
  report.checks.publish_dev_dry_run = run("scripts/ops/publish-channel.mjs", ["--channel", "dev", "--scenario", "data2_multi_publication_release_candidate", "--dry-run", "--use-existing-reports"]);
  report.checks.publish_dev_apply = run("scripts/ops/publish-channel.mjs", ["--channel", "dev", "--scenario", "data2_multi_publication_release_candidate", "--apply", "--use-existing-reports"]);
  report.checks.runtime_source_preview = run("scripts/ops/set-runtime-source.mjs", ["--mode", "scenario_preview", "--scenario", "data1c_three_release_mixed_preview"]);
  report.checks.runtime_source_channel = run("scripts/ops/set-runtime-source.mjs", ["--mode", "channel_head", "--channel", "dev"]);
  report.checks.rollback_channel = run("scripts/ops/rollback-channel.mjs", ["--channel", "dev"]);
  report.checks.runtime_source_restore = run("scripts/ops/set-runtime-source.mjs", ["--mode", "current_mirror"]);
  report.checks.production_reject = run("scripts/ops/publish-channel.mjs", ["--channel", "production", "--scenario", "data1c_three_release_mixed_preview", "--apply", "--use-existing-reports"], true);
  report.checks.show_channel_state = run("scripts/ops/show-channel-state.mjs");
  report.checks.show_runtime_source = run("scripts/ops/show-runtime-source.mjs");
  report.checks.artifacts = Object.fromEntries([
    rel1Paths.releaseArtifactReport,
    rel1Paths.channelStateReport,
    rel1Paths.channelHistoryReport,
    rel1Paths.channelPromotionReport,
    rel1Paths.runtimeSourceReport,
    rel1Paths.h5PreviewReport
  ].map((filePath) => [path.basename(filePath), fs.existsSync(filePath)]));
  report.checks.restore = {
    current_is_baseline: (readCurrentMeta().selected_scenario_id || null) === baseline,
    selected_is_baseline: (readSelected().selected_scenario_id || null) === baseline
  };
  report.status =
    report.checks.build_release_artifact.status === "ok" &&
    report.checks.publish_dev_apply.status === "ok" &&
    report.checks.production_reject.status === "blocked" &&
    report.checks.restore.current_is_baseline &&
    report.checks.restore.selected_is_baseline &&
    Object.values(report.checks.artifacts).every(Boolean)
      ? "passed"
      : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
}

writeRel1Json(rel1Paths.smokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "REL1_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
