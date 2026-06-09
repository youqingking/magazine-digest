import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { repoRoot, readJson } from "../import/lib/content-pipeline.mjs";
import { rel2Paths, exportRuntimeDist, readDistChannelManifest, startRuntimeDistServer, verifyRuntimeDist } from "../ops/lib/runtime-dist-lib.mjs";
import { readChannelManifest, readRuntimeSource } from "../ops/lib/release-channel-lib.mjs";
import { setRemoteRuntimeConfig } from "../../mobile/stores/runtime.store.js";
import { createRemoteRuntimeApi } from "../../mobile/api/remote-runtime-api.js";

const baselineScenarioId = "data1a_readers_digest_12112025";
const candidateScenarioId = "data2_multi_publication_release_candidate";
const snapshots = new Map();

function snapshotFile(filePath) {
  snapshots.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
}

function restoreFile(filePath) {
  const content = snapshots.get(filePath);
  if (content === null) {
    fs.rmSync(filePath, { force: true, recursive: false });
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function runJson(relativePath, args = [], allowFailure = false) {
  try {
    const output = execFileSync(process.execPath, [path.join(repoRoot, relativePath), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024
    });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure && error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function main() {
  const report = {
    generated_at: new Date().toISOString(),
    status: "passed",
    checks: {}
  };
  let server = null;

  snapshotFile(path.join(repoRoot, "mobile", "fixtures", "runtime", "runtime-source.json"));
  snapshotFile(path.join(repoRoot, "mobile", "fixtures", "runtime", "runtime-source.js"));
  snapshotFile(path.join(repoRoot, "runtime", "dist", "channels", "dev", "manifest.json"));

  try {
    report.checks.build_release = runJson("scripts/ops/build-release-artifact.mjs", ["--scenario", candidateScenarioId, "--use-existing-reports"]);
    report.checks.publish_dev = runJson("scripts/ops/publish-channel.mjs", ["--channel", "dev", "--scenario", candidateScenarioId, "--apply", "--use-existing-reports"]);
    report.checks.export = runJson("scripts/ops/export-runtime-dist.mjs");
    report.checks.show_dist = runJson("scripts/ops/show-runtime-dist.mjs");
    report.checks.verify = runJson("scripts/ops/verify-runtime-dist.mjs");
    report.checks.serve_probe = runJson("scripts/ops/serve-runtime-dist.mjs");
    report.checks.show_runtime_source_before = runJson("scripts/ops/show-runtime-source.mjs");
    report.checks.set_remote = runJson("scripts/ops/set-runtime-source.mjs", ["--mode", "remote_channel_head", "--channel", "dev"]);
    report.checks.show_runtime_source_after = runJson("scripts/ops/show-runtime-source.mjs");

    const { server: runtimeServer, payload } = await startRuntimeDistServer({});
    server = runtimeServer;
    setRemoteRuntimeConfig({ remoteBaseUrl: payload.base_url });

    const remoteApi = createRemoteRuntimeApi("remote");
    const remoteDelta = await remoteApi.getContentSyncDelta({ limit: 5, user_id: "user_local_stage_e0" });
    const remoteBootstrap = await remoteApi.getBootstrapConfig({ user_id: "user_local_stage_e0" });
    const localReleaseBundle = readJson(
      path.join(repoRoot, "runtime", "releases", readChannelManifest("dev").current_release_id, "bundle.json"),
      null
    );
    const localDeltaItems = localReleaseBundle?.contentSyncDelta?.response?.items || [];

    const remoteRuntimeReport = {
      generated_at: new Date().toISOString(),
      status: "ok",
      remote_base_url: payload.base_url,
      runtime_source: readRuntimeSource(),
      channel_manifest: readDistChannelManifest("dev"),
      local_channel_manifest: readChannelManifest("dev"),
      remote_release_id: remoteDelta.remote_release_id || null,
      remote_channel: remoteDelta.remote_channel || "dev",
      remote_ready: remoteDelta.remote_ready === true,
      fallback_used: remoteDelta.fallback_used === true,
      bootstrap_product_key: remoteBootstrap.product_key || null,
      remote_item_count: remoteDelta.items?.length || 0,
      local_item_count: localDeltaItems.slice(0, 5).length,
      first_remote_article: remoteDelta.items?.[0]?.article_id || null,
      first_local_article: localDeltaItems.find((item) => item.entity_type === "article")?.article_id || null,
      content_parity: (remoteDelta.items?.[0]?.article_id || null) === (localDeltaItems.find((item) => item.entity_type === "article")?.article_id || null)
    };
    writeJson(rel2Paths.remoteRuntimeReport, remoteRuntimeReport);

    const distManifestPath = path.join(repoRoot, "runtime", "dist", "channels", "dev", "manifest.json");
    const badManifest = {
      ...readJson(distManifestPath, {}),
      bundle_path: "/releases/does_not_exist/bundle.json"
    };
    writeJson(distManifestPath, badManifest);
    const fallbackDelta = await remoteApi.getContentSyncDelta({ limit: 3, user_id: "user_local_stage_e0" });
    const remoteFallbackReport = {
      generated_at: new Date().toISOString(),
      status: fallbackDelta.fallback_used ? "ok" : "failed",
      remote_base_url: payload.base_url,
      channel: "dev",
      fallback_used: fallbackDelta.fallback_used === true,
      runtime_source: fallbackDelta.runtime_source || null,
      remote_ready: fallbackDelta.remote_ready === true,
      fallback_release_id: fallbackDelta.remote_release_id || null,
      item_count: fallbackDelta.items?.length || 0
    };
    writeJson(rel2Paths.remoteFallbackReport, remoteFallbackReport);
    restoreFile(distManifestPath);
    exportRuntimeDist();
    verifyRuntimeDist();

    report.checks.remote_runtime = remoteRuntimeReport;
    report.checks.remote_fallback = remoteFallbackReport;
    report.checks.rollback_dev = runJson("scripts/ops/rollback-channel.mjs", ["--channel", "dev"]);
    report.checks.restore_runtime_source = runJson("scripts/ops/set-runtime-source.mjs", ["--mode", "current_mirror"]);
    report.checks.restore_baseline = runJson("scripts/ops/rollback-scenario.mjs", ["--scenario", baselineScenarioId]);

    const outputs = {
      runtime_dist_report: fs.existsSync(rel2Paths.runtimeDistReport),
      verify_report: fs.existsSync(rel2Paths.runtimeDistVerifyReport),
      remote_runtime_report: fs.existsSync(rel2Paths.remoteRuntimeReport),
      remote_fallback_report: fs.existsSync(rel2Paths.remoteFallbackReport),
      channel_export_report: fs.existsSync(rel2Paths.channelExportReport)
    };
    report.checks.outputs = outputs;

    const pass =
      report.checks.build_release.status === "ok" &&
      report.checks.publish_dev.status === "ok" &&
      report.checks.export.status === "ok" &&
      report.checks.verify.status === "ok" &&
      report.checks.set_remote.status === "ok" &&
      report.checks.remote_runtime.content_parity === true &&
      report.checks.remote_runtime.remote_ready === true &&
      report.checks.remote_fallback.fallback_used === true &&
      report.checks.rollback_dev.status === "ok" &&
      report.checks.restore_runtime_source.status === "ok" &&
      report.checks.restore_baseline.status === "ok" &&
      Object.values(outputs).every(Boolean);

    report.status = pass ? "passed" : "failed";
  } catch (error) {
    report.status = "failed";
    report.error = error.message || String(error);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    for (const filePath of Array.from(snapshots.keys()).reverse()) {
      restoreFile(filePath);
    }
  }

  writeJson(rel2Paths.smokeReport, report);
  if (report.status !== "passed") {
    throw new Error(report.error || "REL2_SMOKE_FAILED");
  }
  console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
}

await main();
