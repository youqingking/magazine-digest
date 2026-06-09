import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

import { atomicWriteJson } from "../../lib/atomic-json.mjs";
import { readJson, repoRoot } from "../../import/lib/content-pipeline.mjs";
import { channelNames, readChannelManifest, readReleaseManifest, rel1Paths, releaseBundlePath, releaseManifestPath, releaseProvenancePath } from "./release-channel-lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rel2Paths = {
  root: path.join(repoRoot, "runtime", "dist"),
  channelsRoot: path.join(repoRoot, "runtime", "dist", "channels"),
  releasesRoot: path.join(repoRoot, "runtime", "dist", "releases"),
  indexJson: path.join(repoRoot, "runtime", "dist", "index.json"),
  stageRoot: path.join(repoRoot, "output", "stage-rel2"),
  runtimeDistReport: path.join(repoRoot, "output", "stage-rel2", "runtime-dist-report.json"),
  runtimeDistVerifyReport: path.join(repoRoot, "output", "stage-rel2", "runtime-dist-verify-report.json"),
  remoteRuntimeReport: path.join(repoRoot, "output", "stage-rel2", "remote-runtime-report.json"),
  remoteFallbackReport: path.join(repoRoot, "output", "stage-rel2", "remote-fallback-report.json"),
  channelExportReport: path.join(repoRoot, "output", "stage-rel2", "channel-export-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-rel2", "smoke-report.json"),
  serveState: path.join(repoRoot, "output", "stage-rel2", "serve-state.json")
};

export const defaultRuntimeDistHost = "127.0.0.1";
export const defaultRuntimeDistPort = 4184;

function nowIso() {
  return new Date().toISOString();
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function ensureRel2Dirs() {
  [
    rel2Paths.root,
    rel2Paths.channelsRoot,
    rel2Paths.releasesRoot,
    rel2Paths.stageRoot
  ].forEach((dirPath) => fs.mkdirSync(dirPath, { recursive: true }));
  channelNames.forEach((channel) => {
    fs.mkdirSync(path.join(rel2Paths.channelsRoot, channel), { recursive: true });
  });
}

function writeRel2Json(filePath, value) {
  ensureRel2Dirs();
  atomicWriteJson(filePath, value);
}

function copyJson(sourcePath, destinationPath) {
  const payload = readJson(sourcePath, null);
  if (!payload) {
    return null;
  }
  writeRel2Json(destinationPath, payload);
  return payload;
}

export function buildRuntimeDistBaseUrl(host = defaultRuntimeDistHost, port = defaultRuntimeDistPort) {
  return `http://${host}:${port}`;
}

export function readDistIndex() {
  return readJson(rel2Paths.indexJson, {
    version: "stage-rel2-v1",
    generated_at: null,
    channels: [],
    releases: []
  });
}

export function readDistChannelManifest(channel) {
  return readJson(path.join(rel2Paths.channelsRoot, channel, "manifest.json"), {
    version: "stage-rel2-v1",
    channel,
    status: "idle",
    release_id: null,
    release_manifest_path: null,
    bundle_path: null,
    exported_at: null,
    source_manifest: null,
    notes: []
  });
}

export function readDistReleaseManifest(releaseId) {
  return readJson(path.join(rel2Paths.releasesRoot, releaseId, "manifest.json"), null);
}

export function readDistReleaseBundle(releaseId) {
  return readJson(path.join(rel2Paths.releasesRoot, releaseId, "bundle.json"), null);
}

function buildDistReleaseManifest(releaseId, sourceManifest, provenance, bundle) {
  return {
    version: "stage-rel2-v1",
    artifact_version: "stage-rel2-dist-v1",
    generated_at: nowIso(),
    release_id: releaseId,
    scenario_id: sourceManifest.source_scenario_id || null,
    baseline_scenario_id: sourceManifest.baseline_scenario_id || null,
    product_key: bundle?.metadata?.product_key || sourceManifest.product_key || "demo_cn_content",
    bundle_path: `/releases/${releaseId}/bundle.json`,
    provenance_path: `/releases/${releaseId}/provenance.json`,
    source_release_manifest: rel(releaseManifestPath(releaseId)),
    source_bundle_path: rel(releaseBundlePath(releaseId)),
    publication_list: sourceManifest.publication_list || [],
    issue_list: sourceManifest.issue_list || [],
    article_count: sourceManifest.article_count || 0,
    promotion_decision: sourceManifest.promotion_decision || null,
    provenance: {
      operator_action: provenance?.operator_action || null,
      selected_scenario_id: provenance?.selected_scenario_id || null,
      current_scenario_id: provenance?.current_scenario_id || null,
      commit_tag_context: provenance?.commit_tag_context || null
    }
  };
}

function buildDistChannelManifest(channel, sourceManifest) {
  const releaseId = sourceManifest.current_release_id || null;
  return {
    version: "stage-rel2-v1",
    channel,
    status: sourceManifest.status || (releaseId ? "active" : "idle"),
    release_id: releaseId,
    source_scenario_id: sourceManifest.source_scenario_id || null,
    promoted_from: sourceManifest.promoted_from || null,
    published_at: sourceManifest.published_at || null,
    rollback_target: sourceManifest.rollback_target || null,
    release_manifest_path: releaseId ? `/releases/${releaseId}/manifest.json` : null,
    bundle_path: releaseId ? `/releases/${releaseId}/bundle.json` : null,
    provenance_path: releaseId ? `/releases/${releaseId}/provenance.json` : null,
    exported_at: nowIso(),
    source_manifest: rel(path.join(rel1Paths.channelsRoot, channel, "manifest.json")),
    notes: releaseId ? ["channel_head_exported_from_rel1"] : ["channel_idle_no_release"]
  };
}

export function exportRuntimeDist() {
  ensureRel2Dirs();
  const exportedAt = nowIso();
  const releases = [];

  if (fs.existsSync(rel1Paths.releasesRoot)) {
    for (const releaseId of fs.readdirSync(rel1Paths.releasesRoot).sort()) {
      const sourceManifest = readReleaseManifest(releaseId);
      const bundle = readJson(releaseBundlePath(releaseId), null);
      const provenance = readJson(releaseProvenancePath(releaseId), null);
      if (!sourceManifest || !bundle) {
        continue;
      }
      const releaseRoot = path.join(rel2Paths.releasesRoot, releaseId);
      fs.mkdirSync(releaseRoot, { recursive: true });
      const distManifest = buildDistReleaseManifest(releaseId, sourceManifest, provenance, bundle);
      writeRel2Json(path.join(releaseRoot, "manifest.json"), distManifest);
      writeRel2Json(path.join(releaseRoot, "bundle.json"), bundle);
      writeRel2Json(path.join(releaseRoot, "provenance.json"), provenance || {
        generated_at: exportedAt,
        release_id: releaseId,
        source: "rel1_provenance_missing"
      });
      releases.push({
        release_id: releaseId,
        scenario_id: distManifest.scenario_id,
        product_key: distManifest.product_key,
        article_count: distManifest.article_count,
        bundle_path: distManifest.bundle_path,
        manifest_path: `/releases/${releaseId}/manifest.json`
      });
    }
  }

  const channels = channelNames.map((channel) => {
    const sourceManifest = readChannelManifest(channel);
    const distManifest = buildDistChannelManifest(channel, sourceManifest);
    writeRel2Json(path.join(rel2Paths.channelsRoot, channel, "manifest.json"), distManifest);
    return {
      channel,
      status: distManifest.status,
      release_id: distManifest.release_id,
      source_scenario_id: distManifest.source_scenario_id,
      published_at: distManifest.published_at
    };
  });

  const indexPayload = {
    version: "stage-rel2-v1",
    generated_at: exportedAt,
    export_root: "runtime/dist",
    channels,
    releases
  };
  writeRel2Json(rel2Paths.indexJson, indexPayload);

  const runtimeDistReport = {
    generated_at: exportedAt,
    status: "ok",
    dist_root: rel(rel2Paths.root),
    index_path: rel(rel2Paths.indexJson),
    exported_release_count: releases.length,
    exported_channel_count: channels.length,
    releases,
    channels
  };
  const channelExportReport = {
    generated_at: exportedAt,
    status: "ok",
    channels: channels.map((channel) => ({
      ...channel,
      dist_manifest_path: rel(path.join(rel2Paths.channelsRoot, channel.channel, "manifest.json"))
    }))
  };
  writeRel2Json(rel2Paths.runtimeDistReport, runtimeDistReport);
  writeRel2Json(rel2Paths.channelExportReport, channelExportReport);
  return {
    runtimeDistReport,
    channelExportReport,
    index: indexPayload
  };
}

export function verifyRuntimeDist() {
  ensureRel2Dirs();
  const index = readDistIndex();
  const errors = [];
  const warnings = [];
  const channelChecks = channelNames.map((channel) => {
    const distManifest = readDistChannelManifest(channel);
    const sourceManifest = readChannelManifest(channel);
    const activeReleaseId = distManifest.release_id || null;
    if ((sourceManifest.current_release_id || null) !== activeReleaseId) {
      errors.push(`channel_release_mismatch:${channel}`);
    }
    if (activeReleaseId) {
      const releaseManifest = readDistReleaseManifest(activeReleaseId);
      const bundle = readDistReleaseBundle(activeReleaseId);
      if (!releaseManifest) {
        errors.push(`dist_release_manifest_missing:${activeReleaseId}`);
      }
      if (!bundle) {
        errors.push(`dist_release_bundle_missing:${activeReleaseId}`);
      }
      if (releaseManifest?.release_id !== activeReleaseId) {
        errors.push(`dist_release_manifest_invalid:${activeReleaseId}`);
      }
    } else if (channel === "dev" && sourceManifest.current_release_id) {
      errors.push(`dist_channel_missing_release:${channel}`);
    } else if (!activeReleaseId) {
      warnings.push(`channel_idle:${channel}`);
    }
    return {
      channel,
      source_release_id: sourceManifest.current_release_id || null,
      dist_release_id: activeReleaseId,
      status: distManifest.status || "idle"
    };
  });

  const report = {
    generated_at: nowIso(),
    status: errors.length > 0 ? "blocked" : "ok",
    index_release_count: (index.releases || []).length,
    index_channel_count: (index.channels || []).length,
    channel_checks: channelChecks,
    errors,
    warnings
  };
  writeRel2Json(rel2Paths.runtimeDistVerifyReport, report);
  return report;
}

export function showRuntimeDist() {
  const index = readDistIndex();
  const verify = readJson(rel2Paths.runtimeDistVerifyReport, null) || verifyRuntimeDist();
  return {
    generated_at: nowIso(),
    dist_root: rel(rel2Paths.root),
    channels: (index.channels || []).map((item) => ({
      channel: item.channel,
      release_id: item.release_id || null,
      status: item.status || "idle"
    })),
    releases: (index.releases || []).map((item) => ({
      release_id: item.release_id,
      scenario_id: item.scenario_id || null,
      article_count: item.article_count || 0
    })),
    verify_status: verify.status,
    verify_errors: verify.errors || []
  };
}

function serveStatic(requestPath, response) {
  const normalized = requestPath === "/" ? "/index.json" : requestPath;
  const filePath = path.join(rel2Paths.root, normalized.replace(/^\//, ""));
  if (!filePath.startsWith(rel2Paths.root)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  if (!fs.existsSync(filePath)) {
    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "REL2_DIST_NOT_FOUND", path: normalized }, null, 2));
    return;
  }
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(fs.readFileSync(filePath, "utf8"));
}

export function startRuntimeDistServer({ host = defaultRuntimeDistHost, port = defaultRuntimeDistPort } = {}) {
  ensureRel2Dirs();
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${host}:${port}`);
    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "REL2_METHOD_NOT_ALLOWED" }, null, 2));
      return;
    }
    serveStatic(url.pathname, response);
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const payload = {
        status: "ok",
        host,
        port,
        base_url: buildRuntimeDistBaseUrl(host, port),
        dist_root: rel(rel2Paths.root),
        started_at: nowIso()
      };
      writeRel2Json(rel2Paths.serveState, payload);
      resolve({ server, payload });
    });
  });
}

export async function runServeProbe({ host = defaultRuntimeDistHost, port = defaultRuntimeDistPort, holdMs = 1500 } = {}) {
  const { server, payload } = await startRuntimeDistServer({ host, port });
  let probe = null;
  try {
    const response = await fetch(`${payload.base_url}/index.json`);
    probe = {
      ok: response.ok,
      status: response.status,
      body: await response.json()
    };
  } finally {
    await new Promise((resolve) => setTimeout(resolve, holdMs));
    await new Promise((resolve) => server.close(resolve));
  }
  return {
    ...payload,
    probe
  };
}

export function buildRuntimeDistSnapshot() {
  const index = readDistIndex();
  const verify = readJson(rel2Paths.runtimeDistVerifyReport, null);
  const serve = readJson(rel2Paths.serveState, null);
  return {
    root: rel(rel2Paths.root),
    index,
    verify,
    serve_state: serve
  };
}
