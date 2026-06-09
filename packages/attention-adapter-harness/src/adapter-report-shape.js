export const adapterReportShapeName = "adapter_validation_report";

export const adapterReportFieldNames = [
  "timestamp",
  "status",
  "step",
  "checked_docs",
  "checked_packages",
  "checked_pilots",
  "route_coverage",
  "checks",
  "warnings",
  "errors"
];

export function createAdapterReport(overrides = {}) {
  return {
    timestamp: new Date().toISOString(),
    status: "ok",
    step: "shared-step-04",
    checked_docs: 0,
    checked_packages: 0,
    checked_pilots: 0,
    route_coverage: {
      direct: 0,
      family: 0
    },
    checks: [],
    warnings: [],
    errors: [],
    ...overrides
  };
}
