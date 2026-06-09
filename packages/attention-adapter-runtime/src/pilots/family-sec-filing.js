import { createMappingDiagnostics } from "../contracts/mapping-diagnostics.js";

export const familySecFilingPilot = Object.freeze({
  adapter_id: "family-sec-filing",
  route_type: "family",
  source_kind: "sec_filing_source",
  family_kind: "official_structured_sources",
  input_shape: Object.freeze({
    shape_name: "sec_filing_raw_input",
    fields: ["accession_no", "form_type", "issuer_name", "filed_at", "amendment_flag", "parser_trace_id"]
  }),
  family_normalized_shape: Object.freeze({
    family_name: "official_structured_sources",
    models: ["StructuredRecordRef", "RecordPartyRef", "RecordRevisionRef", "StructuredEffectiveWindow"]
  }),
  mapping_path: ["source_adapter", "source_family", "shared_core"],
  shared_outputs: Object.freeze({
    models: ["ContentRef", "ContentListItem", "ContentDetailEnvelope"],
    output_shape_name: "family_then_shared_content_projection"
  }),
  retained_extras: ["accession_no", "form_type", "parser_trace_id", "raw_document_package_ref"],
  diagnostics_example: createMappingDiagnostics({
    adapter_id: "family-sec-filing",
    route_type: "family",
    source_kind: "sec_filing_source",
    family_kind: "official_structured_sources",
    mapped_shared_fields: ["ContentRef", "ContentListItem", "ContentDetailEnvelope"],
    mapped_family_fields: [
      "StructuredRecordRef",
      "RecordPartyRef",
      "RecordRevisionRef",
      "StructuredEffectiveWindow"
    ],
    retained_domain_extras: ["accession_no", "form_type", "parser_trace_id", "raw_document_package_ref"],
    unmapped_source_fields: [],
    unsupported_reason: null,
    warnings: ["Do not promote parser traces beyond adapter."],
    notes: ["Official structured semantics normalize through family before shared projection."]
  })
});
