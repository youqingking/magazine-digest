import { refreshObservabilityReports } from "./lib/observability-lib.mjs";

const reports = refreshObservabilityReports();

console.log(JSON.stringify({
  status: "ok",
  generated_at: reports.triageDashboard.generated_at,
  runtime_source: reports.triageDashboard.runtime_source,
  recent_incidents: reports.triageDashboard.recent_incidents
}, null, 2));
