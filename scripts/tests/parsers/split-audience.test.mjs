import fs from "node:fs";
import path from "node:path";

import { parseSplitAudienceRelease } from "../../import/parsers/split-audience-release.parser.mjs";
import { mkTempDir, makeMarkdownVariant } from "../content-contract.fixtures.mjs";

function createReleaseSkeleton(root) {
  fs.mkdirSync(path.join(root, "adult"), { recursive: true });
  fs.mkdirSync(path.join(root, "youth"), { recursive: true });
  fs.mkdirSync(path.join(root, "merged"), { recursive: true });
}

function writeMerged(root, adultHeading = "## Alpha Heading\n# Alpha Title", youthHeading = "## Alpha Heading\n# Alpha Title") {
  fs.writeFileSync(path.join(root, "merged", "adult_merged.md"), `${adultHeading}\n---\n`, "utf8");
  fs.writeFileSync(path.join(root, "merged", "youth_merged.md"), `${youthHeading}\n---\n`, "utf8");
}

const overlay = {
  publicationId: "test_pub",
  publicationDisplayName: "Test Pub",
  parserProfile: "split_audience_release_v1",
  applyRecordOverlay(record) {
    return {
      ...record,
      section_label: "Test Section"
    };
  }
};

export async function runSplitAudienceGolden() {
  const rootOk = mkTempDir("test1-split-ok-");
  createReleaseSkeleton(rootOk);
  fs.writeFileSync(
    path.join(rootOk, "adult", "001_alpha.md"),
    makeMarkdownVariant({ heading: "成人标题（Adult Title）", shortBody: "成人短版", longBody: "成人长版" }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(rootOk, "youth", "001_alpha.md"),
    makeMarkdownVariant({ heading: "少年标题（Teen Title）", shortBody: "少年短版", longBody: "少年长版" }),
    "utf8"
  );
  writeMerged(rootOk);

  const okResult = parseSplitAudienceRelease({
    releaseRoot: rootOk,
    publicationId: "test_pub",
    publicationDisplayName: "Test Pub",
    issueLabel: "20990101",
    parserProfile: "split_audience_release_v1",
    sourcePack: "test.zip",
    sourceReleaseDir: "test-release",
    issueDataRoot: path.join(rootOk, "issue"),
    freeQuotaLimit: 8,
    overlay
  });

  const rootMissing = mkTempDir("test1-split-missing-");
  createReleaseSkeleton(rootMissing);
  fs.writeFileSync(
    path.join(rootMissing, "adult", "001_alpha.md"),
    makeMarkdownVariant({ heading: "成人标题（Adult Title）", shortBody: "成人短版", longBody: "成人长版" }),
    "utf8"
  );
  writeMerged(rootMissing);

  const missingResult = parseSplitAudienceRelease({
    releaseRoot: rootMissing,
    publicationId: "test_pub",
    publicationDisplayName: "Test Pub",
    issueLabel: "20990101",
    parserProfile: "split_audience_release_v1",
    sourcePack: "test.zip",
    sourceReleaseDir: "test-release",
    issueDataRoot: path.join(rootMissing, "issue"),
    freeQuotaLimit: 8,
    overlay
  });

  return {
    id: "split_audience_release_v1",
    status:
      okResult.paired_count === 1 &&
      okResult.records[0].quick_30s === "成人短版" &&
      okResult.records[0].teen_quick_30s === "少年短版" &&
      missingResult.warnings.some((warning) => warning.type === "missing_youth_pair")
        ? "passed"
        : "failed",
    assertions: {
      paired_count: okResult.paired_count,
      teen_field_present: Boolean(okResult.records[0].teen_deep_3m),
      missing_pair_warning_count: missingResult.warnings.length
    }
  };
}
