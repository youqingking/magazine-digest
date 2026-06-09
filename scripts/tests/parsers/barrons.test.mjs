import { loadNormalizedRecords } from "../content-contract.fixtures.mjs";

export async function runBarronsGolden() {
  const records = loadNormalizedRecords("barrons", "09022026");
  const first = records[0];
  return {
    id: "barrons_release_v1",
    status:
      first?.publication_id === "barrons" &&
      first?.publication_display_name === "Barron's" &&
      first?.issue_label === "09022026"
        ? "passed"
        : "failed",
    assertions: {
      publication_id: first?.publication_id || null,
      publication_display_name: first?.publication_display_name || null,
      issue_label: first?.issue_label || null
    }
  };
}
