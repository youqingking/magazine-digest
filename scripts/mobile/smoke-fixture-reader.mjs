#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");

const readerUrl = pathToFileURL(path.join(repoRoot, "packages/core-runtime/src/runtime-fixture-reader.ts"));
const { buildRuntimeShellState } = await import(readerUrl.href);
const fixtureAdapterUrl = pathToFileURL(
  path.join(repoRoot, "packages/core-runtime/src/adapters/runtime-fixture-adapter.ts")
);
const { createRuntimeFixtureRepository } = await import(fixtureAdapterUrl.href);
const supabaseSeamUrl = pathToFileURL(path.join(repoRoot, "packages/core-runtime/src/seams/supabase-seam.ts"));
const { createSupabaseRuntimeRepository } = await import(supabaseSeamUrl.href);

async function readBundle(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

const fixtures = [
  {
    label: "current",
    path: "mobile/fixtures/runtime/current/runtime.bundle.json"
  },
  {
    label: "s01_normal_full_matrix",
    path: "mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json"
  }
];

const results = [];

for (const fixture of fixtures) {
  const bundle = await readBundle(fixture.path);
  const state = buildRuntimeShellState(bundle, {
    requestedScenarioId: fixture.label,
    sourceLabel: fixture.path
  });
  const repository = createRuntimeFixtureRepository({
    bundle,
    requestedScenarioId: fixture.label,
    sourceLabel: fixture.path
  });
  const portState = await repository.loadContentState({ requestedScenarioId: fixture.label });

  if (state.status !== "ready") {
    throw new Error(`Fixture ${fixture.label} was not ready: ${state.status}`);
  }

  if (portState.status !== "ready") {
    throw new Error(`Fixture adapter ${fixture.label} was not ready: ${portState.status}`);
  }

  if (!state.metadata.productKey || state.metadata.productKey === "fixture_unknown") {
    throw new Error(`Fixture ${fixture.label} did not expose product_key`);
  }

  if (state.articles.length === 0) {
    throw new Error(`Fixture ${fixture.label} did not expose article rows`);
  }

  results.push({
    fixture: fixture.label,
    product_key: state.metadata.productKey,
    scenario_id: state.metadata.scenarioId,
    article_count: state.articles.length,
    surface_count: state.surfaceCount
  });
}

const supabaseRepository = createSupabaseRuntimeRepository({});
const supabaseState = await supabaseRepository.loadContentState({ requestedScenarioId: "current" });
if (supabaseState.status !== "unavailable" || supabaseState.reason !== "missing_env") {
  throw new Error("Supabase seam did not fail closed when env was missing");
}

console.log("MOBILE_FIXTURE_READER_SMOKE_PASSED");
for (const result of results) {
  console.log(
    `${result.fixture}: product_key=${result.product_key} scenario=${result.scenario_id} articles=${result.article_count} surfaces=${result.surface_count}`
  );
}
console.log(`supabase: status=${supabaseState.status} reason=${supabaseState.reason}`);
