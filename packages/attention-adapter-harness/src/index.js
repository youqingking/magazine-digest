export const packageName = "attention-adapter-harness";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "validation entry names",
    "adapter report shape names",
    "route coverage consistency rules"
  ],
  doesNotInclude: [
    "real smoke pipelines",
    "real source verification",
    "source fetching",
    "migration execution"
  ],
  dependsOn: ["attention-core-contracts", "attention-family-contracts", "attention-adapter-runtime"],
  dependedOnBy: []
});

export { adapterReportShapeName, adapterReportFieldNames, createAdapterReport } from "./adapter-report-shape.js";

export const validationEntryNames = [
  "validate_shared_step_04",
  "validate_adapter_routes",
  "validate_adapter_registry_and_diagnostics"
];

export const reportShapeNames = [
  "adapter_validation_report",
  "adapter_route_coverage_report",
  "adapter_mapping_consistency_report"
];

export const adapterConsistencyRuleNames = [
  "step02_and_step03_must_remain_unchanged",
  "direct_and_family_routes_must_both_be_covered",
  "registry_diagnostics_and_pilots_must_match",
  "source_specific_names_must_not_pollute_shared_core"
];

export const publicApi = [
  "packageBoundary",
  "validationEntryNames",
  "reportShapeNames",
  "adapterConsistencyRuleNames",
  "adapterReportShapeName",
  "adapterReportFieldNames",
  "createAdapterReport"
];
