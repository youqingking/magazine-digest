export const packageName = "attention-core-harness";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "validation entry names",
    "report shape names",
    "checkpoint conventions",
    "verification boundary metadata"
  ],
  doesNotInclude: [
    "domain smoke logic",
    "real build pipelines",
    "live runtime credentials"
  ],
  dependsOn: [
    "attention-core-contracts",
    "attention-core-runtime",
    "attention-core-mobile-ui",
    "attention-core-admin"
  ],
  dependedOnBy: []
});

export const validationEntryNames = [
  "validate_shared_step_02",
  "validate_shared_docs",
  "validate_shared_package_surfaces"
];

export const reportShapeNames = [
  "shared_validation_report",
  "shared_checkpoint_report",
  "shared_package_surface_report"
];

export const checkpointConventionNames = [
  "pre_stage_checkpoint",
  "post_stage_checkpoint",
  "validation_before_promotion"
];

export const publicApi = [
  "packageBoundary",
  "validationEntryNames",
  "reportShapeNames",
  "checkpointConventionNames"
];
