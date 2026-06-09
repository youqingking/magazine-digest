import { buildSettingsCacheKey, getCachedValue, setCachedValue } from "./cache.service.js";
import { ingestRuntimeEvent } from "./event-ingest.service.js";
import { getRuntimeProofSummary } from "./runtime-proof.service.js";
import { getSessionState } from "../stores/session.store.js";

const OBS_CACHE_SUFFIX = "obs1";
const MAX_RECENT_EVENTS = 40;
const MAX_RECENT_ERRORS = 12;

function buildObservabilityCacheKey() {
  return buildSettingsCacheKey() + ":" + OBS_CACHE_SUFFIX;
}

function nowIso() {
  return new Date().toISOString();
}

function readState() {
  return getCachedValue(buildObservabilityCacheKey()) || {
    schema_version: "stage-obs1-mobile-v1",
    events: [],
    errors: [],
    by_type: {},
    last_health_status: "idle",
    updated_at: null
  };
}

function writeState(state) {
  setCachedValue(buildObservabilityCacheKey(), state);
}

function buildContext() {
  const session = getSessionState();
  const proof = getRuntimeProofSummary();
  return {
    product_key: session.productKey,
    app_env: "mobile_local_runtime",
    user_mode: "dev",
    runtime_source_mode: proof.runtimeSourceMode || "current_mirror",
    runtime_source_id: proof.runtimeSourceScenarioId || proof.runtimeSourceChannel || proof.runtimeSourceReleaseId || proof.currentMirrorScenarioId || null,
    scenario_id: proof.runtimeSourceScenarioId || proof.runtimeScenarioId || null,
    release_id: proof.runtimeSourceReleaseId || null,
    channel: proof.runtimeSourceChannel || null,
    baseline_scenario_id: null,
    current_mirror_scenario_id: proof.currentMirrorScenarioId || null
  };
}

function compactEvent(entry) {
  return {
    event_id: entry.event_id,
    event_type: entry.event_type,
    severity: entry.severity,
    source_surface: entry.source_surface,
    occurred_at: entry.occurred_at,
    publication_id: entry.publication_id || null,
    issue_id: entry.issue_id || null,
    article_id: entry.article_id || null,
    error_code: entry.error_code || null,
    error_message: entry.error_message || null,
    warning_taxonomy: entry.warning_taxonomy || null,
    runtime_source_mode: entry.runtime_source_mode || null,
    scenario_id: entry.scenario_id || null,
    channel: entry.channel || null,
    release_id: entry.release_id || null
  };
}

export async function recordObservabilityEvent(input = {}) {
  const state = readState();
  const entry = {
    event_id: input.event_id || `mobs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: input.event_type,
    severity: input.severity || "info",
    source_surface: input.source_surface || "app",
    occurred_at: input.occurred_at || nowIso(),
    error_code: input.error_code || null,
    error_message: input.error_message || null,
    publication_id: input.publication_id || null,
    issue_id: input.issue_id || null,
    article_id: input.article_id || null,
    canonical_section_key: input.canonical_section_key || null,
    discovery_bucket: input.discovery_bucket || null,
    warning_taxonomy: input.warning_taxonomy || null,
    details: input.details || {},
    ...buildContext()
  };

  state.events.unshift(compactEvent(entry));
  state.events = state.events.slice(0, MAX_RECENT_EVENTS);
  state.by_type[entry.event_type] = (state.by_type[entry.event_type] || 0) + 1;
  if (entry.severity === "error" || entry.severity === "critical" || entry.error_code) {
    state.errors.unshift(compactEvent(entry));
    state.errors = state.errors.slice(0, MAX_RECENT_ERRORS);
    state.last_health_status = "degraded";
  } else if (state.last_health_status === "idle") {
    state.last_health_status = "healthy";
  }
  state.updated_at = nowIso();
  writeState(state);

  try {
    await ingestRuntimeEvent(entry.event_type, {
      obs_schema_version: "stage-obs1-mobile-v1",
      source_surface: entry.source_surface,
      severity: entry.severity,
      runtime_source_mode: entry.runtime_source_mode,
      scenario_id: entry.scenario_id,
      release_id: entry.release_id,
      channel: entry.channel,
      publication_id: entry.publication_id,
      issue_id: entry.issue_id,
      article_id: entry.article_id,
      canonical_section_key: entry.canonical_section_key,
      discovery_bucket: entry.discovery_bucket,
      error_code: entry.error_code,
      error_message: entry.error_message,
      warning_taxonomy: entry.warning_taxonomy,
      details: entry.details
    });
  } catch {
    // Observability is best-effort and must not break the content path.
  }

  return entry;
}

export function getObservabilitySummary() {
  const state = readState();
  return {
    last_health_status: state.last_health_status,
    updated_at: state.updated_at,
    recent_error_count: state.errors.length,
    recent_error_summary: state.errors.slice(0, 3).map((entry) => ({
      event_type: entry.event_type,
      error_code: entry.error_code,
      error_message: entry.error_message,
      occurred_at: entry.occurred_at
    })),
    recent_events: state.events.slice(0, 5),
    by_type: state.by_type
  };
}
