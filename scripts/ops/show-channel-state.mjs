import { summarizeChannels } from "./lib/release-channel-lib.mjs";

const result = summarizeChannels();
console.log(JSON.stringify({
  status: "ok",
  channels: result.channels.map((item) => ({
    channel: item.channel,
    manifest: item.manifest,
    history: item.history.items || []
  }))
}, null, 2));
