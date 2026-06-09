import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  defaultIssuesRegistry,
  defaultPublicationsRegistry,
  defaultScenarioRegistry,
  pipelinePaths,
  readJson,
  repoRoot,
  writeJson
} from "../import/lib/content-pipeline.mjs";
import { opsPaths } from "../ops/lib/ops-lib.mjs";

const reportPath = path.join(repoRoot, "output", "stage-ops5", "intake-replace-report.json");
const fixtureRoot = path.join(repoRoot, "output", "stage-ops5", "intake-replace-fixture");
const publicationId = "ops5_replace_test";
const issueLabel = "20260323";
const issueId = `${publicationId}__${issueLabel}`;
const scenarioId = `intake_${publicationId}_${issueLabel}`;
const issueRoot = path.join(pipelinePaths.dataRoot, publicationId, issueLabel);
const publicationRoot = path.join(pipelinePaths.dataRoot, publicationId);
const scenarioBundlePath = path.join(pipelinePaths.runtimeScenarioRoot, `${scenarioId}.bundle.json`);
const intakeOutputRoot = path.join(repoRoot, "output", "stage-ops5", "generic-intake");

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function normalizeForZipPath(filePath) {
  return filePath.replace(/\//g, "\\");
}

function runJson(args, allowFailure = false) {
  try {
    const output = execFileSync(process.execPath, [path.join(repoRoot, "scripts", "ops", "intake-pack.mjs"), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024
    });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure && error.stdout) {
      return JSON.parse(String(error.stdout));
    }
    throw error;
  }
}

function buildVariantMarkdown({ title, originalTitle, author, complianceStatus, quickBody, deepBody }) {
  return [
    `# ${title}（${originalTitle}）`,
    `- Author: ${author}`,
    `- 合规状态: ${complianceStatus}`,
    "",
    "短版",
    quickBody,
    "",
    "长版",
    deepBody,
    ""
  ].join("\n");
}

function createSyntheticReleaseRoot(rootPath, variant) {
  const publicReleaseRoot = path.join(rootPath, "public_release");
  const adultRoot = path.join(publicReleaseRoot, "adult");
  const youthRoot = path.join(publicReleaseRoot, "youth");
  const mergedRoot = path.join(publicReleaseRoot, "merged");
  ensureDir(adultRoot);
  ensureDir(youthRoot);
  ensureDir(mergedRoot);

  const adultMarkdown = buildVariantMarkdown({
    title: variant.title,
    originalTitle: variant.originalTitle,
    author: "OPS5 Test Desk",
    complianceStatus: "已审校",
    quickBody: variant.quickAdult,
    deepBody: variant.deepAdult
  });
  const youthMarkdown = buildVariantMarkdown({
    title: variant.title,
    originalTitle: variant.originalTitle,
    author: "OPS5 Test Desk",
    complianceStatus: "已审校",
    quickBody: variant.quickTeen,
    deepBody: variant.deepTeen
  });
  const mergedMarkdown = [
    `## ${variant.title}`,
    `# ${variant.title}（${variant.originalTitle}）`,
    ""
  ].join("\n");

  writeText(path.join(adultRoot, "001_launch.md"), adultMarkdown);
  writeText(path.join(youthRoot, "001_launch.md"), youthMarkdown);
  writeText(path.join(mergedRoot, "adult_merged.md"), mergedMarkdown);
  writeText(path.join(mergedRoot, "youth_merged.md"), mergedMarkdown);
}

function zipDirectory(sourceRoot, zipPath) {
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  ensureDir(path.dirname(zipPath));
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      [
        "Add-Type -AssemblyName System.IO.Compression.FileSystem",
        "if (Test-Path $env:OPS5_ZIP_DEST) { Remove-Item $env:OPS5_ZIP_DEST -Force }",
        "[IO.Compression.ZipFile]::CreateFromDirectory($env:OPS5_ZIP_SOURCE, $env:OPS5_ZIP_DEST)"
      ].join("; ")
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024,
      env: {
        ...process.env,
        OPS5_ZIP_SOURCE: normalizeForZipPath(sourceRoot),
        OPS5_ZIP_DEST: normalizeForZipPath(zipPath)
      }
    }
  );
}

function createSyntheticZip(zipPath, variant) {
  const sourceRoot = path.join(fixtureRoot, path.basename(zipPath, ".zip"));
  fs.rmSync(sourceRoot, { recursive: true, force: true });
  createSyntheticReleaseRoot(sourceRoot, variant);
  zipDirectory(sourceRoot, zipPath);
}

function loadIssueManifest() {
  return readJson(path.join(issueRoot, "manifest.json"), null);
}

function cleanupTestArtifacts() {
  const publicationsRegistry = readJson(pipelinePaths.publicationsRegistry, defaultPublicationsRegistry());
  publicationsRegistry.items = (publicationsRegistry.items || []).filter((item) => item.id !== publicationId);
  publicationsRegistry.generated_at = new Date().toISOString();
  writeJson(pipelinePaths.publicationsRegistry, publicationsRegistry);

  const issuesRegistry = readJson(pipelinePaths.issuesRegistry, defaultIssuesRegistry());
  issuesRegistry.items = (issuesRegistry.items || []).filter((item) => item.issue_id !== issueId);
  issuesRegistry.generated_at = new Date().toISOString();
  writeJson(pipelinePaths.issuesRegistry, issuesRegistry);

  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  scenarioRegistry.items = (scenarioRegistry.items || []).filter((item) => item.scenario_id !== scenarioId);
  scenarioRegistry.generated_at = new Date().toISOString();
  writeJson(pipelinePaths.runtimeScenarioIndex, scenarioRegistry);

  fs.rmSync(publicationRoot, { recursive: true, force: true });
  fs.rmSync(scenarioBundlePath, { force: true });
  fs.rmSync(path.join(intakeOutputRoot, `${publicationId}_${issueLabel}.json`), { force: true });
  fs.rmSync(path.join(intakeOutputRoot, `${publicationId}_${issueLabel}.validation.json`), { force: true });
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

export async function runIntakeReplaceTest() {
  cleanupTestArtifacts();
  ensureDir(fixtureRoot);

  const initialZip = path.join(fixtureRoot, "ops5-replace-initial.zip");
  const replacementZip = path.join(fixtureRoot, "ops5-replace-updated.zip");
  createSyntheticZip(initialZip, {
    title: "轨道望远镜再次升空",
    originalTitle: "Orbital Telescope Returns",
    quickAdult: "轨道望远镜任务重启，工程团队重新压缩任务窗口，并把发射顺序改成更稳健的两段式方案，确保关键载荷能够按时进入轨道。",
    deepAdult: "轨道望远镜任务在预算与运力波动后重新排期。新的工程方案把原本一次完成的多段任务拆成更可控的节奏，并重新核对热控、电源、姿态控制与地面站窗口。团队同时保留关键科学载荷优先策略，以保证即使后续运力再调整，也不会影响最核心的观测目标。",
    quickTeen: "轨道望远镜项目重新安排升空步骤，团队把最重要的设备优先送上去，好让后面的科学观测更稳。",
    deepTeen: "这次调整的重点不是让任务更复杂，而是让每一步更安全。团队先确认最重要的设备和轨道窗口，再安排后续补给和维护计划。这样即使遇到预算或天气变化，最重要的观测任务也更容易按计划完成。"
  });
  createSyntheticZip(replacementZip, {
    title: "轨道望远镜带着新相机升空",
    originalTitle: "Orbital Telescope Returns",
    quickAdult: "轨道望远镜任务在重新排期后加入新一代相机模块，团队同步更新发射与标定流程，让首批观测能更快进入稳定阶段。",
    deepAdult: "新版任务方案在保持整体发射窗口的同时，增加了新的成像模块与标定步骤。工程团队因此重写了地面测试、在轨验收和数据校准顺序，以减少系统切换带来的风险。新的节奏意味着首批科学结果虽然稍晚，但稳定性和后续扩展能力更高。",
    quickTeen: "这次望远镜不只重新升空，还带了更好的相机。团队先把测试流程改稳，再让望远镜开始正式拍摄。",
    deepTeen: "加入新相机会让任务更强，但也会多出一些检查步骤。团队现在先把每个测试节点安排清楚，再开始正式观测。这样做虽然不追求最快，但能减少出错，让后面的科学照片更可靠。等相机、望远镜和地面站三边都完成校准后，新的观测任务才会依次展开。"
  });

  const baseArgs = [
    "--route-hint", "generic_split_release",
    "--publication-id", publicationId,
    "--publication-display-name", "OPS5 Replace Test",
    "--issue-label", issueLabel
  ];

  let report;
  try {
    const initial = runJson(["--zip", initialZip, ...baseArgs]);
    assert.equal(initial.status, "ok", "expected initial intake to succeed");
    assert.ok((initial.generated_issues || []).includes(issueId), "expected initial import to create target issue");
    const manifestAfterInitial = loadIssueManifest();
    assert.equal(manifestAfterInitial?.articles?.[0]?.title, "轨道望远镜再次升空", "expected initial title in manifest");

    const conflict = runJson(["--zip", replacementZip, ...baseArgs], true);
    assert.equal(conflict.error_code, "OPS5_INTAKE_TARGET_EXISTS", "expected protective conflict without replace");

    const replaced = runJson(["--zip", replacementZip, ...baseArgs, "--replace-existing"]);
    assert.equal(replaced.status, "ok", "expected replace-existing import to succeed");
    assert.equal(replaced.replacement?.mode, "replace_existing_issue", "expected replacement metadata");
    assert.equal(replaced.replacement?.target_issue_id, issueId, "expected replacement target issue");
    assert.ok(replaced.replacement?.backup_root && fs.existsSync(replaced.replacement.backup_root), "expected replacement backup root");
    const manifestAfterReplace = loadIssueManifest();
    assert.equal(manifestAfterReplace?.articles?.[0]?.title, "轨道望远镜带着新相机升空", "expected replacement title in manifest");

    report = {
      generated_at: new Date().toISOString(),
      status: "passed",
      target_issue_id: issueId,
      initial,
      conflict,
      replaced,
      manifest_after_replace: {
        title: manifestAfterReplace?.articles?.[0]?.title || null
      }
    };
    writeJson(reportPath, report);
    return report;
  } finally {
    const latestReport = report || {
      generated_at: new Date().toISOString(),
      status: "cleanup_only",
      target_issue_id: issueId
    };
    cleanupTestArtifacts();
    latestReport.cleanup = {
      publication_root_exists: fs.existsSync(publicationRoot),
      issue_root_exists: fs.existsSync(issueRoot),
      scenario_bundle_exists: fs.existsSync(scenarioBundlePath)
    };
    writeJson(reportPath, latestReport);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runIntakeReplaceTest();
  console.log(JSON.stringify(report, null, 2));
}
