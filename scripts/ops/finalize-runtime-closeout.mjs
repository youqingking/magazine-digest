import { finalizeRuntimeCloseout } from "./lib/runtime-closeout-lib.mjs";

const report = finalizeRuntimeCloseout();

console.log(JSON.stringify({
  status: report.status,
  report_path: "output/stage-rc1/final-closeout-report.json",
  evidence_present: report.evidence_present,
  blockers: report.blockers,
  warnings: report.warnings
}, null, 2));
