import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { pipelinePaths, readJson, repoRoot, writeJson } from "../../import/lib/content-pipeline.mjs";
import { opsPaths, readCurrentMeta, readSelected, resolveBaselineScenarioId } from "./ops-lib.mjs";
import { qualityPaths } from "./quality-budget-lib.mjs";
import { buildPublicationCoverage, data3Paths } from "./taxonomy-lib.mjs";
import { readChannelManifest, readRuntimeSource } from "./release-channel-lib.mjs";
import { observabilityPaths } from "./observability-lib.mjs";
import { buildEditorialCrudSnapshot, ops5Paths } from "../crud/lib.mjs";
import { buildRuntimeDistSnapshot } from "./runtime-dist-lib.mjs";
import { compareIssueMetaDescending, getIssueMeta } from "../../../shared/utils/issue-meta.js";

export const ops4Paths = {
  root: path.join(repoRoot, "output", "stage-ops4"),
  consoleMap: path.join(repoRoot, "output", "stage-ops4", "operator-console-map.json"),
  actionsReport: path.join(repoRoot, "output", "stage-ops4", "operator-console-actions-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-ops4", "operator-console-smoke-report.json")
};

export const consolePaths = {
  root: path.join(repoRoot, "ops", "console"),
  indexHtml: path.join(repoRoot, "ops", "console", "index.html"),
  appJs: path.join(repoRoot, "ops", "console", "app.js"),
  stylesCss: path.join(repoRoot, "ops", "console", "styles.css")
};

export function ensureOps4Dirs() {
  fs.mkdirSync(ops4Paths.root, { recursive: true });
}

export function writeOps4Json(filePath, value) {
  ensureOps4Dirs();
  writeJson(filePath, value);
}

function loadJson(filePath, fallback = null) {
  return readJson(filePath, fallback);
}

function buildPublicationSummaries({
  publications,
  issues,
  issueQualityMap,
  issueWarningMap,
  candidateIssueSet,
  taxonomyCoverage
}) {
  const issueCoverageMap = new Map(
    (taxonomyCoverage || []).flatMap((publication) =>
      (publication.issue_summaries || []).map((issue) => [issue.issue_id, issue])
    )
  );

  return (publications.items || [])
    .map((publication) => {
      const issueSummaries = (issues.items || [])
        .filter((issue) => issue.publication_id === publication.id)
        .map((issue) => {
          const issueMeta = getIssueMeta(issue);
          const quality = issueQualityMap.get(issue.issue_id) || {};
          const warning = issueWarningMap.get(issue.issue_id) || {};
          const coverage = issueCoverageMap.get(issue.issue_id) || {};
          return {
            issue_id: issue.issue_id,
            issue_label: issueMeta.issue_label,
            issue_sort_key: issueMeta.issue_sort_key,
            issue_display_label: issueMeta.issue_display_label,
            status: issue.status || issue.import_status || "active",
            enabled: issue.enabled !== false,
            parser_profile: issue.parser_profile || "",
            source_pack: issue.source_pack || issue.source_zip || "",
            article_count: quality.article_count ?? issue.article_pair_count ?? issue.article_count ?? 0,
            warnings_count: quality.warnings_count ?? issue.import_warnings_count ?? issue.warnings_count ?? 0,
            unresolved_warnings_count: quality.unresolved_warnings_count ?? 0,
            overrides_count: quality.overrides_count ?? 0,
            raw_section_count: coverage.raw_section_count ?? 0,
            mapped_ratio: coverage.mapped_ratio ?? null,
            warning_types: warning.unresolved_warning_counts || {},
            in_release_candidate: candidateIssueSet.has(issue.issue_id),
            manifest_path: issue.manifest_path || null
          };
        })
        .sort(compareIssueMetaDescending);

      const latestIssue = issueSummaries[0] || null;
      return {
        publication_id: publication.id,
        display_name: publication.display_name || publication.id,
        locale: publication.locale || "zh-CN",
        status: publication.status || "active",
        parser_profiles: publication.parser_profiles || [],
        issue_count: issueSummaries.length,
        active_issue_count: issueSummaries.filter((issue) => issue.status !== "archived" && issue.enabled !== false).length,
        archived_issue_count: issueSummaries.filter((issue) => issue.status === "archived" || issue.enabled === false).length,
        candidate_issue_count: issueSummaries.filter((issue) => issue.in_release_candidate).length,
        total_article_count: issueSummaries.reduce((sum, issue) => sum + (issue.article_count || 0), 0),
        total_warnings_count: issueSummaries.reduce((sum, issue) => sum + (issue.warnings_count || 0), 0),
        total_unresolved_warnings_count: issueSummaries.reduce((sum, issue) => sum + (issue.unresolved_warnings_count || 0), 0),
        latest_issue_id: latestIssue?.issue_id || null,
        latest_issue_label: latestIssue?.issue_label || null,
        latest_issue_sort_key: latestIssue?.issue_sort_key || null,
        latest_issue_display_label: latestIssue?.issue_display_label || null,
        issue_summaries: issueSummaries
      };
    })
    .sort((left, right) => {
      if ((left.latest_issue_sort_key || "") !== (right.latest_issue_sort_key || "")) {
        return String(right.latest_issue_sort_key || "").localeCompare(String(left.latest_issue_sort_key || ""));
      }
      return String(left.display_name || left.publication_id).localeCompare(String(right.display_name || right.publication_id));
    });
}

function latestHistoryEntry(items = [], actionNames = []) {
  return [...items].reverse().find((item) => actionNames.includes(item.action)) || null;
}

export function buildOperatorConsoleSnapshot() {
  const publications = loadJson(pipelinePaths.publicationsRegistry, { items: [] });
  const issues = loadJson(pipelinePaths.issuesRegistry, { items: [] });
  const scenarios = loadJson(pipelinePaths.runtimeScenarioIndex, { items: [], selected_scenario_id: null });
  const selected = readSelected();
  const current = readCurrentMeta();
  const baselineScenarioId = resolveBaselineScenarioId();
  const ops2Dashboard = loadJson(opsPaths.ops2PromotionDashboard, null);
  const ops2Evaluation = loadJson(opsPaths.ops2PromotionEvaluation, null);
  const ops1History = loadJson(opsPaths.publishHistory, { items: [] });
  const ops2History = loadJson(opsPaths.ops2PromotionHistory, { items: [] });
  const data2Budget = loadJson(qualityPaths.warningBudgetReport, null);
  const data2Readiness = loadJson(qualityPaths.promotionReadinessReport, null);
  const metadataQuality = loadJson(path.join(repoRoot, "output", "stage-data1d", "metadata-quality-report.json"), { items: [] });
  const warningReport = loadJson(path.join(repoRoot, "output", "stage-data1d", "warning-report.json"), { items: [] });
  const data3Coverage = {
    generated_at: new Date().toISOString(),
    publications: buildPublicationCoverage()
  };
  const data3Discovery = loadJson(data3Paths.discoveryQualityReport, null);
  const data3Drift = loadJson(data3Paths.taxonomyDriftReport, null);
  const ops3ReleaseManifest = loadJson(path.join(repoRoot, "output", "stage-ops3", "release-manifest.json"), null);
  const ops3PrePublish = loadJson(path.join(repoRoot, "output", "stage-ops3", "pre-publish-snapshot.json"), null);
  const ops3PostRollback = loadJson(path.join(repoRoot, "output", "stage-ops3", "post-rollback-snapshot.json"), null);
  const ops3History = loadJson(path.join(repoRoot, "output", "stage-ops3", "publish-history.json"), { items: [] });
  const releaseNotesPath = path.join(repoRoot, "output", "stage-ops3", "release-notes.md");
  const latestPublish = latestHistoryEntry(ops3History.items || ops1History.items || [], ["promote_apply", "publish"]);
  const latestRollback = latestHistoryEntry(ops3History.items || ops1History.items || [], ["rollback"]);
  const runtimeSource = readRuntimeSource();
  const channels = ["dev", "staging", "production"].map((channel) => readChannelManifest(channel));
  const triageDashboard = loadJson(observabilityPaths.triageDashboardReport, null);
  const sourceHealth = loadJson(observabilityPaths.sourceHealthReport, null);
  const channelHealth = loadJson(observabilityPaths.channelHealthReport, null);
  const contentHealth = loadJson(observabilityPaths.contentHealthReport, null);
  const incidents = loadJson(observabilityPaths.incidentSummaryReport, null);
  const editorial = buildEditorialCrudSnapshot();
  const runtimeDist = buildRuntimeDistSnapshot();
  const issueQualityMap = new Map((metadataQuality.items || []).map((issue) => [issue.issue_id, issue]));
  const issueWarningMap = new Map((warningReport.items || []).map((item) => [item.issue_id, item]));
  const releaseCandidateScenario =
    (scenarios.items || []).find((item) => item.scenario_id === "data2_multi_publication_release_candidate") ||
    null;
  const candidateIssueSet = new Set(
    (releaseCandidateScenario?.included_issues || []).map((issue) => `${issue.publication_id}__${issue.issue_label}`)
  );
  const publicationSummaries = buildPublicationSummaries({
    publications,
    issues,
    issueQualityMap,
    issueWarningMap,
    candidateIssueSet,
    taxonomyCoverage: data3Coverage.publications
  });

  return {
    generated_at: new Date().toISOString(),
    mode: "local_op",
    overview: {
      baseline_scenario_id: baselineScenarioId,
      selected_scenario_id: selected.selected_scenario_id || null,
      current_scenario_id: current.selected_scenario_id || null,
      candidate_scenario_id: ops2Dashboard?.candidate_scenario_id || data2Readiness?.release_candidate?.scenario_id || null,
      candidate_decision: ops2Evaluation?.decision || null,
      latest_publish: latestPublish,
      latest_rollback: latestRollback,
      warnings_summary: ops2Evaluation?.warnings || [],
      runtime_source: runtimeSource
    },
    content: {
      publications: publications.items || [],
      issues: issues.items || [],
      publication_summaries: publicationSummaries,
      taxonomy_coverage: data3Coverage?.publications || []
    },
    quality: {
      warning_budgets: data2Budget?.warning_budgets || null,
      accepted_warnings: data2Budget?.accepted_registry || null,
      promotion_readiness: data2Readiness || null,
      taxonomy_drift: data3Drift || null,
      taxonomy_discovery: data3Discovery || null
    },
    scenarios: {
      items: scenarios.items || [],
      dashboard: ops2Dashboard,
      evaluation: ops2Evaluation
    },
    release: {
      manifest: ops3ReleaseManifest,
      channels,
      runtime_source: runtimeSource,
      runtime_dist: runtimeDist,
      pre_publish_snapshot: ops3PrePublish,
      post_rollback_snapshot: ops3PostRollback,
      release_notes_path: fs.existsSync(releaseNotesPath)
        ? path.relative(repoRoot, releaseNotesPath).replace(/\\/g, "/")
        : null,
      publish_history: ops3History.items || []
    },
    observability: {
      triage_dashboard: triageDashboard,
      source_health: sourceHealth,
      channel_health: channelHealth,
      content_health: contentHealth,
      incidents
    },
    editorial: {
      ...editorial,
      publication_summaries: publicationSummaries
    }
  };
}

function buildCrudActionMap() {
  return [
    { action: "publication_list", script: "scripts/ops/crud/publications.mjs --action list", stateful: false, safety: "read-only registry view" },
    { action: "publication_create", script: "scripts/ops/crud/publications.mjs --action create", stateful: true, safety: "runtime-state lock, atomic registry update" },
    { action: "publication_delete", script: "scripts/ops/crud/publications.mjs --action delete", stateful: true, safety: "runtime-state lock, guarded cascade delete for source-of-truth records only" },
    { action: "issue_list", script: "scripts/ops/crud/issues.mjs --action list", stateful: false, safety: "read-only registry view" },
    { action: "issue_create", script: "scripts/ops/crud/issues.mjs --action create", stateful: true, safety: "runtime-state lock, atomic registry update" },
    { action: "issue_edit", script: "scripts/ops/crud/issues.mjs --action edit", stateful: true, safety: "runtime-state lock, issue identity migration with registry/file follow-ups" },
    { action: "issue_delete", script: "scripts/ops/crud/issues.mjs --action delete", stateful: true, safety: "runtime-state lock, guarded issue cleanup for source-of-truth records only" },
    { action: "article_override_edit", script: "scripts/ops/crud/article-overrides.mjs --action edit", stateful: true, safety: "runtime-state lock, override + normalized record update" },
    { action: "taxonomy_edit", script: "scripts/ops/crud/taxonomy.mjs --action edit", stateful: true, safety: "runtime-state lock, taxonomy + targeted rebuilds" },
    { action: "scenario_membership_edit", script: "scripts/ops/crud/scenario-membership.mjs --action edit", stateful: true, safety: "runtime-state lock, budget + candidate refresh" }
  ];
}

export function buildOps5Snapshot() {
  return {
    root: path.relative(repoRoot, ops5Paths.root).replace(/\\/g, "/"),
    audit_log: loadJson(ops5Paths.crudAuditLog, { items: [] }),
    entity_change_report: loadJson(ops5Paths.entityChangeReport, null),
    rebuild_trigger_report: loadJson(ops5Paths.rebuildTriggerReport, null)
  };
}

export function buildConsoleCrudMap() {
  return {
    title: "Editorial CRUD",
    data_sources: [
      "data/real-content/publications.json",
      "data/real-content/issues.json",
      "data/real-content/overrides/*/metadata-overrides.json",
      "data/real-content/taxonomy/*",
      "data/real-content/quality/warning-budgets.json",
      "output/stage-ops5/*"
    ],
    action_to_script_map: buildCrudActionMap()
  };
}

export function buildOperatorConsoleMapSections() {
  return [
    { key: "overview", title: "Overview", data_sources: ["current scenario meta", "selected scenario", "promotion dashboard", "publish history"] },
    { key: "content", title: "Content", data_sources: ["publications registry", "issues registry", "taxonomy coverage"] },
    { key: "quality", title: "Quality", data_sources: ["warning budget", "promotion readiness", "taxonomy drift", "unmapped sections"] },
    { key: "scenarios", title: "Scenarios", data_sources: ["scenario index", "compare report", "evaluation report", "release manifest"] },
    { key: "observability", title: "Observability", data_sources: ["output/stage-obs1/*", "runtime/observability/*", "recent incidents", "channel/source health"] },
    { key: "runtime_dist", title: "Runtime Dist", data_sources: ["runtime/dist/*", "output/stage-rel2/*", "remote runtime bridge"] },
    { key: "editorial", title: "Editorial CRUD", data_sources: buildConsoleCrudMap().data_sources },
    { key: "actions", title: "Actions", data_sources: ["script execution results", "lock-protected ops scripts", "channel state", "runtime source"] }
  ];
}

export function buildOperatorConsoleRouteMap() {
  return [
    { route: "/", page: "OperatorConsoleApp", components: ["overview-panel", "content-panel", "quality-panel", "scenario-panel", "editorial-panel", "action-panel"] }
  ];
}

export function buildOperatorConsoleSafetyNotes() {
  return [
    "Stateful actions are delegated to existing scripts and inherit TEST2 lock/sandbox protections.",
    "Preview-only scenarios remain subject to OPS2/DATA2 decision gates and cannot be silently applied.",
    "Console is local-op only; no multi-user coordination is assumed.",
    "OPS5 CRUD edits never write immutable release artifacts directly."
  ];
}

export function buildOperatorConsoleActionMap() {
  return [
    { action: "intake", script: "scripts/ops/intake-pack.mjs", stateful: true, safety: "runtime-state lock handled by script profile / import flow" },
    { action: "build_release_candidate", script: "scripts/ops/build-release-candidate.mjs", stateful: false, safety: "writes reports and scenario bundle" },
    { action: "compare", script: "scripts/ops/compare-scenarios.mjs", stateful: false, safety: "report only" },
    { action: "evaluate", script: "scripts/ops/evaluate-promotion.mjs", stateful: false, safety: "report only unless refresh reruns TEST1" },
    { action: "dry_run_publish", script: "scripts/ops/promote-scenario.mjs --dry-run", stateful: false, safety: "decision only, no pointer mutation" },
    { action: "apply_publish", script: "scripts/ops/promote-scenario.mjs --apply", stateful: true, safety: "runtime-state lock in promote-scenario" },
    { action: "rollback", script: "scripts/ops/rollback-scenario.mjs", stateful: true, safety: "runtime-state lock in rollback-scenario" },
    { action: "retire", script: "scripts/ops/retire-scenario.mjs", stateful: true, safety: "scenario lifecycle mutation" },
    { action: "publish_channel", script: "scripts/ops/publish-channel.mjs", stateful: true, safety: "runtime-state lock, channel head atomic update" },
    { action: "promote_channel", script: "scripts/ops/promote-channel.mjs", stateful: true, safety: "runtime-state lock, immutable release reuse" },
    { action: "rollback_channel", script: "scripts/ops/rollback-channel.mjs", stateful: true, safety: "runtime-state lock, channel history-based rollback" },
    { action: "set_runtime_source", script: "scripts/ops/set-runtime-source.mjs", stateful: false, safety: "dev-only local source selector" },
    { action: "export_runtime_dist", script: "scripts/ops/export-runtime-dist.mjs", stateful: false, safety: "repeatable dist export from REL1 source of truth" },
    { action: "serve_runtime_dist", script: "scripts/ops/serve-runtime-dist.mjs", stateful: false, safety: "local static probe server only" }
  ];
}

export function buildOperatorConsoleMapPayload() {
  return {
    generated_at: new Date().toISOString(),
    console_root: path.relative(repoRoot, consolePaths.root).replace(/\\/g, "/"),
    sections: buildOperatorConsoleMapSections(),
    route_map: buildOperatorConsoleRouteMap(),
    action_to_script_map: buildOperatorConsoleActionMap(),
    crud_action_to_script_map: buildCrudActionMap(),
    safety_notes: buildOperatorConsoleSafetyNotes()
  };
}

export function buildOperatorConsoleMap() {
  return buildOperatorConsoleMapPayload();
}

export function buildOperatorConsoleActionsReport() {
  const map = buildOperatorConsoleMapPayload();
  return {
    generated_at: map.generated_at,
    actions: map.action_to_script_map,
    crud_actions: map.crud_action_to_script_map,
    safety_notes: map.safety_notes
  };
}

export function buildOperatorConsoleFullSnapshot() {
  const snapshot = buildOperatorConsoleSnapshot();
  snapshot.ops5 = buildOps5Snapshot();
  return snapshot;
}

export function buildConsoleMap() {
  const map = buildOperatorConsoleMapPayload();
  writeOps4Json(ops4Paths.consoleMap, map);
  writeOps4Json(ops4Paths.actionsReport, buildOperatorConsoleActionsReport());
  return map;
}

export function runScriptJson(scriptPath, args = []) {
  const output = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024
  });
  return JSON.parse(output);
}

export function runScriptJsonAllowFailure(scriptPath, args = []) {
  try {
    return runScriptJson(scriptPath, args);
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}
