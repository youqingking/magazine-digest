import { getBuildMeta } from "./build-meta.service.js";
import { getCurrentRuntimeMeta } from "./runtime-fixtures.service.js";
import { getRuntimeSourceSummary } from "./runtime-source.service.js";

export function getRuntimeProofSummary() {
  const metadata = getCurrentRuntimeMeta();
  const buildMeta = getBuildMeta();
  const runtimeSource = getRuntimeSourceSummary();

  return {
    runtimeScenarioId: metadata.scenario_id || null,
    currentMirrorScenarioId: metadata.selected_scenario_id || null,
    runtimeFixtureRole: metadata.runtime_fixture_role || null,
    sourceKind: metadata.source_kind || null,
    pipelineStage: metadata.pipeline_stage || null,
    selectionSource: metadata.selection_source || null,
    publishedToCurrentAt: metadata.published_to_current_at || null,
    baselineTag: buildMeta.baselineTag || null,
    runtimeSourceMode: runtimeSource.mode || null,
    runtimeSourceScenarioId: runtimeSource.scenarioId || null,
    runtimeSourceChannel: runtimeSource.channel || null,
    runtimeSourceReleaseId: runtimeSource.releaseId || null,
    runtimeSourceRemoteBaseUrl: runtimeSource.remoteBaseUrl || null,
    runtimeSourceFallbackTarget: runtimeSource.fallbackTarget || null
  };
}
