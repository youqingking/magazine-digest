export const packageName = "attention-family-contracts";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "family names",
    "family model names",
    "family enums and keys",
    "family promotion rules",
    "family compatibility guardrails"
  ],
  doesNotInclude: [
    "source adapter implementations",
    "shared core rewrites",
    "business-page logic"
  ],
  dependsOn: ["attention-core-contracts"],
  dependedOnBy: ["attention-family-runtime", "attention-family-harness"]
});

export const familyNames = [
  "transcript_first_longform",
  "official_structured_sources",
  "knowledge_community_qa",
  "open_social_expert_stream",
  "visual_inspiration_curated_asset"
];

export const layeringRuleNames = [
  "shared_core_unchanged",
  "family_between_core_and_adapter",
  "adapter_keeps_source_native_logic",
  "family_promotes_before_shared"
];

export const familyModelNames = [
  "TranscriptDocumentRef",
  "TranscriptSegment",
  "SpeakerTurn",
  "TimestampRange",
  "TranscriptAvailabilitySnapshot",
  "StructuredRecordRef",
  "RecordPartyRef",
  "RecordRevisionRef",
  "RecordDeltaSummary",
  "StructuredEffectiveWindow",
  "QaThreadRef",
  "QaAnswerSummary",
  "AcceptedAnswerRef",
  "QaRankingSnapshot",
  "QaModerationSnapshot",
  "SocialPostRef",
  "ReplyTreeSummary",
  "ReshareEdge",
  "WatchlistMembershipSnapshot",
  "SocialFreshnessSnapshot",
  "CuratedAssetRef",
  "CollectionMembershipRef",
  "AttributionSnapshot",
  "LicenseSnapshot",
  "AssetArrangementSlot"
];

export const familyEnumNames = [
  "source_family_name",
  "transcript_status",
  "transcript_completeness_state",
  "clip_anchor_type",
  "record_kind",
  "record_status",
  "revision_kind",
  "party_role",
  "thread_status",
  "acceptance_state",
  "moderation_state",
  "qa_sort_mode",
  "reshare_type",
  "freshness_state",
  "watch_reason",
  "asset_kind",
  "license_class",
  "arrangement_role"
];

export const familyKeyNames = [
  "source_family_item_id",
  "transcript_document_id",
  "segment_id",
  "speaker_ref",
  "record_id",
  "revision_id",
  "delta_id",
  "party_id",
  "qa_thread_id",
  "qa_answer_id",
  "accepted_answer_id",
  "social_post_id",
  "reply_tree_id",
  "watchlist_id",
  "asset_id",
  "collection_id",
  "license_id"
];

export const promotionRuleNames = [
  "adapter_to_family_requires_two_sources",
  "family_to_shared_requires_cross_family_proof",
  "single_source_terms_stay_in_adapter",
  "family_terms_must_not_rewrite_shared_core"
];

export const compatibilityGuardrails = [
  "magazine_stays_shared_plus_adapter",
  "youtube_stays_shared_plus_adapter",
  "transcript_sidecars_may_use_family",
  "issue_and_playback_semantics_do_not_retrofit"
];

export const publicApi = [
  "packageBoundary",
  "familyNames",
  "layeringRuleNames",
  "familyModelNames",
  "familyEnumNames",
  "familyKeyNames",
  "promotionRuleNames",
  "compatibilityGuardrails"
];
