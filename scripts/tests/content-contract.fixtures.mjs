import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { atomicWriteJson } from "../lib/atomic-json.mjs";
import { resolveSandboxPath } from "../lib/sandbox-paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..", "..");

export const scenarios = {
  baseline: "data1a_readers_digest_12112025",
  barrons: "data1c_barrons_09022026",
  atlantic: "data1c_the_atlantic_012026",
  economist: "data1c_the_economist_20260314",
  mixed: "data1c_three_release_mixed_preview"
};

export function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  atomicWriteJson(resolveSandboxPath(repoRoot, filePath), value);
}

export function stageTest1OutputPath(...parts) {
  return resolveSandboxPath(repoRoot, path.join(repoRoot, "output", "stage-test1", ...parts));
}

export function runtimeScenarioPath(fileName) {
  return path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", fileName);
}

export function currentRuntimePath(fileName) {
  return path.join(repoRoot, "mobile", "fixtures", "runtime", "current", fileName);
}

export function loadNormalizedRecords(publicationId, issueLabel) {
  const issueRoot =
    publicationId === "readers_digest"
      ? path.join(repoRoot, "data", "real-content", "readers-digest", issueLabel)
      : path.join(repoRoot, "data", "real-content", publicationId, issueLabel);
  const normalizedRoot = path.join(issueRoot, "normalized");
  return fs
    .readdirSync(normalizedRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(normalizedRoot, name)));
}

export function mkTempDir(prefix = "stage-test1-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function makeMarkdownVariant({ heading, shortBody, longBody, author = "Test Author", compliance = "完全安全" }) {
  return [
    `# ${heading}`,
    `- Author: ${author}`,
    `- 合规状态: ${compliance}`,
    "",
    "短版",
    shortBody,
    "",
    "长版",
    longBody,
    "",
    "---"
  ].join("\n");
}
