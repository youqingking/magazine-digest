import { opsPaths, readJsonOr } from "./lib/ops-lib.mjs";

const report = readJsonOr(opsPaths.ops2DiffReport, null);
if (!report) {
  throw new Error("OPS2_DIFF_REPORT_MISSING");
}

console.log(JSON.stringify({ status: "ok", diff: report }, null, 2));
