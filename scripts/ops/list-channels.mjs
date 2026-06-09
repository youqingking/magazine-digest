import { summarizeChannels } from "./lib/release-channel-lib.mjs";

console.log(JSON.stringify({
  status: "ok",
  ...summarizeChannels().report
}, null, 2));
