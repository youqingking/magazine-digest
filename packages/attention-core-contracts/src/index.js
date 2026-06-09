export const packageName = "attention-core-contracts";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "canonical model names",
    "shared enums and keys",
    "payload shapes",
    "schema contract names",
    "product-scoped alias rules"
  ],
  doesNotInclude: [
    "domain mapping logic",
    "runtime service behavior",
    "page composition",
    "admin workflows"
  ],
  dependsOn: [],
  dependedOnBy: [
    "attention-core-runtime",
    "attention-core-mobile-ui",
    "attention-core-admin",
    "attention-core-harness"
  ]
});

export const canonicalModelNames = [
  "ProductContext",
  "ContentRef",
  "ContentVariantKey",
  "ContentListItem",
  "ContentDetailEnvelope",
  "DiscoverySection",
  "FollowTarget",
  "InboxItem",
  "NotificationPreferenceSnapshot",
  "UserContentState",
  "EntitlementSnapshot",
  "QuotaSnapshot",
  "PricingPreview",
  "CampaignPreview",
  "ExperimentAssignment",
  "PublishBatchSummary",
  "RuntimeMode"
];

export const enumNames = [
  "reading_mode",
  "audience_segment",
  "publish_status",
  "update_type",
  "update_priority",
  "notify_level",
  "runtime_mode",
  "entitlement_status",
  "quota_status",
  "notification_type",
  "discovery_section_type",
  "follow_target_type",
  "campaign_status",
  "experiment_bucket_shape",
  "state_panel_type"
];

export const keyAliasMap = Object.freeze({
  publication_id: "source_id",
  publication_key: "source_key",
  article_id: "content_item_id",
  article_key: "content_key",
  article_variant_id: "content_variant_id",
  publish_batch_id: "release_batch_id",
  publish_batch_key: "release_batch_key",
  subject_key: "follow_target_key",
  source_type: "notification_type"
});

export const payloadShapeNames = [
  "content_resolution_payload",
  "content_sync_payload",
  "access_snapshot_payload",
  "pricing_preview_payload",
  "notification_snapshot_payload",
  "experiment_assignment_payload"
];

export const schemaContractNames = [
  "content_contract_family",
  "access_contract_family",
  "commercial_contract_family",
  "discovery_contract_family",
  "notification_contract_family",
  "runtime_contract_family"
];

export const publicApi = [
  "packageBoundary",
  "canonicalModelNames",
  "enumNames",
  "keyAliasMap",
  "payloadShapeNames",
  "schemaContractNames"
];
