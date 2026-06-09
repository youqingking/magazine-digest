export const directRouteContractName = "direct_adapter_route";

export const directRouteFieldNames = [
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

export const directRouteGuardrails = [
  "maps_source_adapter_directly_to_shared_core",
  "family_kind_must_be_null",
  "adapter_retains_single_source_semantics",
  "no_forced_family_retrofit"
];

export const directRouteExample = Object.freeze({
  adapter_id: "direct-magazine-summary",
  adapter_route_type: "direct",
  source_kind: "magazine_summary_object",
  family_kind: null,
  input_shape_name: "magazine_summary_input",
  output_shape_name: "shared_content_projection",
  diagnostics_shape_name: "adapter_mapping_diagnostics",
  supported_capabilities: ["shared_projection", "retained_extras", "mapping_diagnostics"],
  unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
  status: "pilot",
  version: "0.0.0-step04"
});
