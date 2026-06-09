export const packageName = "attention-family-runtime";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "family registry names",
    "family projection names",
    "family seam names",
    "adapter bridge names"
  ],
  doesNotInclude: [
    "source adapter implementations",
    "shared core rewrites",
    "real remote connectivity"
  ],
  dependsOn: ["attention-core-contracts", "attention-family-contracts"],
  dependedOnBy: ["attention-family-harness"]
});

export const familyRegistryNames = [
  "family_contract_registry",
  "family_projection_registry",
  "family_adapter_registry"
];

export const familyProjectionNames = [
  "family_to_content_ref_projection",
  "family_to_content_list_projection",
  "family_to_content_detail_projection",
  "family_to_follow_target_projection"
];

export const familySeamNames = [
  "transcript_family_projection_seam",
  "structured_record_projection_seam",
  "qa_family_projection_seam",
  "social_family_projection_seam",
  "curated_asset_projection_seam"
];

export const adapterBridgeNames = [
  "adapter_to_family_contract_bridge",
  "family_to_shared_projection_bridge",
  "family_compatibility_guard"
];

export const publicApi = [
  "packageBoundary",
  "familyRegistryNames",
  "familyProjectionNames",
  "familySeamNames",
  "adapterBridgeNames"
];
