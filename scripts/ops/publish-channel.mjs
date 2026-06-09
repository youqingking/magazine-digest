import { findScenarioRecord } from "./lib/ops-lib.mjs";
import { recordObservabilityEvent } from "./lib/observability-lib.mjs";
import {
  buildReleaseArtifact,
  buildRuntimeSourceDiagnostic,
  channelNames,
  parseArgs,
  publishReleaseToChannel,
  readChannelManifest,
  readReleaseManifest,
  summarizeChannels,
  withChannelLock,
  writeRel1Json,
  rel1Paths
} from "./lib/release-channel-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const channel = args.channel || "dev";
const scenarioId = args.scenario || null;
const apply = Boolean(args.apply);

if (!channelNames.includes(channel)) {
  recordObservabilityEvent({
    event_type: "channel_manifest_invalid",
    channel,
    details: {
      reason: "unknown_channel"
    }
  });
  throw new Error(`REL1_UNKNOWN_CHANNEL:${channel}`);
}

let releaseId = args.release || null;
if (!releaseId) {
  if (!scenarioId || !findScenarioRecord(scenarioId)) {
    recordObservabilityEvent({
      event_type: "channel_publish_rejected",
      channel,
      scenario_id: scenarioId,
      details: {
        reason: "scenario_missing"
      }
    });
    console.log(JSON.stringify({ status: "blocked", reason: "scenario_missing", scenario_id: scenarioId, channel }, null, 2));
    process.exit(2);
  }
  const releaseReport = buildReleaseArtifact({
    scenarioId,
    baselineScenarioId: args.baseline || null,
    refresh: !args["use-existing-reports"]
  });
  if (releaseReport.status !== "ok") {
    recordObservabilityEvent({
      event_type: "channel_publish_rejected",
      channel,
      scenario_id: scenarioId,
      details: {
        reason: "release_artifact_build_failed",
        release_report: releaseReport
      }
    });
    console.log(JSON.stringify({ status: "blocked", channel, scenario_id: scenarioId, release: releaseReport }, null, 2));
    process.exit(2);
  }
  releaseId = releaseReport.release_id;
}

const manifest = readReleaseManifest(releaseId);
if (!manifest) {
  recordObservabilityEvent({
    event_type: "channel_manifest_invalid",
    channel,
    release_id: releaseId,
    scenario_id: scenarioId,
    details: {
      reason: "release_missing"
    }
  });
  console.log(JSON.stringify({ status: "blocked", reason: "release_missing", release_id: releaseId, channel }, null, 2));
  process.exit(2);
}

if (channel === "production" && manifest.promotion_decision !== "promotable") {
  recordObservabilityEvent({
    event_type: "channel_publish_rejected",
    channel,
    release_id: releaseId,
    scenario_id: manifest.source_scenario_id || scenarioId,
    details: {
      reason: "production_requires_promotable",
      promotion_decision: manifest.promotion_decision
    }
  });
  console.log(JSON.stringify({
    status: "blocked",
    reason: "production_requires_promotable",
    channel,
    release_id: releaseId,
    source_scenario_id: manifest.source_scenario_id
  }, null, 2));
  process.exit(2);
}

recordObservabilityEvent({
  event_type: "channel_publish_attempted",
  channel,
  release_id: releaseId,
  scenario_id: manifest.source_scenario_id || scenarioId,
  details: {
    apply,
    dry_run: !apply
  }
});

if (!apply) {
  const preview = {
    status: "ok",
    dry_run: true,
    channel,
    release_id: releaseId,
    current_channel_head: readChannelManifest(channel).current_release_id || null,
    source_scenario_id: manifest.source_scenario_id || null
  };
  writeRel1Json(rel1Paths.channelPromotionReport, {
    generated_at: new Date().toISOString(),
    action: "publish_channel_dry_run",
    ...preview
  });
  console.log(JSON.stringify(preview, null, 2));
  process.exit(0);
}

const result = await withChannelLock(`publish-channel-${channel}`, async () => {
  const applied = publishReleaseToChannel({
    channel,
    releaseId,
    sourceScenarioId: manifest.source_scenario_id || scenarioId,
    promotedFrom: args["promoted-from"] || null,
    action: "publish_channel"
  });
  const channels = summarizeChannels();
  const runtime = buildRuntimeSourceDiagnostic();
  const payload = {
    generated_at: new Date().toISOString(),
    status: "ok",
    action: "publish_channel",
    channel,
    release_id: releaseId,
    source_scenario_id: manifest.source_scenario_id || null,
    manifest: applied.manifest,
    history_count: (applied.history.items || []).length,
    channels: channels.report.channels,
    runtime_source: runtime.runtime_source
  };
  writeRel1Json(rel1Paths.channelPromotionReport, payload);
  return payload;
});

console.log(JSON.stringify(result, null, 2));
