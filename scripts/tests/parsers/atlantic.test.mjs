import { loadNormalizedRecords } from "../content-contract.fixtures.mjs";

export async function runAtlanticGolden() {
  const records = loadNormalizedRecords("the_atlantic", "012026");
  const record = records.find((item) => item.article_id === "art_the_atlantic_012026_002");
  const sectionOverride = records.find((item) => item.article_id === "art_the_atlantic_012026_009");

  return {
    id: "the_atlantic_release_v1",
    status:
      record?.title === "优待之国：美国大学的“考试延时”困局" &&
      record?.display_warning_suppression?.includes("atlantic_filename_truncated") &&
      record?.effective_warnings?.length === 0 &&
      sectionOverride?.section_label === "Culture & Critics"
        ? "passed"
        : "failed",
    assertions: {
      title: record?.title || null,
      suppressed_warning: record?.display_warning_suppression || [],
      section_009: sectionOverride?.section_label || null
    }
  };
}
