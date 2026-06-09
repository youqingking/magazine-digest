import { loadNormalizedRecords } from "../content-contract.fixtures.mjs";

export async function runEconomistGolden() {
  const records = loadNormalizedRecords("the_economist", "20260314");
  const unitedStates = records.find((item) => item.article_id === "art_the_economist_20260314_013");
  const anomaly = records.find((item) => item.article_id === "art_the_economist_20260314_024");

  return {
    id: "the_economist_release_v1",
    status:
      unitedStates?.section_label === "United States" &&
      anomaly?.section_label === "Asia" &&
      (anomaly?.effective_warnings || []).includes("economist_filename_anomaly")
        ? "passed"
        : "failed",
    assertions: {
      united_states_section: unitedStates?.section_label || null,
      anomaly_section: anomaly?.section_label || null,
      anomaly_warnings: anomaly?.effective_warnings || []
    }
  };
}
