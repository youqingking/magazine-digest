import { createMappingDiagnostics } from "../contracts/mapping-diagnostics.js";

export const directMagazineSummaryPilot = Object.freeze({
  adapter_id: "direct-magazine-summary",
  route_type: "direct",
  source_kind: "magazine_summary_object",
  family_kind: null,
  input_shape: Object.freeze({
    shape_name: "magazine_summary_input",
    fields: [
      "publication_id",
      "publication_key",
      "article_id",
      "article_key",
      "language",
      "title",
      "summary",
      "issue_id",
      "issue_label",
      "start_page",
      "print_taxonomy_path",
      "cover_slot"
    ]
  }),
  mapping_path: ["source_adapter", "shared_core"],
  shared_outputs: Object.freeze({
    models: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"],
    output_shape_name: "shared_content_projection"
  }),
  retained_extras: ["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"],
  diagnostics_example: createMappingDiagnostics({
    adapter_id: "direct-magazine-summary",
    route_type: "direct",
    source_kind: "magazine_summary_object",
    family_kind: null,
    mapped_shared_fields: ["ContentRef", "ContentVariantKey", "ContentListItem", "ContentDetailEnvelope"],
    mapped_family_fields: [],
    retained_domain_extras: ["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"],
    unmapped_source_fields: [],
    unsupported_reason: null,
    warnings: ["Do not promote issue packaging into shared core."],
    notes: ["Magazine remains direct-path-first in Step 04."]
  })
});
