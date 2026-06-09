import { publishSelectedScenarioToCurrent, publishScenarioToCurrent } from "../import/lib/content-pipeline.mjs";

const scenarioId = process.argv[2] || null;
const result = scenarioId
  ? publishScenarioToCurrent({ scenarioId, selectionSource: "runtime_publish_script" })
  : publishSelectedScenarioToCurrent({ selectionSource: "runtime_publish_selected_script" });

console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
