export const packageName = "attention-family-harness";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "validation entry names",
    "report shape names",
    "family consistency rules"
  ],
  doesNotInclude: [
    "source adapter smoke tests",
    "live infra checks",
    "migration execution"
  ],
  dependsOn: ["attention-core-contracts", "attention-family-contracts", "attention-family-runtime"],
  dependedOnBy: []
});

export const validationEntryNames = [
  "validate_shared_step_03",
  "validate_source_family_docs",
  "validate_source_family_package_surfaces"
];

export const reportShapeNames = [
  "family_validation_report",
  "family_package_surface_report",
  "family_compatibility_report"
];

export const familyConsistencyRuleNames = [
  "shared_core_must_remain_unchanged",
  "family_names_must_be_frozen",
  "examples_must_cover_all_families",
  "packages_must_match_docs"
];

export const publicApi = [
  "packageBoundary",
  "validationEntryNames",
  "reportShapeNames",
  "familyConsistencyRuleNames"
];
