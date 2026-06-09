import {
  channelNames,
  parseArgs,
  publishReleaseToChannel,
  readChannelManifest,
  summarizeChannels,
  withChannelLock,
  writeRel1Json,
  rel1Paths
} from "./lib/release-channel-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const fromChannel = args.from;
const toChannel = args.to;
const apply = Boolean(args.apply);

if (!channelNames.includes(fromChannel) || !channelNames.includes(toChannel)) {
  throw new Error("REL1_CHANNEL_REQUIRED");
}

const sourceManifest = readChannelManifest(fromChannel);
if (!sourceManifest.current_release_id) {
  console.log(JSON.stringify({ status: "blocked", reason: "source_channel_empty", from: fromChannel, to: toChannel }, null, 2));
  process.exit(2);
}

if (!apply) {
  const preview = {
    status: "ok",
    dry_run: true,
    from: fromChannel,
    to: toChannel,
    release_id: sourceManifest.current_release_id
  };
  writeRel1Json(rel1Paths.channelPromotionReport, { generated_at: new Date().toISOString(), action: "promote_channel_dry_run", ...preview });
  console.log(JSON.stringify(preview, null, 2));
  process.exit(0);
}

const result = await withChannelLock(`promote-channel-${fromChannel}-${toChannel}`, async () => {
  const applied = publishReleaseToChannel({
    channel: toChannel,
    releaseId: sourceManifest.current_release_id,
    sourceScenarioId: sourceManifest.source_scenario_id,
    promotedFrom: fromChannel,
    action: "promote_channel"
  });
  const channels = summarizeChannels();
  const payload = {
    generated_at: new Date().toISOString(),
    status: "ok",
    action: "promote_channel",
    from: fromChannel,
    to: toChannel,
    release_id: sourceManifest.current_release_id,
    manifest: applied.manifest,
    channels: channels.report.channels
  };
  writeRel1Json(rel1Paths.channelPromotionReport, payload);
  return payload;
});

console.log(JSON.stringify(result, null, 2));
