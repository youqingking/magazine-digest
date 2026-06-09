import { evaluatePromotionDecision, parseArgs } from "./lib/ops-lib.mjs";
import { recordObservabilityEvent } from "./lib/observability-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const scenarioId = args.scenario;
if (!scenarioId) {
  throw new Error("OPS2_SCENARIO_REQUIRED");
}

const report = evaluatePromotionDecision({
  scenarioId,
  baselineScenarioId: args.baseline || null,
  refresh: !args["use-existing-reports"]
});

recordObservabilityEvent({
  event_type: "promotion_evaluated",
  scenario_id: scenarioId,
  baseline_scenario_id: report.baseline_scenario_id || null,
  details: {
    decision: report.decision,
    blockers: report.blockers || [],
    warnings: report.warnings || [],
    info: report.info || []
  }
});

if ((report.budget_summary?.accepted_warnings || []).length > 0) {
  recordObservabilityEvent({
    event_type: "accepted_warning_applied",
    scenario_id: scenarioId,
    warning_taxonomy: (report.budget_summary.accepted_warnings || []).map((item) => item.warning_type),
    accepted_warning: true,
    details: {
      accepted_warnings: report.budget_summary.accepted_warnings || []
    }
  });
}

if ((report.budget_summary?.over_budget_warnings || []).length > 0 || (report.budget_summary?.unregistered_warnings || []).length > 0) {
  recordObservabilityEvent({
    event_type: "warning_budget_exceeded",
    scenario_id: scenarioId,
    warning_taxonomy: [
      ...(report.budget_summary?.over_budget_warnings || []).map((item) => item.warning_type),
      ...(report.budget_summary?.unregistered_warnings || []).map((item) => item.warning_type)
    ],
    details: {
      over_budget_warnings: report.budget_summary?.over_budget_warnings || [],
      unregistered_warnings: report.budget_summary?.unregistered_warnings || []
    }
  });
}

if ((report.budget_summary?.accepted_overrides || []).length > 0) {
  recordObservabilityEvent({
    event_type: "override_applied",
    scenario_id: scenarioId,
    details: {
      accepted_overrides: report.budget_summary.accepted_overrides || []
    }
  });
}

if (Number(report.taxonomy_summary?.unmapped_count || 0) > 0) {
  recordObservabilityEvent({
    event_type: "taxonomy_gap_detected",
    scenario_id: scenarioId,
    warning_taxonomy: ["taxonomy_unmapped"],
    details: {
      unmapped_count: report.taxonomy_summary.unmapped_count,
      mapped_ratio: report.taxonomy_summary.mapped_ratio || null
    }
  });
}

console.log(JSON.stringify({ status: "ok", evaluation: report }, null, 2));
