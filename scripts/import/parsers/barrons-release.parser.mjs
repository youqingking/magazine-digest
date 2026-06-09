function deriveSectionFromTitle(title, originalTitle) {
  const chinese = String(title || "").split(/[：:]/)[0].trim();
  if (chinese && chinese !== title) {
    return chinese;
  }
  const english = String(originalTitle || "").split(/[:/]/)[0].trim();
  return english || "Barron's";
}

export const barronsReleaseOverlay = {
  parserProfile: "barrons_release_v1",
  publicationId: "barrons",
  publicationDisplayName: "Barron's",
  applyRecordOverlay(record) {
    const next = { ...record };
    next.section_label = deriveSectionFromTitle(next.title, next.original_title);
    if (next.source_release_dir.includes("Barron")) {
      next.normalized_release_key = "barrons_09022026_release";
    }
    return next;
  }
};
