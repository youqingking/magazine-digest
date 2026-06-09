import { findScenarioRecord } from "./lib/ops-lib.mjs";
import {
  evaluateScenarioBudget,
  loadAcceptedWarnings,
  loadWarningBudgets,
  qualityPaths,
  writeQualityReport
} from "./lib/quality-budget-lib.mjs";

const scenarios = [
  "data1a_readers_digest_12112025",
  "data1c_three_release_mixed_preview",
  "data2_multi_publication_release_candidate"
];

const report = {
  generated_at: new Date().toISOString(),
  accepted_registry: loadAcceptedWarnings(),
  warning_budgets: loadWarningBudgets(),
  scenario_consumption: scenarios.map((scenarioId) => {
    const scenarioRecord = findScenarioRecord(scenarioId);
    return scenarioRecord
      ? evaluateScenarioBudget({ scenarioId, scenarioRecord })
      : {
          scenario_id: scenarioId,
          exists: false
        };
  })
};

writeQualityReport(qualityPaths.warningBudgetReport, report);
console.log(JSON.stringify({ status: "ok", warning_budget: report }, null, 2));
