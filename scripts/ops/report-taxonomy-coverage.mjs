import { buildData3Reports } from "./lib/taxonomy-lib.mjs";

const reports = buildData3Reports();

console.log(JSON.stringify({
  status: "ok",
  publications: reports.coverageReport.publications.map((item) => ({
    publication_key: item.publication_key,
    raw_section_count: item.raw_section_count,
    mapped_ratio: item.mapped_ratio
  })),
  candidate: reports.coverageReport.scenarios.find((item) => item.scenario_id === "data2_multi_publication_release_candidate") || null
}, null, 2));
