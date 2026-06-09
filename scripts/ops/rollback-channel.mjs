import {
  parseArgs,
  rollbackChannelHead,
  summarizeChannels,
  withChannelLock,
  writeRel1Json,
  rel1Paths
} from "./lib/release-channel-lib.mjs";
import { recordObservabilityEvent } from "./lib/observability-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const channel = args.channel || "dev";

let result;
try {
  result = await withChannelLock(`rollback-channel-${channel}`, async () => {
    const rollback = rollbackChannelHead(channel);
    const channels = summarizeChannels();
    const payload = {
      generated_at: new Date().toISOString(),
      status: "ok",
      action: "rollback_channel",
      channel,
      rolled_back_to: rollback.rolled_back_to,
      manifest: rollback.manifest,
      channels: channels.report.channels
    };
    writeRel1Json(rel1Paths.channelPromotionReport, payload);
    return payload;
  });
} catch (error) {
  recordObservabilityEvent({
    event_type: "rollback_failed",
    channel,
    details: {
      reason: error.message || String(error)
    }
  });
  throw error;
}

console.log(JSON.stringify(result, null, 2));
