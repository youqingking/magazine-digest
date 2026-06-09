import { buildRuntimeSourceDiagnostic, readRuntimeSource } from "./lib/release-channel-lib.mjs";

const state = readRuntimeSource();
const report = buildRuntimeSourceDiagnostic(state);
console.log(JSON.stringify({
  status: "ok",
  runtime_source: state,
  report
}, null, 2));
