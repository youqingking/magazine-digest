export const familyRouteContractName = "family_adapter_route";

export const familyRouteFieldNames = [
  "adapter_id",
  "adapter_route_type",
  "source_kind",
  "family_kind",
  "input_shape_name",
  "output_shape_name",
  "diagnostics_shape_name",
  "supported_capabilities",
  "unsupported_capabilities",
  "status",
  "version"
];

export const familyRouteGuardrails = [
  "maps_source_adapter_to_family_before_shared_core",
  "family_kind_must_match_step03_family_name",
  "adapter_retains_single_source_semantics_after_family_normalization",
  "family_layer_remains_optional_for_other_sources"
];

export const familyRouteExample = Object.freeze({
  adapter_id: "family-podcast-transcript",
  adapter_route_type: "family",
  source_kind: "podcast_transcript_source",
  family_kind: "transcript_first_longform",
  input_shape_name: "podcast_transcript_raw_input",
  output_shape_name: "family_then_shared_content_projection",
  diagnostics_shape_name: "adapter_mapping_diagnostics",
  supported_capabilities: ["family_normalization", "shared_projection", "mapping_diagnostics"],
  unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
  status: "pilot",
  version: "0.0.0-step04"
});
