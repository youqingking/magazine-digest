import generatedBuildMeta from "../fixtures/runtime/build-meta.generated.js";

const FALLBACK_BUILD_META = {
  branch: "unknown",
  shortSha: "unknown",
  describe: "unknown",
  buildTimestamp: null,
  baselineTag: "baseline-ui3-data1d-test1-ops1",
  baselineCommit: null,
  source: "fallback"
};

export function getBuildMeta() {
  return {
    ...FALLBACK_BUILD_META,
    ...(generatedBuildMeta || {})
  };
}
