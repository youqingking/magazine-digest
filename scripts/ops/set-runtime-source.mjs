import { findScenarioRecord } from "./lib/ops-lib.mjs";
import { recordObservabilityEvent } from "./lib/observability-lib.mjs";
import {
  buildRuntimeSourceDiagnostic,
  channelNames,
  parseArgs,
  readChannelManifest,
  syncRemoteChannelHeadToH5DevCurrent,
  restoreH5DevCurrentMirror,
  syncChannelHeadToH5DevCurrent,
  syncRuntimeSourceRegistry,
  syncScenarioPreviewToH5DevCurrent,
  writeRuntimeSource
} from "./lib/release-channel-lib.mjs";
import { buildRuntimeDistBaseUrl, defaultRuntimeDistHost, defaultRuntimeDistPort, exportRuntimeDist, readDistChannelManifest } from "./lib/runtime-dist-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const mode = args.mode || "current_mirror";
const forH5Dev = Boolean(args["for-h5-dev"]);
const remoteBaseUrl = args["remote-base-url"] || buildRuntimeDistBaseUrl(defaultRuntimeDistHost, defaultRuntimeDistPort);

if (!["current_mirror", "scenario_preview", "channel_head", "remote_channel_head"].includes(mode)) {
  recordObservabilityEvent({
    event_type: "runtime_source_invalid",
    runtime_source_mode: mode,
    details: {
      reason: "invalid_mode"
    }
  });
  throw new Error(`REL1_RUNTIME_SOURCE_MODE_INVALID:${mode}`);
}

if (mode === "scenario_preview" && (!args.scenario || !findScenarioRecord(args.scenario))) {
  recordObservabilityEvent({
    event_type: "scenario_resolution_failed",
    runtime_source_mode: mode,
    scenario_id: args.scenario || null,
    details: {
      reason: "scenario_missing"
    }
  });
  console.log(JSON.stringify({ status: "blocked", reason: "scenario_missing", mode, scenario_id: args.scenario || null }, null, 2));
  process.exit(2);
}

if (mode === "channel_head" || mode === "remote_channel_head") {
  if (!args.channel || !channelNames.includes(args.channel)) {
    recordObservabilityEvent({
      event_type: "runtime_source_invalid",
      runtime_source_mode: mode,
      channel: args.channel || null,
      details: {
        reason: "channel_missing"
      }
    });
    console.log(JSON.stringify({ status: "blocked", reason: "channel_missing", mode, channel: args.channel || null }, null, 2));
    process.exit(2);
  }
  const channel = mode === "remote_channel_head"
    ? (exportRuntimeDist(), { current_release_id: readDistChannelManifest(args.channel).release_id || null })
    : readChannelManifest(args.channel);
  if (!channel.current_release_id) {
    recordObservabilityEvent({
      event_type: mode === "remote_channel_head" ? "remote_channel_fetch_failed" : "channel_manifest_invalid",
      runtime_source_mode: mode,
      channel: args.channel,
      error_code: mode === "remote_channel_head" ? "OBS1_REMOTE_CHANNEL_FETCH_FAILED" : undefined,
      details: {
        reason: mode === "remote_channel_head" ? "remote_channel_head_empty" : "channel_head_empty",
        remote_base_url: mode === "remote_channel_head" ? remoteBaseUrl : null
      }
    });
    console.log(JSON.stringify({ status: "blocked", reason: mode === "remote_channel_head" ? "remote_channel_head_empty" : "channel_head_empty", mode, channel: args.channel }, null, 2));
    process.exit(2);
  }
}

syncRuntimeSourceRegistry();

const next = writeRuntimeSource({
  mode,
  scenario_id: mode === "scenario_preview" ? args.scenario : null,
  channel: mode === "channel_head" || mode === "remote_channel_head" ? args.channel : null,
  release_id:
    mode === "channel_head"
      ? readChannelManifest(args.channel).current_release_id || null
      : mode === "remote_channel_head"
        ? readDistChannelManifest(args.channel).release_id || null
        : null,
  remote_base_url: mode === "remote_channel_head" ? remoteBaseUrl : null,
  selection_reason:
    mode === "current_mirror"
      ? "manual_current_mirror"
      : mode === "scenario_preview"
        ? "manual_scenario_preview"
        : mode === "channel_head"
          ? "manual_channel_head"
          : "manual_remote_channel_head"
});

let h5DevSync = null;
if (forH5Dev) {
  if (mode === "scenario_preview") {
    h5DevSync = syncScenarioPreviewToH5DevCurrent(args.scenario);
  } else if (mode === "channel_head") {
    h5DevSync = syncChannelHeadToH5DevCurrent(args.channel);
  } else if (mode === "remote_channel_head") {
    h5DevSync = syncRemoteChannelHeadToH5DevCurrent(args.channel);
  } else {
    h5DevSync = restoreH5DevCurrentMirror();
  }
}

const report = buildRuntimeSourceDiagnostic(next);
recordObservabilityEvent({
  event_type: "runtime_source_switched",
  runtime_source_mode: next.mode,
  scenario_id: next.scenario_id || null,
  channel: next.channel || null,
  release_id: next.release_id || null,
  details: {
    selection_reason: next.selection_reason || null,
    for_h5_dev: forH5Dev,
    h5_dev_sync: h5DevSync
  }
});

console.log(JSON.stringify({
  status: "ok",
  runtime_source: next,
  h5_dev_sync: h5DevSync,
  report
}, null, 2));
