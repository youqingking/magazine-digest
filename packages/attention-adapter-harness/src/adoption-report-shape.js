export const adoptionReportShapeName = "shared_runtime_adoption_report";

export const adoptionReportFieldNames = [
  "generated_at",
  "step",
  "domain_reports",
  "family_only_reports",
  "coverage",
  "warnings"
];

export function createAdoptionReport({
  generated_at = new Date().toISOString(),
  step = "shared-step-06",
  domain_reports = [],
  family_only_reports = [],
  coverage = {
    direct_domains: 0,
    family_backed_domains: 0,
    family_only_pilots: 0
  },
  warnings = []
}) {
  return Object.freeze({
    generated_at,
    step,
    domain_reports,
    family_only_reports,
    coverage,
    warnings
  });
}
