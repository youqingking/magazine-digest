const sectionRoots = [
  "Leaders",
  "Letters",
  "By_Invitation",
  "Briefing",
  "United_States",
  "The_Americas",
  "Asia",
  "China",
  "Middle_East_Africa",
  "Europe",
  "Britain",
  "International"
];

const sectionDisplayMap = {
  By_Invitation: "By Invitation",
  The_Americas: "The Americas",
  United_States: "United States",
  Middle_East_Africa: "Middle East & Africa"
};

function titleize(value) {
  const raw = String(value || "").trim();
  if (sectionDisplayMap[raw]) {
    return sectionDisplayMap[raw];
  }

  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const theEconomistReleaseOverlay = {
  parserProfile: "the_economist_release_v1",
  publicationId: "the_economist",
  publicationDisplayName: "The Economist",
  applyRecordOverlay(record, context) {
    const next = { ...record };
    const currentStem = context.pair.basename.replace(/\.md$/i, "").replace(/^\d{3}_/, "");
    const matchingRoot = sectionRoots
      .filter((root) => currentStem === root || currentStem.startsWith(`${root}_`))
      .sort((left, right) => right.length - left.length)[0];
    let sectionLabel = matchingRoot ? titleize(matchingRoot) : null;

    if (!sectionLabel) {
      for (let index = context.index - 1; index >= 0; index -= 1) {
        const previousStem = context.allPairs[index].basename.replace(/\.md$/i, "").replace(/^\d{3}_/, "");
        const previousRoot = sectionRoots
          .filter((root) => previousStem === root || previousStem.startsWith(`${root}_`))
          .sort((left, right) => right.length - left.length)[0];
        if (previousRoot) {
          sectionLabel = titleize(previousRoot);
          next.import_warnings = [...(next.import_warnings || []), "economist_section_context_fallback"];
          break;
        }
      }
    }

    next.section_label = sectionLabel || "The Economist";
    if (currentStem === "but-islam") {
      next.import_warnings = [...(next.import_warnings || []), "economist_filename_anomaly"];
    }
    return next;
  }
};
