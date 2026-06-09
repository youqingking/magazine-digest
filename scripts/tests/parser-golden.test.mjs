import { writeJson, stageTest1OutputPath } from "./content-contract.fixtures.mjs";
import { runReadersDigestGolden } from "./parsers/readers-digest.test.mjs";
import { runSplitAudienceGolden } from "./parsers/split-audience.test.mjs";
import { runAtlanticGolden } from "./parsers/atlantic.test.mjs";
import { runEconomistGolden } from "./parsers/economist.test.mjs";
import { runBarronsGolden } from "./parsers/barrons.test.mjs";

export async function runParserGoldenTests() {
  const items = [
    await runReadersDigestGolden(),
    await runSplitAudienceGolden(),
    await runBarronsGolden(),
    await runAtlanticGolden(),
    await runEconomistGolden()
  ];

  const report = {
    generated_at: new Date().toISOString(),
    status: items.every((item) => item.status === "passed") ? "passed" : "failed",
    items
  };

  writeJson(stageTest1OutputPath("parser-golden-report.json"), report);
  if (report.status !== "passed") {
    throw new Error("TEST1_PARSER_GOLDEN_FAILED");
  }
  return report;
}
