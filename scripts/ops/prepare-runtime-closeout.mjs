import { buildRuntimeContext, writePreparedArtifacts } from "./lib/runtime-closeout-lib.mjs";

const context = await buildRuntimeContext();
const template = writePreparedArtifacts(context);

console.log(JSON.stringify({
  status: "ok",
  context_path: "output/stage-rc1/runtime-context.json",
  template_path: "output/stage-rc1/runtime-closeout-template.json",
  checklist_path: "output/stage-rc1/manual-checklist.md",
  manual_items: template.manual_items.length
}, null, 2));
