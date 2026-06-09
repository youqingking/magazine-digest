import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, "mobile", "fixtures", "runtime", "build-meta.generated.js");

function runGit(args, fallback = null) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return fallback;
  }
}

const payload = {
  branch: runGit(["branch", "--show-current"], "unknown"),
  shortSha: runGit(["rev-parse", "--short", "HEAD"], "unknown"),
  describe: runGit(["describe", "--tags", "--always"], "unknown"),
  buildTimestamp: new Date().toISOString(),
  baselineTag: "baseline-ui3-data1d-test1-ops1",
  baselineCommit: runGit(["rev-list", "-n", "1", "baseline-ui3-data1d-test1-ops1"], null),
  source: "workspace_generated"
};

fs.writeFileSync(
  outputPath,
  `const BUILD_META = ${JSON.stringify(payload, null, 2)};\n\nexport default BUILD_META;\n`,
  "utf8"
);

console.log(JSON.stringify({
  status: "ok",
  output: path.relative(repoRoot, outputPath).replace(/\\/g, "/"),
  build_meta: payload
}, null, 2));
