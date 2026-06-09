import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { pipelinePaths, repoRoot } from "../../import/lib/content-pipeline.mjs";
import { resolveSandboxPath } from "../../lib/sandbox-paths.mjs";
import {
  buildScenarioSnapshot,
  compareScenarioSet,
  evaluatePromotionDecision,
  findScenarioRecord,
  opsPaths,
  parseArgs,
  readCurrentMeta,
  readJsonOr,
  readSelected,
  resolveBaselineScenarioId,
  writeJson,
  writeText
} from "./ops-lib.mjs";

export { parseArgs };

export const ops3Paths = {
  root: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3")),
  releaseNotes: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "release-notes.md")),
  releaseManifest: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "release-manifest.json")),
  prePublishSnapshot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "pre-publish-snapshot.json")),
  postPublishSnapshot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "post-publish-snapshot.json")),
  postRollbackSnapshot: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "post-rollback-snapshot.json")),
  drillReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "drill-report.json")),
  publishHistory: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "publish-history.json")),
  dashboard: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "dashboard.json")),
  smokeReport: resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-ops3", "smoke-report.json"))
};

export function ensureOps3Dirs() {
  fs.mkdirSync(ops3Paths.root, { recursive: true });
}

export function writeOps3Json(filePath, value) {
  ensureOps3Dirs();
  writeJson(filePath, value);
}

export function writeOps3Text(filePath, value) {
  ensureOps3Dirs();
  writeText(filePath, value);
}

export function runNodeJson(scriptPath, args = []) {
  const resolvedPath = scriptPath instanceof URL ? fileURLToPath(scriptPath) : scriptPath;
  const output = execFileSync(process.execPath, [resolvedPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024
  });
  return JSON.parse(output);
}

export function runNodeJsonAllowFailure(scriptPath, args = []) {
  try {
    return runNodeJson(scriptPath, args);
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

export function readGitContext() {
  return {
    branch: runGit(["branch", "--show-current"]),
    commit_sha: runGit(["rev-parse", "HEAD"]),
    short_sha: runGit(["rev-parse", "--short", "HEAD"]),
    tags_at_head: (runGit(["tag", "--points-at", "HEAD"]) || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export function defaultTargetScenarioId() {
  return "data2_multi_publication_release_candidate";
}

export function defaultRejectScenarioId() {
  return "data1c_three_release_mixed_preview";
}

export function buildReleaseManifest({ scenarioId, baselineScenarioId = null, refresh = false } = {}) {
  const baselineId = resolveBaselineScenarioId(baselineScenarioId);
  const evaluation = evaluatePromotionDecision({
    scenarioId,
    baselineScenarioId: baselineId,
    refresh
  });
  const diff = compareScenarioSet({
    candidateScenarioId: scenarioId,
    baselineScenarioId: baselineId
  });
  const snapshot = buildScenarioSnapshot(scenarioId, "candidate");
  const currentMeta = readCurrentMeta();
  const selected = readSelected();
  const scenarioRecord = findScenarioRecord(scenarioId);
  const baselineComparison = (diff.comparisons || []).find((item) => item.from_state_role === "baseline") || null;

  const manifest = {
    generated_at: new Date().toISOString(),
    scenario_id: scenarioId,
    baseline_scenario_id: baselineId,
    selected_scenario_id: selected.selected_scenario_id || null,
    current_scenario_id: currentMeta.selected_scenario_id || null,
    source_bundle_path: scenarioRecord?.bundle_path || null,
    build_label: scenarioRecord?.build_label || snapshot.build_label || null,
    publication_list: snapshot.publication_list || [],
    issue_list: snapshot.issue_list || [],
    article_count: snapshot.article_count || 0,
    compared_against_baseline: baselineComparison ? {
      publication_delta: baselineComparison.counts?.publication_count?.delta || 0,
      issue_delta: baselineComparison.counts?.issue_count?.delta || 0,
      article_delta: baselineComparison.counts?.article_count?.delta || 0,
      warnings: (baselineComparison.warnings || []).map((item) => item.code),
      info: (baselineComparison.info || []).map((item) => item.code)
    } : null,
    warning_summary: {
      gate_warnings: evaluation.gate?.warnings || [],
      decision_warnings: evaluation.warnings || [],
      accepted_anomalies: (evaluation.budget_summary?.accepted_warnings || []).map((item) => ({
        issue_id: item.issue_id,
        warning_type: item.warning_type,
        count: item.count,
        classification: item.classification
      }))
    },
    override_summary: {
      total_override_count: snapshot.override_summary?.count || 0,
      accepted_overrides: (evaluation.budget_summary?.accepted_overrides || []).map((item) => ({
        issue_id: item.issue_id,
        count: item.count,
        classification: item.classification
      }))
    },
    promotable_reason: evaluation.decision === "promotable"
      ? [
        "OPS1 gate passed.",
        "OPS2 promotion decision is promotable.",
        "DATA2 budget allows remaining override drift without unresolved release-blocking warnings."
      ]
      : [],
    mixed_preview_not_chosen: [
      "data1c_three_release_mixed_preview remains preview-only by DATA2 policy.",
      "Economist anomaly is accepted only for preview, not for release-candidate apply."
    ],
    gate_status: evaluation.gate?.status || null,
    promotion_decision: evaluation.decision,
    git_context: readGitContext()
  };

  writeOps3Json(ops3Paths.releaseManifest, manifest);
  return manifest;
}

export function buildReleaseNotes(markdown) {
  writeOps3Text(ops3Paths.releaseNotes, markdown);
  return { path: ops3Paths.releaseNotes };
}

export function buildScenarioProvenanceSnapshot({
  label,
  targetScenarioId,
  baselineScenarioId = null,
  operatorAction,
  gateResult = null,
  promotionDecision = null,
  publishTimestamp = null,
  notes = []
}) {
  const baselineId = baselineScenarioId || resolveBaselineScenarioId();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const targetRecord = targetScenarioId ? findScenarioRecord(targetScenarioId) : null;
  const currentRecord = currentMeta.selected_scenario_id ? findScenarioRecord(currentMeta.selected_scenario_id) : null;

  const snapshot = {
    generated_at: new Date().toISOString(),
    label,
    operator_action: operatorAction,
    target_scenario_id: targetScenarioId || null,
    selected_scenario_id: selected.selected_scenario_id || null,
    current_mirror_scenario_id: currentMeta.selected_scenario_id || null,
    baseline_scenario_id: baselineId,
    source_bundle_path: targetRecord?.bundle_path || null,
    current_bundle_path: currentRecord?.bundle_path || null,
    publish_timestamp: publishTimestamp || currentMeta.published_to_current_at || selected.published_at || null,
    gate_result: gateResult,
    promotion_decision: promotionDecision,
    current_metadata: currentMeta,
    git_context: readGitContext(),
    notes
  };

  const outputPath = label === "pre-publish"
    ? ops3Paths.prePublishSnapshot
    : label === "post-publish"
      ? ops3Paths.postPublishSnapshot
      : ops3Paths.postRollbackSnapshot;

  writeOps3Json(outputPath, snapshot);
  return snapshot;
}

export function buildOps3Dashboard({
  candidateScenarioId,
  baselineScenarioId,
  prePublishSnapshot,
  postPublishSnapshot,
  postRollbackSnapshot,
  manifest,
  rejectResult = null,
  drillHistory = []
}) {
  const dashboard = {
    generated_at: new Date().toISOString(),
    candidate_scenario_id: candidateScenarioId,
    baseline_scenario_id: baselineScenarioId,
    initial_current_scenario_id: prePublishSnapshot?.current_mirror_scenario_id || null,
    post_publish_current_scenario_id: postPublishSnapshot?.current_mirror_scenario_id || null,
    post_rollback_current_scenario_id: postRollbackSnapshot?.current_mirror_scenario_id || null,
    promotion_decision: manifest?.promotion_decision || null,
    publish_action: drillHistory.find((item) => item.action === "promote_apply") || null,
    rollback_action: drillHistory.find((item) => item.action === "rollback") || null,
    accepted_anomalies: manifest?.warning_summary?.accepted_anomalies || [],
    preview_only_reject: rejectResult,
    release_notes_path: path.relative(repoRoot, ops3Paths.releaseNotes).replace(/\\/g, "/"),
    release_manifest_path: path.relative(repoRoot, ops3Paths.releaseManifest).replace(/\\/g, "/")
  };

  writeOps3Json(ops3Paths.dashboard, dashboard);
  return dashboard;
}

export function buildOps3PublishHistory(items) {
  const payload = {
    generated_at: new Date().toISOString(),
    items
  };
  writeOps3Json(ops3Paths.publishHistory, payload);
  return payload;
}

export function buildOps3DrillReport(report) {
  writeOps3Json(ops3Paths.drillReport, report);
  return report;
}

export function snapshotRuntimeFiles() {
  const selectedPath = pipelinePaths.runtimeScenarioSelected;
  const indexPath = pipelinePaths.runtimeScenarioIndex;
  const currentMetaPath = path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json");
  const currentBundlePath = path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json");
  const readBuffer = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  return {
    selectedPath,
    indexPath,
    currentMetaPath,
    currentBundlePath,
    selected: readBuffer(selectedPath),
    index: readBuffer(indexPath),
    currentMeta: readBuffer(currentMetaPath),
    currentBundle: readBuffer(currentBundlePath)
  };
}

export function restoreRuntimeFiles(snapshot) {
  const restore = (filePath, content) => {
    if (content === null) {
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
      return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  };

  restore(snapshot.selectedPath, snapshot.selected);
  restore(snapshot.indexPath, snapshot.index);
  restore(snapshot.currentMetaPath, snapshot.currentMeta);
  restore(snapshot.currentBundlePath, snapshot.currentBundle);
}

export function readOpsHistories() {
  return {
    ops1: readJsonOr(opsPaths.publishHistory, { items: [] }),
    ops2: readJsonOr(opsPaths.ops2PromotionHistory, { items: [] })
  };
}
