export const packageName = "attention-core-runtime";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "adapter interface names",
    "runtime mode contracts",
    "shared service seams",
    "runtime registry shapes"
  ],
  doesNotInclude: [
    "domain adapter implementations",
    "real infra configuration",
    "page composition"
  ],
  dependsOn: ["attention-core-contracts"],
  dependedOnBy: ["attention-core-harness"]
});

export const adapterInterfaceNames = [
  "content_read_adapter",
  "content_sync_adapter",
  "discovery_adapter",
  "notification_adapter",
  "commercial_adapter"
];

export const runtimeModeNames = ["local", "remote", "hybrid"];

export const serviceSeamNames = [
  "runtime_mode_selector",
  "runtime_gateway",
  "content_resolution_seam",
  "content_sync_seam",
  "entitlement_snapshot_seam",
  "pricing_preview_seam",
  "quota_snapshot_seam",
  "notification_snapshot_seam",
  "publish_batch_summary_seam"
];

export const registryShapeNames = [
  "adapter_registry_shape",
  "runtime_source_registry_shape",
  "cache_policy_registry_shape",
  "service_seam_registry_shape"
];

export const publicApi = [
  "packageBoundary",
  "adapterInterfaceNames",
  "runtimeModeNames",
  "serviceSeamNames",
  "registryShapeNames"
];
