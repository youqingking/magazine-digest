import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { atomicWriteJson } from "../../lib/atomic-json.mjs";
import { pipelinePaths, readJson, repoRoot } from "../../import/lib/content-pipeline.mjs";
import {
  readCurrentMeta,
  readSelected,
  resolveBaselineScenarioId
} from "./ops-lib.mjs";

const OBS_SCHEMA_VERSION = "stage-obs1-v1";
const MAX_EVENT_FILES = 400;
const MAX_RECENT_EVENTS = 120;
const RECENT_WINDOW_DAYS = 14;

export const observabilityPaths = {
  root: path.join(repoRoot, "runtime", "observability"),
  eventsRoot: path.join(repoRoot, "runtime", "observability", "events"),
  incidentsRoot: path.join(repoRoot, "runtime", "observability", "incidents"),
  summariesRoot: path.join(repoRoot, "runtime", "observability", "summaries"),
  rollingEvents: path.join(repoRoot, "runtime", "observability", "summaries", "rolling-events.json"),
  rollingIncidents: path.join(repoRoot, "runtime", "observability", "incidents", "recent-incidents.json"),
  outputRoot: path.join(repoRoot, "output", "stage-obs1"),
  runtimeEventsReport: path.join(repoRoot, "output", "stage-obs1", "runtime-events-report.json"),
  incidentSummaryReport: path.join(repoRoot, "output", "stage-obs1", "incident-summary.json"),
  sourceHealthReport: path.join(repoRoot, "output", "stage-obs1", "source-health-report.json"),
  channelHealthReport: path.join(repoRoot, "output", "stage-obs1", "channel-health-report.json"),
  contentHealthReport: path.join(repoRoot, "output", "stage-obs1", "content-health-report.json"),
  triageDashboardReport: path.join(repoRoot, "output", "stage-obs1", "triage-dashboard.json"),
  errorTaxonomyReport: path.join(repoRoot, "output", "stage-obs1", "error-taxonomy-report.json"),
  smokeReport: path.join(repoRoot, "output", "stage-obs1", "smoke-report.json")
};

const eventDefaults = {
  runtime_source_loaded: { category: "runtime_source", severity: "info", sourceSurface: "runtime" },
  runtime_source_switched: { category: "runtime_source", severity: "info", sourceSurface: "runtime" },
  runtime_source_invalid: { category: "runtime_source", severity: "error", sourceSurface: "runtime", errorCode: "OBS1_RUNTIME_SOURCE_INVALID" },
  channel_head_resolved: { category: "runtime_source", severity: "info", sourceSurface: "channel" },
  remote_channel_resolved: { category: "runtime_source", severity: "info", sourceSurface: "channel" },
  remote_channel_fetch_failed: { category: "runtime_source", severity: "error", sourceSurface: "runtime", errorCode: "OBS1_REMOTE_CHANNEL_FETCH_FAILED" },
  remote_release_loaded: { category: "runtime_source", severity: "info", sourceSurface: "runtime" },
  remote_fallback_applied: { category: "runtime_source", severity: "warning", sourceSurface: "runtime", errorCode: "OBS1_REMOTE_FALLBACK_APPLIED" },
  scenario_bundle_loaded: { category: "runtime_source", severity: "info", sourceSurface: "runtime" },
  scenario_bundle_missing: { category: "runtime_source", severity: "error", sourceSurface: "runtime", errorCode: "OBS1_SCENARIO_BUNDLE_MISSING" },
  feed_loaded: { category: "content_discovery", severity: "info", sourceSurface: "app" },
  search_loaded: { category: "content_discovery", severity: "info", sourceSurface: "app" },
  detail_loaded: { category: "content_detail", severity: "info", sourceSurface: "app" },
  publication_list_loaded: { category: "content_discovery", severity: "info", sourceSurface: "app" },
  discovery_filter_applied: { category: "content_discovery", severity: "info", sourceSurface: "app" },
  unmapped_taxonomy_encountered: { category: "quality", severity: "warning", sourceSurface: "app" },
  content_load_failed: { category: "incident", severity: "error", sourceSurface: "app", errorCode: "OBS1_CONTENT_LOAD_FAILED" },
  scenario_resolution_failed: { category: "incident", severity: "error", sourceSurface: "runtime", errorCode: "OBS1_SCENARIO_MISSING" },
  release_manifest_invalid: { category: "incident", severity: "error", sourceSurface: "release", errorCode: "OBS1_RELEASE_MANIFEST_INVALID" },
  channel_manifest_invalid: { category: "incident", severity: "error", sourceSurface: "channel", errorCode: "OBS1_CHANNEL_MANIFEST_INVALID" },
  article_payload_incomplete: { category: "incident", severity: "error", sourceSurface: "app", errorCode: "OBS1_ARTICLE_PAYLOAD_INCOMPLETE" },
  template_runtime_error: { category: "incident", severity: "error", sourceSurface: "app" },
  paywall_route_failed: { category: "incident", severity: "error", sourceSurface: "app" },
  rollback_failed: { category: "ops_release", severity: "error", sourceSurface: "release", errorCode: "OBS1_ROLLBACK_FAILED" },
  publish_failed: { category: "ops_release", severity: "error", sourceSurface: "release", errorCode: "OBS1_PUBLISH_FAILED" },
  release_artifact_built: { category: "ops_release", severity: "info", sourceSurface: "release" },
  channel_publish_attempted: { category: "ops_release", severity: "info", sourceSurface: "channel" },
  channel_publish_succeeded: { category: "ops_release", severity: "info", sourceSurface: "channel" },
  channel_publish_rejected: { category: "ops_release", severity: "warning", sourceSurface: "channel" },
  channel_rollback_succeeded: { category: "ops_release", severity: "info", sourceSurface: "channel" },
  promotion_evaluated: { category: "ops_release", severity: "info", sourceSurface: "ops" },
  warning_budget_exceeded: { category: "quality", severity: "warning", sourceSurface: "ops", errorCode: "OBS1_WARNING_BUDGET_EXCEEDED" },
  accepted_warning_applied: { category: "quality", severity: "info", sourceSurface: "ops" },
  override_applied: { category: "quality", severity: "info", sourceSurface: "ops" },
  taxonomy_gap_detected: { category: "quality", severity: "warning", sourceSurface: "ops" }
};

const errorTaxonomy = [
  {
    error_code: "OBS1_REMOTE_CHANNEL_FETCH_FAILED",
    severity: "error",
    actionability: "operator_attention",
    description: "remote-like channel manifest or release bundle could not be fetched"
  },
  {
    error_code: "OBS1_REMOTE_FALLBACK_APPLIED",
    severity: "warning",
    actionability: "operator_attention",
    description: "remote-like runtime read fell back to local channel head or current mirror"
  },
  {
    error_code: "OBS1_RUNTIME_SOURCE_INVALID",
    severity: "error",
    actionability: "release_or_runtime_attention",
    description: "runtime source mode or target cannot be resolved"
  },
  {
    error_code: "OBS1_SCENARIO_MISSING",
    severity: "error",
    actionability: "release_blocking",
    description: "scenario pointer or scenario resolution target is missing"
  },
  {
    error_code: "OBS1_SCENARIO_BUNDLE_MISSING",
    severity: "error",
    actionability: "release_blocking",
    description: "scenario exists but bundle is not readable"
  },
  {
    error_code: "OBS1_CHANNEL_MANIFEST_INVALID",
    severity: "error",
    actionability: "release_blocking",
    description: "channel head is unreadable or points to an invalid release"
  },
  {
    error_code: "OBS1_RELEASE_MANIFEST_INVALID",
    severity: "error",
    actionability: "release_blocking",
    description: "release artifact manifest is missing or invalid"
  },
  {
    error_code: "OBS1_CONTENT_LOAD_FAILED",
    severity: "error",
    actionability: "operator_attention",
    description: "feed/search/detail content path failed and no healthy response was produced"
  },
  {
    error_code: "OBS1_ARTICLE_PAYLOAD_INCOMPLETE",
    severity: "error",
    actionability: "operator_attention",
    description: "detail payload is readable but missing required fields for rendering"
  },
  {
    error_code: "OBS1_WARNING_BUDGET_EXCEEDED",
    severity: "warning",
    actionability: "operator_attention",
    description: "accepted warnings exceeded the configured budget or unregistered warnings appeared"
  },
  {
    error_code: "OBS1_PUBLISH_FAILED",
    severity: "error",
    actionability: "operator_attention",
    description: "publish action failed or was rejected during apply"
  },
  {
    error_code: "OBS1_ROLLBACK_FAILED",
    severity: "critical",
    actionability: "release_blocking",
    description: "rollback could not restore a known good target"
  }
];

function nowIso() {
  return new Date().toISOString();
}

function ensureDirs() {
  Object.values(observabilityPaths).forEach((filePath) => {
    const dirPath = path.extname(filePath) ? path.dirname(filePath) : filePath;
    fs.mkdirSync(dirPath, { recursive: true });
  });
}

function readRuntimeSource() {
  return readJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "runtime-source.json"), {
    mode: "current_mirror",
    scenario_id: null,
    channel: null,
    release_id: null,
    selection_reason: "default_local_current_mirror"
  });
}

function readChannelManifest(channel) {
  return readJson(path.join(repoRoot, "runtime", "channels", channel, "manifest.json"), {
    channel,
    current_release_id: null,
    source_scenario_id: null,
    published_at: null,
    status: "idle"
  });
}

function readChannelHistory(channel) {
  return readJson(path.join(repoRoot, "runtime", "channels", channel, "history.json"), {
    channel,
    items: []
  });
}

function buildRuntimeContext(overrides = {}) {
  const runtimeSource = readRuntimeSource();
  const selected = readSelected();
  const currentMeta = readCurrentMeta();
  const baselineScenarioId = resolveBaselineScenarioId();
  const releaseId = overrides.release_id || runtimeSource.release_id || null;
  const channel = overrides.channel || runtimeSource.channel || null;
  const scenarioId =
    overrides.scenario_id ||
    runtimeSource.scenario_id ||
    currentMeta.dev_preview_source_scenario_id ||
    currentMeta.selected_scenario_id ||
    null;

  return {
    runtime_source_mode: overrides.runtime_source_mode || runtimeSource.mode || "current_mirror",
    runtime_source_id:
      overrides.runtime_source_id ||
      scenarioId ||
      channel ||
      releaseId ||
      currentMeta.selected_scenario_id ||
      null,
    scenario_id: scenarioId,
    release_id: releaseId,
    channel,
    baseline_scenario_id: overrides.baseline_scenario_id || baselineScenarioId || null,
    selected_scenario_id: overrides.selected_scenario_id || selected.selected_scenario_id || null,
    current_mirror_scenario_id: overrides.current_mirror_scenario_id || currentMeta.selected_scenario_id || null
  };
}

function eventDirectoryFor(occurredAt) {
  return path.join(observabilityPaths.eventsRoot, String(occurredAt || nowIso()).slice(0, 10));
}

function eventFileName(event) {
  const compactTime = String(event.occurred_at || nowIso()).replace(/[-:.]/g, "").replace("Z", "Z");
  return `${compactTime}_${event.event_type}_${event.event_id.slice(0, 8)}.json`;
}

function flattenEventFiles(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    const nextPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...flattenEventFiles(nextPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextPath);
    }
  }
  return files.sort();
}

function pruneEventFiles() {
  const files = flattenEventFiles(observabilityPaths.eventsRoot);
  if (files.length <= MAX_EVENT_FILES) {
    return;
  }
  for (const filePath of files.slice(0, files.length - MAX_EVENT_FILES)) {
    fs.rmSync(filePath, { force: true });
  }
}

function recentWindowStart() {
  return Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function listObservabilityEvents() {
  ensureDirs();
  return flattenEventFiles(observabilityPaths.eventsRoot)
    .map((filePath) => readJson(filePath, null))
    .filter(Boolean)
    .map((entry) => entry.event || null)
    .filter(Boolean)
    .filter((event) => {
      const occurredAt = new Date(event.occurred_at || 0).getTime();
      return !Number.isNaN(occurredAt) && occurredAt >= recentWindowStart();
    })
    .sort((left, right) => String(right.occurred_at || "").localeCompare(String(left.occurred_at || "")));
}

function collectCounts(events, fieldName) {
  return events.reduce((accumulator, event) => {
    const key = event[fieldName] || "unknown";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function topEntries(map, limit = 8) {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, limit);
}

function correlateReleaseHealth(events) {
  const publishEvents = events.filter((event) => ["channel_publish_succeeded", "channel_rollback_succeeded"].includes(event.event_type));
  return publishEvents.slice(0, 5).map((event) => {
    const occurredAt = new Date(event.occurred_at).getTime();
    const relatedFailures = events.filter((candidate) => {
      if (candidate.occurred_at === event.occurred_at) {
        return false;
      }
      const candidateTime = new Date(candidate.occurred_at).getTime();
      return candidateTime >= occurredAt &&
        candidateTime <= occurredAt + 30 * 60 * 1000 &&
        ["content_load_failed", "scenario_resolution_failed", "release_manifest_invalid", "channel_manifest_invalid"].includes(candidate.event_type);
    });
    return {
      event_id: event.event_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at,
      channel: event.channel || null,
      release_id: event.release_id || null,
      related_failures: relatedFailures.length,
      related_failure_types: Array.from(new Set(relatedFailures.map((candidate) => candidate.event_type))).sort()
    };
  });
}

function buildRuntimeEventsReport(events) {
  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    total_recent_events: events.length,
    counts_by_type: collectCounts(events, "event_type"),
    counts_by_severity: collectCounts(events, "severity"),
    recent_events: events.slice(0, MAX_RECENT_EVENTS)
  };
}

function buildIncidentSummary(events) {
  const incidents = events.filter((event) =>
    event.severity === "error" ||
    event.severity === "critical" ||
    ["warning_budget_exceeded", "publish_failed", "rollback_failed"].includes(event.event_type)
  );
  const publicationFailures = {};
  const issueFailures = {};
  const articleFailures = {};

  incidents.forEach((event) => {
    if (event.publication_id) publicationFailures[event.publication_id] = (publicationFailures[event.publication_id] || 0) + 1;
    if (event.issue_id) issueFailures[event.issue_id] = (issueFailures[event.issue_id] || 0) + 1;
    if (event.article_id) articleFailures[event.article_id] = (articleFailures[event.article_id] || 0) + 1;
  });

  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    total_incidents: incidents.length,
    counts_by_severity: collectCounts(incidents, "severity"),
    counts_by_type: collectCounts(incidents, "event_type"),
    top_publications: topEntries(publicationFailures),
    top_issues: topEntries(issueFailures),
    top_articles: topEntries(articleFailures),
    publish_correlation: correlateReleaseHealth(events),
    recent_incidents: incidents.slice(0, 40)
  };
}

function buildSourceHealthReport(events) {
  const runtimeSource = readRuntimeSource();
  const currentMeta = readCurrentMeta();
  const selected = readSelected();
  const recentSourceEvents = events.filter((event) =>
    ["runtime_source_loaded", "runtime_source_switched", "runtime_source_invalid", "channel_head_resolved", "remote_channel_resolved", "remote_channel_fetch_failed", "remote_release_loaded", "remote_fallback_applied", "scenario_bundle_loaded", "scenario_bundle_missing", "scenario_resolution_failed"].includes(event.event_type)
  );
  const recentFailures = recentSourceEvents.filter((event) => event.severity === "error" || event.severity === "critical");

  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    current_runtime_source: runtimeSource,
    current_mirror_scenario_id: currentMeta.selected_scenario_id || null,
    selected_scenario_id: selected.selected_scenario_id || null,
    recent_source_event_count: recentSourceEvents.length,
    recent_source_failures: recentFailures.length,
    latest_source_event: recentSourceEvents[0] || null,
    latest_source_failure: recentFailures[0] || null,
    health_status: recentFailures.length > 0 ? "degraded" : "healthy",
    recent_events: recentSourceEvents.slice(0, 20)
  };
}

function buildChannelHealthReport(events) {
  const channels = ["dev", "staging", "production"].map((channel) => {
    const manifest = readChannelManifest(channel);
    const history = readChannelHistory(channel);
    const recent = events.filter((event) => event.channel === channel);
    const failures = recent.filter((event) => event.severity === "error" || event.severity === "critical");
    const publishRejections = recent.filter((event) => event.event_type === "channel_publish_rejected");
    return {
      channel,
      manifest,
      history_count: (history.items || []).length,
      recent_event_count: recent.length,
      recent_failure_count: failures.length,
      recent_publish_rejections: publishRejections.length,
      latest_event: recent[0] || null,
      health_status: failures.length > 0 ? "degraded" : manifest.current_release_id ? "healthy" : "idle"
    };
  });

  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    channels
  };
}

function buildContentHealthReport(events) {
  const contentEvents = events.filter((event) =>
    [
      "feed_loaded",
      "search_loaded",
      "detail_loaded",
      "publication_list_loaded",
      "content_load_failed",
      "article_payload_incomplete",
      "unmapped_taxonomy_encountered",
      "taxonomy_gap_detected"
    ].includes(event.event_type)
  );
  const publicationFailures = {};
  const issueFailures = {};
  const articleFailures = {};
  const taxonomyGaps = {};

  contentEvents.forEach((event) => {
    if (["content_load_failed", "article_payload_incomplete"].includes(event.event_type)) {
      if (event.publication_id) publicationFailures[event.publication_id] = (publicationFailures[event.publication_id] || 0) + 1;
      if (event.issue_id) issueFailures[event.issue_id] = (issueFailures[event.issue_id] || 0) + 1;
      if (event.article_id) articleFailures[event.article_id] = (articleFailures[event.article_id] || 0) + 1;
    }
    if (event.warning_taxonomy) {
      const key = Array.isArray(event.warning_taxonomy) ? event.warning_taxonomy.join("|") : String(event.warning_taxonomy);
      taxonomyGaps[key] = (taxonomyGaps[key] || 0) + 1;
    }
  });

  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    counts_by_type: collectCounts(contentEvents, "event_type"),
    top_failed_publications: topEntries(publicationFailures),
    top_failed_issues: topEntries(issueFailures),
    top_failed_articles: topEntries(articleFailures),
    taxonomy_gap_growth: topEntries(taxonomyGaps),
    recent_events: contentEvents.slice(0, 30)
  };
}

function buildErrorTaxonomyReport(events) {
  const counts = {};
  events.forEach((event) => {
    if (!event.error_code) return;
    counts[event.error_code] = (counts[event.error_code] || 0) + 1;
  });

  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    taxonomy: errorTaxonomy.map((entry) => ({
      ...entry,
      recent_count: counts[entry.error_code] || 0
    })),
    unknown_error_codes: Object.keys(counts).filter((code) => !errorTaxonomy.some((entry) => entry.error_code === code)).sort()
  };
}

function buildTriageDashboard(events, incidentSummary, sourceHealth, channelHealth, contentHealth) {
  const latestPublishHealth = incidentSummary.publish_correlation[0] || null;
  return {
    generated_at: nowIso(),
    schema_version: OBS_SCHEMA_VERSION,
    runtime_source: sourceHealth.current_runtime_source,
    source_health_status: sourceHealth.health_status,
    selected_scenario_id: sourceHealth.selected_scenario_id,
    current_mirror_scenario_id: sourceHealth.current_mirror_scenario_id,
    recent_runtime_failures: sourceHealth.recent_source_failures,
    recent_incidents: incidentSummary.total_incidents,
    recent_content_failures: (contentHealth.counts_by_type.content_load_failed || 0) + (contentHealth.counts_by_type.article_payload_incomplete || 0),
    taxonomy_gap_events: (contentHealth.counts_by_type.unmapped_taxonomy_encountered || 0) + (contentHealth.counts_by_type.taxonomy_gap_detected || 0),
    channel_health: channelHealth.channels.map((channel) => ({
      channel: channel.channel,
      status: channel.health_status,
      current_release_id: channel.manifest.current_release_id || null
    })),
    latest_publish_health: latestPublishHealth,
    top_content_failure: contentHealth.top_failed_articles[0] || contentHealth.top_failed_publications[0] || null,
    latest_incident: incidentSummary.recent_incidents[0] || null,
    latest_event: events[0] || null
  };
}

function writeJson(filePath, payload) {
  ensureDirs();
  atomicWriteJson(filePath, payload);
}

export function refreshObservabilityReports() {
  ensureDirs();
  const events = listObservabilityEvents();
  const runtimeEventsReport = buildRuntimeEventsReport(events);
  const incidentSummary = buildIncidentSummary(events);
  const sourceHealth = buildSourceHealthReport(events);
  const channelHealth = buildChannelHealthReport(events);
  const contentHealth = buildContentHealthReport(events);
  const errorTaxonomyReport = buildErrorTaxonomyReport(events);
  const triageDashboard = buildTriageDashboard(events, incidentSummary, sourceHealth, channelHealth, contentHealth);

  writeJson(observabilityPaths.rollingEvents, runtimeEventsReport);
  writeJson(observabilityPaths.rollingIncidents, incidentSummary);
  writeJson(observabilityPaths.runtimeEventsReport, runtimeEventsReport);
  writeJson(observabilityPaths.incidentSummaryReport, incidentSummary);
  writeJson(observabilityPaths.sourceHealthReport, sourceHealth);
  writeJson(observabilityPaths.channelHealthReport, channelHealth);
  writeJson(observabilityPaths.contentHealthReport, contentHealth);
  writeJson(observabilityPaths.errorTaxonomyReport, errorTaxonomyReport);
  writeJson(observabilityPaths.triageDashboardReport, triageDashboard);

  return {
    runtimeEventsReport,
    incidentSummary,
    sourceHealth,
    channelHealth,
    contentHealth,
    errorTaxonomyReport,
    triageDashboard
  };
}

export function recordObservabilityEvent(input = {}) {
  ensureDirs();
  const defaults = eventDefaults[input.event_type] || {};
  const event = {
    schema_version: OBS_SCHEMA_VERSION,
    event_id: input.event_id || `obs1_${crypto.randomUUID()}`,
    event_type: input.event_type,
    event_category: input.event_category || defaults.category || "incident",
    occurred_at: input.occurred_at || nowIso(),
    severity: input.severity || defaults.severity || "info",
    source_surface: input.source_surface || defaults.sourceSurface || "ops",
    session_id: input.session_id || process.env.OBS_SESSION_ID || null,
    run_id: input.run_id || process.env.RUN_ID || process.env.CI_RUN_ID || "manual",
    user_mode: input.user_mode || "operator",
    app_env: input.app_env || process.env.NODE_ENV || "local",
    product_key: input.product_key || readCurrentMeta().product_key || "demo_cn_content",
    ...buildRuntimeContext(input),
    publication_id: input.publication_id || null,
    issue_id: input.issue_id || null,
    article_id: input.article_id || null,
    canonical_section_key: input.canonical_section_key || null,
    discovery_bucket: input.discovery_bucket || null,
    error_code: input.error_code || defaults.errorCode || null,
    error_message: input.error_message || null,
    warning_taxonomy: input.warning_taxonomy || null,
    accepted_warning: input.accepted_warning === true,
    details: input.details || {}
  };

  const eventDir = eventDirectoryFor(event.occurred_at);
  fs.mkdirSync(eventDir, { recursive: true });
  writeJson(path.join(eventDir, eventFileName(event)), {
    schema_version: OBS_SCHEMA_VERSION,
    ingested_at: nowIso(),
    sink_version: "stage-obs1-file-v1",
    event
  });
  pruneEventFiles();
  const reports = refreshObservabilityReports();
  return { event, reports };
}

export function captureSourceEvent(eventType, details = {}) {
  return recordObservabilityEvent({
    event_type: eventType,
    source_surface: "runtime",
    user_mode: "operator",
    details
  });
}

export function captureOpsEvent(eventType, details = {}) {
  return recordObservabilityEvent({
    event_type: eventType,
    source_surface: "ops",
    user_mode: "operator",
    details
  });
}
