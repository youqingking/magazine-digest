import currentRuntimeBundle from "../../../../mobile/fixtures/runtime/current/runtime.bundle.json";
import s01NormalFullMatrixBundle from "../../../../mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json";

import { createRuntimeFixtureRepository } from "../../../../packages/core-runtime/src/adapters/runtime-fixture-adapter";
import type { RuntimeDataRepository } from "../../../../packages/core-runtime/src/runtime-data-port";
import type { RuntimeFixtureBundle } from "../../../../packages/core-runtime/src/runtime-fixture-reader";

const scenarioBundles: Record<string, RuntimeFixtureBundle> = {
  current: currentRuntimeBundle as RuntimeFixtureBundle,
  s01_normal_full_matrix: s01NormalFullMatrixBundle as RuntimeFixtureBundle
};

export type RuntimeFixtureSource = {
  bundle: RuntimeFixtureBundle | null;
  sourceLabel: string;
  requestedScenarioId: string;
};

export function loadSelectedRuntimeFixtureBundle(): RuntimeFixtureSource {
  const requestedScenarioId = getRequestedScenarioId();
  const bundle = scenarioBundles[requestedScenarioId] || scenarioBundles.current || null;

  if (!bundle) {
    return {
      bundle: null,
      sourceLabel: "local fallback",
      requestedScenarioId
    };
  }

  const selectedScenarioId = String(
    bundle.metadata?.selected_scenario_id || bundle.metadata?.scenario_id || requestedScenarioId
  );

  return {
    bundle,
    sourceLabel:
      requestedScenarioId === "current"
        ? "mobile/fixtures/runtime/current/runtime.bundle.json"
        : `mobile/fixtures/runtime/scenarios/${selectedScenarioId}.bundle.json`,
    requestedScenarioId
  };
}

export function createSelectedRuntimeFixtureRepository(): RuntimeDataRepository {
  return createRuntimeFixtureRepository(loadSelectedRuntimeFixtureBundle());
}

function getRequestedScenarioId(): string {
  const runtimeEnv = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtimeEnv.process?.env?.EXPO_PUBLIC_RUNTIME_SCENARIO_ID || "current";
}
