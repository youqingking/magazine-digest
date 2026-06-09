import { readJson, pipelinePaths } from "../import/lib/content-pipeline.mjs";

const registry = readJson(pipelinePaths.runtimeScenarioIndex, { items: [], selected_scenario_id: null });
console.log(
  JSON.stringify(
    {
      selected_scenario_id: registry.selected_scenario_id || null,
      scenarios: (registry.items || []).map((item) => ({
        scenario_id: item.scenario_id,
        status: item.status,
        source_kind: item.source_kind,
        imported_article_count: item.imported_article_count,
        is_selected_for_current: item.is_selected_for_current === true
      }))
    },
    null,
    2
  )
);
