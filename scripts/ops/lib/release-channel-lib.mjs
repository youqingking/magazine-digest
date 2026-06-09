import fs from "node:fs";
import path from "node:path";

import {
  pipelinePaths,
  readJson,
  repoRoot,
  writeCurrentRuntimeMirror,
  writeJson,
  writeText
} from "../../import/lib/content-pipeline.mjs";
import { atomicWriteJson } from "../../lib/atomic-json.mjs";
import { acquireStateLock, releaseStateLock } from "../../lib/state-lock.mjs";
import {
  buildScenarioSnapshot,
  evaluatePromotionDecision,
  findScenarioRecord,
  parseArgs,
  readCurrentMeta,
  readSelected,
  resolveBaselineScenarioId
} from "./ops-lib.mjs";
import { buildReleaseManifest, readGitContext } from "./ops3-lib.mjs";
import { recordObservabilityEvent } from "./observability-lib.mjs";

export { parseArgs };

export const rel1Paths = {
  root: path.join(repoRoot, "runtime"),
  releasesRoot: path.join(repoRoot, "runtime", "releases"),
  channelsRoot: path.join(repoRoot, "runtime", "channels"),
  stageRoot: path.join(repoRoot, "output", "stage-rel1"),
  releaseArtifactReport: path.join(repoRoot, "output", "stage-rel1", "release-artifact-report.json"),
  channelStateReport: path.join(repoRoot, "output", "stage-rel1", "channel-state-report.json"),
  channelHistoryReport: path.join(repoRoot, "output", "stage-rel1", "channel-history-report.json"),
  channelPromotionReport: path.join(repoRoot, "output", "stage-rel1", "channel-promotion-report.json"),
  runtimeSourceReport: path.join(repoRoot, "output", "stage-rel1", "runtime-source-report.json"),
  h5PreviewReport: path.join(repoRoot, "output", "stage-rel1", "h5-preview-report.json"),
  copyAuditReport: path.join(repoRoot, "output", "stage-rel1", "copy-audit-report.json"),
  releasePolishReport: path.join(repoRoot, "output", "stage-rel1", "release-polish-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-rel1", "smoke-report.json"),
  runtimeSourceJson: path.join(repoRoot, "mobile", "fixtures", "runtime", "runtime-source.json"),
  runtimeSourceJs: path.join(repoRoot, "mobile", "fixtures", "runtime", "runtime-source.js"),
  sourceRegistryJs: path.join(repoRoot, "mobile", "fixtures", "runtime", "source-registry.js"),
  sourceRegistryJson: path.join(repoRoot, "mobile", "fixtures", "runtime", "source-registry.generated.json")
};

const rel2RuntimeDistRoot = path.join(repoRoot, "runtime", "dist");
const rel2ChannelsRoot = path.join(rel2RuntimeDistRoot, "channels");
const rel2ReleasesRoot = path.join(rel2RuntimeDistRoot, "releases");

export const channelNames = ["dev", "staging", "production"];

function nowIso() {
  return new Date().toISOString();
}

function compactTimestamp(isoString = nowIso()) {
  return isoString.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

function nextAvailableReleaseId(baseId) {
  if (!fs.existsSync(releaseDir(baseId))) {
    return baseId;
  }
  let index = 2;
  while (fs.existsSync(releaseDir(`${baseId}_${index}`))) {
    index += 1;
  }
  return `${baseId}_${index}`;
}

export function ensureRel1Dirs() {
  fs.mkdirSync(rel1Paths.releasesRoot, { recursive: true });
  fs.mkdirSync(rel1Paths.channelsRoot, { recursive: true });
  fs.mkdirSync(rel1Paths.stageRoot, { recursive: true });
  channelNames.forEach((channel) => {
    fs.mkdirSync(path.join(rel1Paths.channelsRoot, channel), { recursive: true });
  });
}

export function writeRel1Json(filePath, value) {
  ensureRel1Dirs();
  writeJson(filePath, value);
}

export function writeRel1Text(filePath, value) {
  ensureRel1Dirs();
  writeText(filePath, value);
}

export function defaultChannelManifest(channel) {
  return {
    version: "stage-rel1-v1",
    channel,
    current_release_id: null,
    source_scenario_id: null,
    promoted_from: null,
    published_at: null,
    rollback_target: null,
    release_manifest_path: null,
    provenance_path: null,
    status: "idle"
  };
}

export function channelManifestPath(channel) {
  return path.join(rel1Paths.channelsRoot, channel, "manifest.json");
}

export function channelHistoryPath(channel) {
  return path.join(rel1Paths.channelsRoot, channel, "history.json");
}

export function readChannelManifest(channel) {
  return readJson(channelManifestPath(channel), defaultChannelManifest(channel));
}

export function readChannelHistory(channel) {
  return readJson(channelHistoryPath(channel), {
    version: "stage-rel1-v1",
    channel,
    generated_at: null,
    items: []
  });
}

export function writeChannelManifest(channel, manifest) {
  ensureRel1Dirs();
  atomicWriteJson(channelManifestPath(channel), manifest);
}

export function appendChannelHistory(channel, entry) {
  const history = readChannelHistory(channel);
  history.generated_at = nowIso();
  history.items.push(entry);
  atomicWriteJson(channelHistoryPath(channel), history);
  return history;
}

export function readScenarioBundleInfo(scenarioId) {
  const record = findScenarioRecord(scenarioId);
  if (!record) return null;
  const bundlePath = path.join(repoRoot, record.bundle_path);
  const bundle = readJson(bundlePath, null);
  if (!bundle) return null;
  return { record, bundle, bundlePath };
}

export function releaseDir(releaseId) {
  return path.join(rel1Paths.releasesRoot, releaseId);
}

export function releaseManifestPath(releaseId) {
  return path.join(releaseDir(releaseId), "manifest.json");
}

export function releaseBundlePath(releaseId) {
  return path.join(releaseDir(releaseId), "bundle.json");
}

export function releaseNotesPath(releaseId) {
  return path.join(releaseDir(releaseId), "notes.md");
}

export function releaseProvenancePath(releaseId) {
  return path.join(releaseDir(releaseId), "provenance.json");
}

export function readReleaseManifest(releaseId) {
  return readJson(releaseManifestPath(releaseId), null);
}

function buildNotesMarkdown({ releaseId, scenarioId, baselineScenarioId, snapshot, evaluation, manifest }) {
  const warningLines = (evaluation.warnings || []).length
    ? evaluation.warnings.map((item) => `- ${item}`).join("\n")
    : "- 无";
  const acceptedLines = (manifest.warning_summary?.accepted_anomalies || []).length
    ? manifest.warning_summary.accepted_anomalies.map((item) => `- ${item.issue_id}: ${item.warning_type} x${item.count}`).join("\n")
    : "- 无";
  return [
    `# Release ${releaseId}`,
    "",
    `- scenario: ${scenarioId}`,
    `- baseline: ${baselineScenarioId}`,
    `- publications: ${(snapshot.publication_list || []).join(", ") || "none"}`,
    `- issues: ${(snapshot.issue_list || []).join(", ") || "none"}`,
    `- article_count: ${snapshot.article_count || 0}`,
    `- decision: ${evaluation.decision}`,
    "",
    "## 为什么可发布",
    "",
    "- 当前 candidate 已通过 OPS2 promotion decision。",
    "- mixed preview 仍是 preview-only，因此不作为正式 release source。",
    "",
    "## 警告摘要",
    "",
    warningLines,
    "",
    "## 已接受例外",
    "",
    acceptedLines,
    "",
    `- overrides: ${snapshot.override_summary?.count || 0}`,
    ""
  ].join("\n");
}

export function syncRuntimeSourceRegistry() {
  ensureRel1Dirs();
  const scenarios = readJson(pipelinePaths.runtimeScenarioIndex, { items: [] }).items || [];
  const scenarioEntries = {};
  for (const item of scenarios) {
    if (!String(item.source_kind || "").startsWith("real_content")) continue;
    const bundleInfo = readScenarioBundleInfo(item.scenario_id);
    if (!bundleInfo?.bundle) continue;
    scenarioEntries[item.scenario_id] = {
      scenario_id: item.scenario_id,
      publication_list: item.included_publications || [],
      issue_list: (item.included_issues || []).map((issue) => `${issue.publication_id}__${issue.issue_label}`),
      bundle: bundleInfo.bundle
    };
  }

  const releaseEntries = {};
  if (fs.existsSync(rel1Paths.releasesRoot)) {
    for (const name of fs.readdirSync(rel1Paths.releasesRoot)) {
      const manifest = readJson(releaseManifestPath(name), null);
      const bundle = readJson(releaseBundlePath(name), null);
      const provenance = readJson(releaseProvenancePath(name), null);
      if (!manifest || !bundle) continue;
      releaseEntries[name] = { manifest, provenance, bundle };
    }
  }

  const channelEntries = {};
  for (const channel of channelNames) {
    channelEntries[channel] = readChannelManifest(channel);
  }

  const registry = {
    generated_at: nowIso(),
    scenarios: scenarioEntries,
    releases: releaseEntries,
    channels: channelEntries
  };

  atomicWriteJson(rel1Paths.sourceRegistryJson, registry);
  fs.writeFileSync(rel1Paths.sourceRegistryJs, `const runtimeSourceRegistry = ${JSON.stringify(registry, null, 2)};\n\nexport default runtimeSourceRegistry;\n`, "utf8");
  return registry;
}

export function readRuntimeSource() {
  return readJson(rel1Paths.runtimeSourceJson, {
    version: "stage-rel1-v1",
    updated_at: null,
    mode: "current_mirror",
    scenario_id: null,
    channel: null,
    release_id: null,
    remote_base_url: null,
    selection_reason: "default_local_current_mirror"
  });
}

export function writeRuntimeSource(state) {
  const payload = {
    version: "stage-rel1-v1",
    updated_at: nowIso(),
    mode: state.mode,
    scenario_id: state.scenario_id || null,
    channel: state.channel || null,
    release_id: state.release_id || null,
    remote_base_url: state.remote_base_url || null,
    selection_reason: state.selection_reason || null
  };
  atomicWriteJson(rel1Paths.runtimeSourceJson, payload);
  fs.writeFileSync(rel1Paths.runtimeSourceJs, `const runtimeSource = ${JSON.stringify(payload, null, 2)};\n\nexport default runtimeSource;\n`, "utf8");
  return payload;
}

function distChannelManifestPath(channel) {
  return path.join(rel2ChannelsRoot, channel, "manifest.json");
}

function readDistChannelManifest(channel) {
  return readJson(distChannelManifestPath(channel), {
    channel,
    release_id: null,
    source_scenario_id: null,
    status: "idle"
  });
}

function readDistReleaseBundle(releaseId) {
  return readJson(path.join(rel2ReleasesRoot, releaseId, "bundle.json"), null);
}

function buildDevPreviewMirrorBundle({
  bundle,
  scenarioId = null,
  channel = null,
  releaseId = null,
  sourceMode,
  selectionSource
}) {
  const now = nowIso();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  return {
    ...bundle,
    metadata: {
      ...bundle.metadata,
      selected_scenario_id: scenarioId || bundle.metadata?.scenario_id || null,
      runtime_fixture_role: "dev_preview_current_mirror",
      published_to_current_at: now,
      selection_source: selectionSource,
      dev_preview_source_mode: sourceMode,
      dev_preview_source_scenario_id: scenarioId || null,
      dev_preview_source_channel: channel || null,
      dev_preview_source_release_id: releaseId || null,
      dev_preview_restore_selected_scenario_id: selected.selected_scenario_id || null,
      dev_preview_restore_current_scenario_id: currentMeta.selected_scenario_id || null
    }
  };
}

export function syncScenarioPreviewToH5DevCurrent(scenarioId) {
  const bundleInfo = readScenarioBundleInfo(scenarioId);
  if (!bundleInfo?.bundle) {
    return { status: "blocked", reason: "scenario_bundle_missing", scenario_id: scenarioId };
  }
  const mirroredBundle = buildDevPreviewMirrorBundle({
    bundle: bundleInfo.bundle,
    scenarioId,
    sourceMode: "scenario_preview",
    selectionSource: "ops_set_runtime_source_for_h5_dev"
  });
  writeCurrentRuntimeMirror(mirroredBundle, { scenario_id: scenarioId });
  return {
    status: "ok",
    mode: "scenario_preview",
    scenario_id: scenarioId,
    visible_publications: Array.from(new Set(
      ((mirroredBundle?.discoveryCatalog?.items || mirroredBundle?.contentSyncDelta?.response?.items || [])
        .map((item) => item.publication_key)
        .filter(Boolean))
    )).sort()
  };
}

export function syncChannelHeadToH5DevCurrent(channel) {
  syncRuntimeSourceRegistry();
  const registry = readJson(rel1Paths.sourceRegistryJson, { channels: {}, releases: {} });
  const manifest = registry.channels?.[channel] || readChannelManifest(channel);
  const releaseId = manifest?.current_release_id || null;
  const bundle = releaseId ? registry.releases?.[releaseId]?.bundle || null : null;
  if (!releaseId || !bundle) {
    return { status: "blocked", reason: "channel_head_bundle_missing", channel, release_id: releaseId };
  }
  const mirroredBundle = buildDevPreviewMirrorBundle({
    bundle,
    scenarioId: manifest.source_scenario_id || bundle.metadata?.scenario_id || null,
    channel,
    releaseId,
    sourceMode: "channel_head",
    selectionSource: "ops_set_runtime_source_for_h5_dev"
  });
  writeCurrentRuntimeMirror(mirroredBundle, {
    scenario_id: manifest.source_scenario_id || bundle.metadata?.scenario_id || null
  });
  return {
    status: "ok",
    mode: "channel_head",
    channel,
    release_id: releaseId,
    visible_publications: Array.from(new Set(
      ((mirroredBundle?.discoveryCatalog?.items || mirroredBundle?.contentSyncDelta?.response?.items || [])
        .map((item) => item.publication_key)
        .filter(Boolean))
    )).sort()
  };
}

export function syncRemoteChannelHeadToH5DevCurrent(channel) {
  const manifest = readDistChannelManifest(channel);
  const releaseId = manifest.release_id || null;
  const bundle = releaseId ? readDistReleaseBundle(releaseId) : null;
  if (!releaseId || !bundle) {
    return { status: "blocked", reason: "remote_channel_head_bundle_missing", channel, release_id: releaseId };
  }
  const mirroredBundle = buildDevPreviewMirrorBundle({
    bundle,
    scenarioId: manifest.source_scenario_id || bundle.metadata?.scenario_id || null,
    channel,
    releaseId,
    sourceMode: "remote_channel_head",
    selectionSource: "ops_set_runtime_source_remote_h5_dev"
  });
  writeCurrentRuntimeMirror(mirroredBundle, {
    scenario_id: manifest.source_scenario_id || bundle.metadata?.scenario_id || null
  });
  return {
    status: "ok",
    mode: "remote_channel_head",
    channel,
    release_id: releaseId,
    visible_publications: Array.from(new Set(
      ((mirroredBundle?.discoveryCatalog?.items || mirroredBundle?.contentSyncDelta?.response?.items || [])
        .map((item) => item.publication_key)
        .filter(Boolean))
    )).sort()
  };
}

export function restoreH5DevCurrentMirror() {
  const selected = readSelected();
  const restoreScenarioId = selected.selected_scenario_id || resolveBaselineScenarioId();
  const bundleInfo = readScenarioBundleInfo(restoreScenarioId);
  if (!bundleInfo?.bundle) {
    return { status: "blocked", reason: "restore_bundle_missing", scenario_id: restoreScenarioId };
  }
  const restoredBundle = {
    ...bundleInfo.bundle,
    metadata: {
      ...bundleInfo.bundle.metadata,
      selected_scenario_id: restoreScenarioId,
      runtime_fixture_role: "selected_scenario_mirror",
      published_to_current_at: nowIso(),
      selection_source: "ops_set_runtime_source_restore_h5_dev"
    }
  };
  writeCurrentRuntimeMirror(restoredBundle, { scenario_id: restoreScenarioId });
  return {
    status: "ok",
    mode: "current_mirror",
    scenario_id: restoreScenarioId,
    visible_publications: Array.from(new Set(
      ((restoredBundle?.discoveryCatalog?.items || restoredBundle?.contentSyncDelta?.response?.items || [])
        .map((item) => item.publication_key)
        .filter(Boolean))
    )).sort()
  };
}

export function resolveRuntimeSourceFixtures(state = readRuntimeSource()) {
  syncRuntimeSourceRegistry();
  const registry = readJson(rel1Paths.sourceRegistryJson, { scenarios: {}, releases: {}, channels: {} });
  if (state.mode === "scenario_preview" && state.scenario_id) {
    return registry.scenarios?.[state.scenario_id]?.bundle || null;
  }
  if (state.mode === "channel_head" && state.channel) {
    const channel = registry.channels?.[state.channel];
    const releaseId = channel?.current_release_id || state.release_id;
    return releaseId ? registry.releases?.[releaseId]?.bundle || null : null;
  }
  if (state.mode === "remote_channel_head" && state.channel) {
    const distManifest = readDistChannelManifest(state.channel);
    const releaseId = distManifest.release_id || state.release_id || null;
    return releaseId ? readDistReleaseBundle(releaseId) : null;
  }
  return null;
}

export function buildReleaseArtifact({ scenarioId, baselineScenarioId = null, refresh = false, releaseId = null }) {
  ensureRel1Dirs();
  const baselineId = resolveBaselineScenarioId(baselineScenarioId);
  const evaluation = evaluatePromotionDecision({
    scenarioId,
    baselineScenarioId: baselineId,
    refresh
  });
  if (evaluation.decision !== "promotable") {
    recordObservabilityEvent({
      event_type: "release_manifest_invalid",
      severity: evaluation.decision === "blocked" ? "error" : "warning",
      source_surface: "release",
      scenario_id: scenarioId,
      baseline_scenario_id: baselineId,
      details: {
        reason: "scenario_not_promotable",
        decision: evaluation.decision,
        blockers: evaluation.blockers || [],
        warnings: evaluation.warnings || []
      }
    });
    return { status: "blocked", reason: "scenario_not_promotable", evaluation };
  }

  const bundleInfo = readScenarioBundleInfo(scenarioId);
  if (!bundleInfo?.bundle) {
    recordObservabilityEvent({
      event_type: "scenario_bundle_missing",
      source_surface: "release",
      scenario_id: scenarioId,
      baseline_scenario_id: baselineId,
      details: {
        reason: "scenario_bundle_missing"
      }
    });
    return { status: "blocked", reason: "scenario_bundle_missing", evaluation };
  }

  const createdAt = nowIso();
  const immutableReleaseId = releaseId || nextAvailableReleaseId(`rel_${scenarioId}_${compactTimestamp(createdAt)}`);
  const destination = releaseDir(immutableReleaseId);
  if (releaseId && fs.existsSync(destination)) {
    return { status: "blocked", reason: "release_id_exists", release_id: immutableReleaseId };
  }

  fs.mkdirSync(destination, { recursive: true });

  const snapshot = buildScenarioSnapshot(scenarioId, "release_candidate");
  const baseManifest = buildReleaseManifest({
    scenarioId,
    baselineScenarioId: baselineId,
    refresh: false
  });
  const manifest = {
    release_id: immutableReleaseId,
    built_at: createdAt,
    source_scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    publication_list: snapshot.publication_list || [],
    issue_list: snapshot.issue_list || [],
    article_count: snapshot.article_count || 0,
    warning_summary: {
      gate_warnings: evaluation.gate?.warnings || [],
      decision_warnings: evaluation.warnings || [],
      accepted_anomalies: baseManifest.warning_summary?.accepted_anomalies || []
    },
    accepted_anomaly_summary: baseManifest.warning_summary?.accepted_anomalies || [],
    override_summary: baseManifest.override_summary || null,
    promotion_decision: evaluation.decision,
    build_label: snapshot.build_label || null,
    source_bundle_path: bundleInfo.record.bundle_path,
    git_context: readGitContext()
  };
  const provenance = {
    generated_at: createdAt,
    operator_action: "build_release_artifact",
    release_id: immutableReleaseId,
    source_scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    selected_scenario_id: readSelected().selected_scenario_id || null,
    current_scenario_id: readCurrentMeta().selected_scenario_id || null,
    gate_result: evaluation.gate?.status || null,
    promotion_decision: evaluation.decision,
    commit_tag_context: readGitContext()
  };
  const notes = buildNotesMarkdown({
    releaseId: immutableReleaseId,
    scenarioId,
    baselineScenarioId: baselineId,
    snapshot,
    evaluation,
    manifest: baseManifest
  });

  writeRel1Json(releaseBundlePath(immutableReleaseId), bundleInfo.bundle);
  writeRel1Json(releaseManifestPath(immutableReleaseId), manifest);
  writeRel1Json(releaseProvenancePath(immutableReleaseId), provenance);
  writeRel1Text(releaseNotesPath(immutableReleaseId), notes);
  syncRuntimeSourceRegistry();

  const report = {
    generated_at: createdAt,
    status: "ok",
    release_id: immutableReleaseId,
    release_dir: path.relative(repoRoot, destination).replace(/\\/g, "/"),
    manifest_path: path.relative(repoRoot, releaseManifestPath(immutableReleaseId)).replace(/\\/g, "/"),
    notes_path: path.relative(repoRoot, releaseNotesPath(immutableReleaseId)).replace(/\\/g, "/"),
    provenance_path: path.relative(repoRoot, releaseProvenancePath(immutableReleaseId)).replace(/\\/g, "/"),
    scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    publication_list: snapshot.publication_list || [],
    article_count: snapshot.article_count || 0,
    evaluation
  };
  writeRel1Json(rel1Paths.releaseArtifactReport, report);
  recordObservabilityEvent({
    event_type: "release_artifact_built",
    source_surface: "release",
    scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    release_id: immutableReleaseId,
    details: {
      decision: evaluation.decision,
      publication_count: (snapshot.publication_list || []).length,
      issue_count: (snapshot.issue_list || []).length,
      article_count: snapshot.article_count || 0
    }
  });
  return report;
}

export async function withChannelLock(runId, fn) {
  let lock = null;
  try {
    lock = await acquireStateLock("runtime-state", {
      runId,
      script: "scripts/ops/channel"
    });
    return await fn();
  } finally {
    releaseStateLock(lock);
  }
}

export function publishReleaseToChannel({ channel, releaseId, sourceScenarioId = null, promotedFrom = null, action = "publish_channel" }) {
  const manifest = readReleaseManifest(releaseId);
  if (!manifest) {
    recordObservabilityEvent({
      event_type: "channel_manifest_invalid",
      source_surface: "channel",
      channel,
      release_id: releaseId,
      scenario_id: sourceScenarioId || null,
      details: {
        reason: "release_missing"
      }
    });
    throw new Error(`REL1_RELEASE_MISSING:${releaseId}`);
  }
  const previous = readChannelManifest(channel);
  const publishedAt = nowIso();
  const nextManifest = {
    version: "stage-rel1-v1",
    channel,
    current_release_id: releaseId,
    source_scenario_id: sourceScenarioId || manifest.source_scenario_id || null,
    promoted_from: promotedFrom,
    published_at: publishedAt,
    rollback_target: previous.current_release_id || null,
    release_manifest_path: path.relative(repoRoot, releaseManifestPath(releaseId)).replace(/\\/g, "/"),
    provenance_path: path.relative(repoRoot, releaseProvenancePath(releaseId)).replace(/\\/g, "/"),
    status: "active"
  };
  writeChannelManifest(channel, nextManifest);
  const history = appendChannelHistory(channel, {
    timestamp: publishedAt,
    action,
    release_id: releaseId,
    source_scenario_id: manifest.source_scenario_id || null,
    rollback_target: previous.current_release_id || null,
    promoted_from: promotedFrom
  });
  syncRuntimeSourceRegistry();
  recordObservabilityEvent({
    event_type: "channel_publish_succeeded",
    source_surface: "channel",
    channel,
    release_id: releaseId,
    scenario_id: manifest.source_scenario_id || sourceScenarioId || null,
    details: {
      action,
      promoted_from: promotedFrom,
      rollback_target: previous.current_release_id || null
    }
  });
  return { manifest: nextManifest, history };
}

export function rollbackChannelHead(channel) {
  const current = readChannelManifest(channel);
  const history = readChannelHistory(channel);
  const applied = (history.items || []).filter((item) => item.action === "publish_channel" || item.action === "promote_channel");
  const previousEntry = applied.length >= 2 ? applied[applied.length - 2] : null;
  const rolledAt = nowIso();
  if (!previousEntry?.release_id) {
    const cleared = {
      ...defaultChannelManifest(channel),
      published_at: rolledAt,
      status: "rolled_back_empty"
    };
    writeChannelManifest(channel, cleared);
    appendChannelHistory(channel, {
      timestamp: rolledAt,
      action: "rollback_channel",
      rolled_back_from: current.current_release_id || null,
      rolled_back_to: null
    });
    syncRuntimeSourceRegistry();
    recordObservabilityEvent({
      event_type: "channel_rollback_succeeded",
      source_surface: "channel",
      channel,
      release_id: null,
      scenario_id: null,
      details: {
        rolled_back_from: current.current_release_id || null,
        rolled_back_to: null
      }
    });
    return { manifest: cleared, rolled_back_to: null };
  }
  const next = {
    ...current,
    current_release_id: previousEntry.release_id,
    source_scenario_id: previousEntry.source_scenario_id || null,
    promoted_from: "rollback",
    published_at: rolledAt,
    rollback_target: current.current_release_id || null,
    release_manifest_path: path.relative(repoRoot, releaseManifestPath(previousEntry.release_id)).replace(/\\/g, "/"),
    provenance_path: path.relative(repoRoot, releaseProvenancePath(previousEntry.release_id)).replace(/\\/g, "/"),
    status: "active"
  };
  writeChannelManifest(channel, next);
  appendChannelHistory(channel, {
    timestamp: rolledAt,
    action: "rollback_channel",
    rolled_back_from: current.current_release_id || null,
    rolled_back_to: previousEntry.release_id
  });
  syncRuntimeSourceRegistry();
  recordObservabilityEvent({
    event_type: "channel_rollback_succeeded",
    source_surface: "channel",
    channel,
    release_id: previousEntry.release_id,
    scenario_id: previousEntry.source_scenario_id || null,
    details: {
      rolled_back_from: current.current_release_id || null,
      rolled_back_to: previousEntry.release_id
    }
  });
  return { manifest: next, rolled_back_to: previousEntry.release_id };
}

export function summarizeChannels() {
  const channels = channelNames.map((channel) => ({
    channel,
    manifest: readChannelManifest(channel),
    history: readChannelHistory(channel)
  }));
  const report = {
    generated_at: nowIso(),
    channels: channels.map((item) => ({
      channel: item.channel,
      current_release_id: item.manifest.current_release_id,
      source_scenario_id: item.manifest.source_scenario_id,
      published_at: item.manifest.published_at,
      rollback_target: item.manifest.rollback_target,
      status: item.manifest.status,
      history_count: (item.history.items || []).length
    }))
  };
  writeRel1Json(rel1Paths.channelStateReport, report);
  writeRel1Json(rel1Paths.channelHistoryReport, {
    generated_at: report.generated_at,
    channels: channels.map((item) => ({
      channel: item.channel,
      items: item.history.items || []
    }))
  });
  return { channels, report };
}

export function buildRuntimeSourceDiagnostic(state = readRuntimeSource()) {
  const currentMeta = readCurrentMeta();
  const selected = readSelected();
  const effectiveRuntimeSource = currentMeta.dev_preview_source_mode
    ? {
        ...state,
        mode: currentMeta.dev_preview_source_mode,
        scenario_id: currentMeta.dev_preview_source_scenario_id || currentMeta.selected_scenario_id || state.scenario_id || null,
        channel: currentMeta.dev_preview_source_channel || state.channel || null,
        release_id: currentMeta.dev_preview_source_release_id || state.release_id || null,
        selection_reason: currentMeta.selection_source || state.selection_reason || null
      }
    : state;
  const fixtures = effectiveRuntimeSource.mode === "current_mirror"
    ? readJson(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), null)
    : resolveRuntimeSourceFixtures(effectiveRuntimeSource) || readJson(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), null);
  const visiblePublications = Array.from(new Set(
    ((fixtures?.discoveryCatalog?.items || fixtures?.contentSyncDelta?.response?.items || [])
      .map((item) => item.publication_key)
      .filter(Boolean))
  )).sort();
  const report = {
    generated_at: nowIso(),
    runtime_source: state,
    effective_runtime_source: effectiveRuntimeSource,
    current_mirror_scenario_id: currentMeta.selected_scenario_id || null,
    selected_scenario_id: selected.selected_scenario_id || null,
    visible_publications: visiblePublications,
    explanation: [
      "local-first 开发与真机默认都应先读 current_mirror。",
      `当前 current_mirror 实际是 ${currentMeta.selected_scenario_id || "unknown"}。`,
      "要看四刊可发布版本，可切到 current_mirror、scenario_preview:data2_multi_publication_release_candidate 或 channel_head:dev。",
      "要看三刊对照预览，需要显式切到 scenario_preview:data1c_three_release_mixed_preview。"
    ]
  };
  writeRel1Json(rel1Paths.runtimeSourceReport, report);
  writeRel1Json(rel1Paths.h5PreviewReport, report);
  recordObservabilityEvent({
    event_type: "runtime_source_loaded",
    source_surface: "runtime",
    runtime_source_mode: effectiveRuntimeSource.mode,
    scenario_id: effectiveRuntimeSource.scenario_id || currentMeta.selected_scenario_id || null,
    channel: effectiveRuntimeSource.channel || null,
    release_id: effectiveRuntimeSource.release_id || null,
    details: {
      selected_scenario_id: selected.selected_scenario_id || null,
      visible_publications: visiblePublications
    }
  });
  if (effectiveRuntimeSource.mode === "channel_head" && effectiveRuntimeSource.channel) {
    recordObservabilityEvent({
      event_type: "channel_head_resolved",
      source_surface: "channel",
      channel: effectiveRuntimeSource.channel,
      release_id: effectiveRuntimeSource.release_id || null,
      scenario_id: effectiveRuntimeSource.scenario_id || null,
      details: {
        visible_publications: visiblePublications
      }
    });
  }
  if (effectiveRuntimeSource.mode === "remote_channel_head" && effectiveRuntimeSource.channel) {
    if (fixtures) {
      recordObservabilityEvent({
        event_type: "remote_channel_resolved",
        source_surface: "channel",
        runtime_source_mode: effectiveRuntimeSource.mode,
        channel: effectiveRuntimeSource.channel,
        release_id: effectiveRuntimeSource.release_id || null,
        scenario_id: effectiveRuntimeSource.scenario_id || null,
        details: {
          remote_base_url: effectiveRuntimeSource.remote_base_url || null,
          visible_publications: visiblePublications
        }
      });
      recordObservabilityEvent({
        event_type: "remote_release_loaded",
        source_surface: "runtime",
        runtime_source_mode: effectiveRuntimeSource.mode,
        channel: effectiveRuntimeSource.channel,
        release_id: effectiveRuntimeSource.release_id || null,
        scenario_id: effectiveRuntimeSource.scenario_id || null,
        details: {
          remote_base_url: effectiveRuntimeSource.remote_base_url || null
        }
      });
    } else {
      recordObservabilityEvent({
        event_type: "remote_channel_fetch_failed",
        severity: "error",
        source_surface: "runtime",
        runtime_source_mode: effectiveRuntimeSource.mode,
        channel: effectiveRuntimeSource.channel,
        release_id: effectiveRuntimeSource.release_id || null,
        scenario_id: effectiveRuntimeSource.scenario_id || null,
        error_code: "OBS1_REMOTE_CHANNEL_FETCH_FAILED",
        details: {
          remote_base_url: effectiveRuntimeSource.remote_base_url || null,
          reason: "dist_bundle_missing"
        }
      });
    }
  }
  if (effectiveRuntimeSource.scenario_id) {
    recordObservabilityEvent({
      event_type: fixtures ? "scenario_bundle_loaded" : "scenario_bundle_missing",
      source_surface: "runtime",
      scenario_id: effectiveRuntimeSource.scenario_id,
      channel: effectiveRuntimeSource.channel || null,
      release_id: effectiveRuntimeSource.release_id || null,
      details: {
        fixture_found: Boolean(fixtures)
      }
    });
  }
  return report;
}
