import { parseArgs } from "./lib/ops-lib.mjs";
import { defaultRuntimeDistHost, defaultRuntimeDistPort, exportRuntimeDist, runServeProbe } from "./lib/runtime-dist-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const host = args.host || defaultRuntimeDistHost;
const port = Number(args.port || defaultRuntimeDistPort);
const holdMs = Number(args["hold-ms"] || 1500);

exportRuntimeDist();
const result = await runServeProbe({ host, port, holdMs });
console.log(JSON.stringify(result, null, 2));
