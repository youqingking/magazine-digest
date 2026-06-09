import { buildRuntimeContext } from "./lib/runtime-closeout-lib.mjs";

const context = await buildRuntimeContext();

console.log(JSON.stringify({
  status: "ok",
  branch: context.git.branch,
  head_short_sha: context.git.head_short_sha,
  baseline_tag: context.git.baseline_tag,
  selected_scenario_id: context.selected_scenario?.selected_scenario_id || null,
  current_runtime_scenario_id: context.current_runtime?.metadata?.scenario_id || null,
  current_mirror_scenario_id: context.current_runtime?.metadata?.selected_scenario_id || null,
  build_audit_source: context.build_audit_source,
  latest_gate_status: context.ops?.latest_gate_report?.status || null,
  latest_gate_warnings: context.ops?.latest_gate_report?.warnings || []
}, null, 2));
