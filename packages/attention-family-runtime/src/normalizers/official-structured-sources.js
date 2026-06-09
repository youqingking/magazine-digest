export const officialStructuredSourcesNormalizerName = "official_structured_sources_normalizer";
export const officialStructuredSourcesNormalizedShapeName = "official_structured_sources_normalized_shape";

export const officialStructuredSourcesNormalizerContract = Object.freeze({
  family_kind: "official_structured_sources",
  expected_input_shape: "sec_filing_raw_input",
  expected_input_fields: ["accession_no", "form_type", "issuer_name", "filed_at", "amendment_flag", "parser_trace_id"],
  expected_normalized_fields: [
    "family_name",
    "structured_record_ref",
    "record_party_ref",
    "record_revision_ref",
    "structured_effective_window"
  ],
  retained_adapter_only_extras: ["accession_no", "form_type", "parser_trace_id", "raw_document_package_ref"]
});

export function normalizeOfficialStructuredSources(rawSourceShape = {}) {
  const effectiveDate = rawSourceShape.filed_at ? String(rawSourceShape.filed_at).slice(0, 10) : null;
  return Object.freeze({
    family_name: "official_structured_sources",
    normalized_shape_name: officialStructuredSourcesNormalizedShapeName,
    structured_record_ref: {
      record_id: rawSourceShape.accession_no ? `sec_${rawSourceShape.accession_no.replace(/[^0-9]+/g, "_")}` : "sec_unknown",
      record_key:
        rawSourceShape.issuer_name && rawSourceShape.form_type && effectiveDate
          ? `${String(rawSourceShape.issuer_name).toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${String(rawSourceShape.form_type).toLowerCase()}_${effectiveDate.replace(/-/g, "")}`
          : "unknown_record_key",
      record_kind: "filing",
      record_status: rawSourceShape.amendment_flag ? "superseded" : "filed"
    },
    record_party_ref: {
      party_id: rawSourceShape.issuer_name
        ? `issuer_${String(rawSourceShape.issuer_name).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
        : "issuer_unknown",
      party_role: "issuer",
      display_name: rawSourceShape.issuer_name || "Unknown issuer"
    },
    record_revision_ref: {
      revision_id: rawSourceShape.amendment_flag ? "rev_amended" : "rev_initial",
      revision_kind: rawSourceShape.amendment_flag ? "amended" : "initial",
      effective_date: effectiveDate
    },
    structured_effective_window: {
      effective_date: effectiveDate,
      withdrawn_date: null,
      published_date: effectiveDate
    },
    retained_adapter_only_extras: {
      accession_no: rawSourceShape.accession_no || null,
      form_type: rawSourceShape.form_type || null,
      parser_trace_id: rawSourceShape.parser_trace_id || null,
      raw_document_package_ref: rawSourceShape.raw_document_package_ref || null
    }
  });
}
