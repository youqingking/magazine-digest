function deriveAtlanticSection(record) {
  const heading = String(record.merged_adult_heading || "");
  if (/OPENING/i.test(heading)) {
    return "Opening Argument";
  }
  if (/Dispatches/i.test(heading)) {
    return "Dispatches";
  }
  if (/Culture/i.test(heading) || /OMNIVOR/i.test(heading)) {
    return "Culture & Critics";
  }
  if (/JANUARY/i.test(heading)) {
    return "Front";
  }
  return heading || "The Atlantic";
}

export const theAtlanticReleaseOverlay = {
  parserProfile: "the_atlantic_release_v1",
  publicationId: "the_atlantic",
  publicationDisplayName: "The Atlantic",
  applyRecordOverlay(record, context) {
    const next = { ...record };
    if (!next.title || next.title === next.source_file_stem) {
      next.title = context.mergedAdult?.title_line || context.mergedAdult?.heading || next.title;
    }
    next.section_label = deriveAtlanticSection(next);
    if (/OPE_NING|RGU_M_E_N_T|will_tell_u|hammering_away/i.test(next.source_file_stem)) {
      next.import_warnings = [...(next.import_warnings || []), "atlantic_filename_truncated"];
    }
    return next;
  }
};
