import path from "node:path";
import fs from "node:fs";

import { ensureDir, readJson, scenarios, stageTest1OutputPath, writeJson } from "./content-contract.fixtures.mjs";
import { runContentContractTests } from "./content-contract.test.mjs";
import { runParserGoldenTests } from "./parser-golden.test.mjs";
import { runLifecycleTests } from "./lifecycle.test.mjs";
import { runAppRegressionTests } from "./app-regression.test.mjs";
import { importReadersDigestPilot } from "../import/import-readers-digest-pilot.mjs";
import { importContentPack } from "../import/import-content-pack.mjs";
import { acquireStateLock, releaseStateLock } from "../lib/state-lock.mjs";
import { pipelinePaths } from "../import/lib/content-pipeline.mjs";

function buildMatrixReport() {
  const report = {
    generated_at: new Date().toISOString(),
    items: [
      {
        id: "parser_readers_digest_v1",
        input: "Reader's Digest baseline raw/normalized",
        assertions: ["four content blocks present", "adult merged not imported as article"],
        failure_level: "blocker",
        dependencies: ["DATA1A baseline data"]
      },
      {
        id: "parser_split_audience_release_v1",
        input: "minimal synthetic split fixture + Three-release pack",
        assertions: ["adult/youth pairing", "missing side emits warning"],
        failure_level: "blocker",
        dependencies: ["split-audience parser"]
      },
      {
        id: "parser_barrons_release_v1",
        input: "barrons__09022026 normalized records",
        assertions: ["publication id/display name stable"],
        failure_level: "blocker",
        dependencies: ["DATA1C import"]
      },
      {
        id: "parser_the_atlantic_release_v1",
        input: "the_atlantic__012026 normalized records",
        assertions: ["H1 title beats truncated filename", "override suppresses display warning"],
        failure_level: "blocker",
        dependencies: ["DATA1C import", "DATA1D overrides"]
      },
      {
        id: "parser_the_economist_release_v1",
        input: "the_economist__20260314 normalized records",
        assertions: ["section recovery stable", "anomaly remains scoped warning"],
        failure_level: "blocker",
        dependencies: ["DATA1C import", "DATA1D metadata refinement"]
      },
      {
        id: "content_contracts",
        input: "all normalized issues + mixed scenario registry",
        assertions: ["required fields", "best-effort policy", "override-composed records"],
        failure_level: "blocker",
        dependencies: ["reimported normalized data"]
      },
      {
        id: "scenario_lifecycle",
        input: "scenario index + selected/current mirror",
        assertions: ["select", "publish", "rollback", "retire", "baseline restore"],
        failure_level: "blocker",
        dependencies: ["runtime scenario registry"]
      },
      {
        id: "app_consumption_regression",
        input: "baseline + mixed current runtime bundles",
        assertions: ["feed/search/detail/paywall/profile", "restore state", "scenario provenance"],
        failure_level: "blocker",
        dependencies: ["publish controls", "runtime bundles"]
      }
    ],
    scenarios: Object.values(scenarios),
    orchestration: {
      mode: "serial_only",
      file_lock_sensitive_paths: [
        "output/stage-data1c/extracted",
        "mobile/fixtures/runtime/current/*",
        "mobile/fixtures/runtime/scenarios/index.json",
        "mobile/fixtures/runtime/scenarios/selected.json"
      ]
    },
    accepted_warnings: [
      "readers_digest ordinal best-effort gap",
      "the_economist single anomaly article"
    ]
  };
  writeJson(stageTest1OutputPath("matrix-report.json"), report);
  return report;
}

export async function runTest1() {
  ensureDir(stageTest1OutputPath());
  const lock = await acquireStateLock("runtime-state", {
    runId: process.env.RUN_ID || "run-test1",
    script: "scripts/tests/run-test1.mjs"
  });
  const snapshotPath = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  const restorePath = (filePath, content) => {
    if (content === null) {
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
      return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  };
  const before = {
    selected: snapshotPath(pipelinePaths.runtimeScenarioSelected),
    index: snapshotPath(pipelinePaths.runtimeScenarioIndex),
    currentMeta: snapshotPath(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json")),
    currentBundle: snapshotPath(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"))
  };

  const finalReport = {
    generated_at: new Date().toISOString(),
    status: "passed",
    steps: []
  };

  try {
    buildMatrixReport();

    await importReadersDigestPilot();
    await importContentPack({
      zip: "C:/Users/dabblefly/Downloads/Three-release.zip",
      freeQuotaLimit: 8
    });
    finalReport.steps.push({ id: "reimport_sources", status: "passed" });

    const contentContract = await runContentContractTests();
    finalReport.steps.push({ id: "content_contract", status: contentContract.status });

    const parserGolden = await runParserGoldenTests();
    finalReport.steps.push({ id: "parser_golden", status: parserGolden.status });

    const lifecycle = await runLifecycleTests();
    finalReport.steps.push({ id: "lifecycle", status: lifecycle.status });

    const appRegression = await runAppRegressionTests();
    finalReport.steps.push({ id: "app_regression", status: appRegression.status });

    finalReport.reports = {
      matrix: path.relative(path.dirname(stageTest1OutputPath("x")), stageTest1OutputPath("matrix-report.json")).replace(/\\/g, "/"),
      content_contract: path.relative(path.dirname(stageTest1OutputPath("x")), stageTest1OutputPath("content-contract-report.json")).replace(/\\/g, "/"),
      parser_golden: path.relative(path.dirname(stageTest1OutputPath("x")), stageTest1OutputPath("parser-golden-report.json")).replace(/\\/g, "/"),
      lifecycle: path.relative(path.dirname(stageTest1OutputPath("x")), stageTest1OutputPath("lifecycle-report.json")).replace(/\\/g, "/"),
      app_regression: path.relative(path.dirname(stageTest1OutputPath("x")), stageTest1OutputPath("app-regression-report.json")).replace(/\\/g, "/")
    };
  } catch (error) {
    finalReport.status = "failed";
    finalReport.fatal_error = error.message || String(error);
    restorePath(pipelinePaths.runtimeScenarioSelected, before.selected);
    restorePath(pipelinePaths.runtimeScenarioIndex, before.index);
    restorePath(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json"), before.currentMeta);
    restorePath(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), before.currentBundle);
  } finally {
    releaseStateLock(lock);
  }

  writeJson(stageTest1OutputPath("final-report.json"), finalReport);
  if (finalReport.status !== "passed") {
    throw new Error(finalReport.fatal_error || "TEST1_FAILED");
  }

  return finalReport;
}
