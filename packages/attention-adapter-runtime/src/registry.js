import { mappingDiagnosticsShapeName } from "./contracts/mapping-diagnostics.js";

export const adapterRegistryShapeName = "adapter_registry_entry";

export const adapterRouteTypes = ["direct", "family"];

export const adapterRegistryFieldNames = [
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

export const pilotAdapterRegistry = Object.freeze([
  Object.freeze({
    adapter_id: "direct-magazine-summary",
    adapter_route_type: "direct",
    source_kind: "magazine_summary_object",
    family_kind: null,
    input_shape_name: "magazine_summary_input",
    output_shape_name: "shared_content_projection",
    diagnostics_shape_name: mappingDiagnosticsShapeName,
    supported_capabilities: ["shared_projection", "retained_extras", "mapping_diagnostics"],
    unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
    status: "pilot",
    version: "0.0.0-step04"
  }),
  Object.freeze({
    adapter_id: "direct-youtube-summary",
    adapter_route_type: "direct",
    source_kind: "youtube_summary_object",
    family_kind: null,
    input_shape_name: "youtube_summary_input",
    output_shape_name: "shared_content_projection",
    diagnostics_shape_name: mappingDiagnosticsShapeName,
    supported_capabilities: ["shared_projection", "retained_extras", "mapping_diagnostics"],
    unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
    status: "pilot",
    version: "0.0.0-step04"
  }),
  Object.freeze({
    adapter_id: "family-podcast-transcript",
    adapter_route_type: "family",
    source_kind: "podcast_transcript_source",
    family_kind: "transcript_first_longform",
    input_shape_name: "podcast_transcript_raw_input",
    output_shape_name: "family_then_shared_content_projection",
    diagnostics_shape_name: mappingDiagnosticsShapeName,
    supported_capabilities: ["family_normalization", "shared_projection", "mapping_diagnostics"],
    unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
    status: "pilot",
    version: "0.0.0-step04"
  }),
  Object.freeze({
    adapter_id: "family-sec-filing",
    adapter_route_type: "family",
    source_kind: "sec_filing_source",
    family_kind: "official_structured_sources",
    input_shape_name: "sec_filing_raw_input",
    output_shape_name: "family_then_shared_content_projection",
    diagnostics_shape_name: mappingDiagnosticsShapeName,
    supported_capabilities: ["family_normalization", "shared_projection", "mapping_diagnostics"],
    unsupported_capabilities: ["live_fetch", "ingestion_pipeline", "domain_migration"],
    status: "pilot",
    version: "0.0.0-step04"
  })
]);

export function listAdapterRegistryEntries() {
  return [...pilotAdapterRegistry];
}

export function findAdapterRegistryEntry(adapterId) {
  return pilotAdapterRegistry.find((entry) => entry.adapter_id === adapterId) || null;
}
