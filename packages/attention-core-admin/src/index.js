export const packageName = "attention-core-admin";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "generated admin rail names",
    "manual admin rail names",
    "contract-map registry names"
  ],
  doesNotInclude: [
    "domain workflow implementations",
    "source-specific moderation rules",
    "operator business logic"
  ],
  dependsOn: ["attention-core-contracts"],
  dependedOnBy: ["attention-core-harness"]
});

export const generatedRailNames = [
  "product_registry",
  "pricing_plan_registry",
  "quota_policy_registry",
  "campaign_registry",
  "experiment_registry",
  "notification_registry"
];

export const manualRailNames = [
  "runtime_mode_inspector",
  "pricing_preview_inspector",
  "notification_policy_inspector",
  "release_batch_inspector"
];

export const registryNames = [
  "generated_rail_registry",
  "manual_rail_registry",
  "contract_map_registry"
];

export const publicApi = [
  "packageBoundary",
  "generatedRailNames",
  "manualRailNames",
  "registryNames"
];
