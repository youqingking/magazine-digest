import { createRuntimeFixtureRepository } from "../../../../packages/core-runtime/src/adapters/runtime-fixture-adapter";
import type { RuntimeDataRepository, RuntimeDataSource } from "../../../../packages/core-runtime/src/runtime-data-port";
import type { RuntimeShellState } from "../../../../packages/core-runtime/src/runtime-fixture-reader";
import { createSupabaseRuntimeRepository } from "../../../../packages/core-runtime/src/seams/supabase-seam";
import { loadSelectedRuntimeFixtureBundle } from "./runtime-fixture-source";

type PublicRuntimeEnv = {
  EXPO_PUBLIC_RUNTIME_DATA_SOURCE?: string;
  EXPO_PUBLIC_RUNTIME_SCENARIO_ID?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_PRODUCT_KEY?: string;
};

export async function loadSelectedRuntimeDataState(): Promise<RuntimeShellState> {
  const env = readPublicRuntimeEnv();
  const requestedScenarioId = env.EXPO_PUBLIC_RUNTIME_SCENARIO_ID || "current";
  const repository = createSelectedRuntimeDataRepository(env);
  return repository.loadContentState({ requestedScenarioId });
}

export function createSelectedRuntimeDataRepository(env: PublicRuntimeEnv = readPublicRuntimeEnv()): RuntimeDataRepository {
  const source = getRuntimeDataSource(env);

  if (source === "supabase") {
    return createSupabaseRuntimeRepository({
      EXPO_PUBLIC_SUPABASE_URL: env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_PRODUCT_KEY: env.EXPO_PUBLIC_PRODUCT_KEY
    });
  }

  return createRuntimeFixtureRepository(loadSelectedRuntimeFixtureBundle());
}

export function getRuntimeDataSource(env: PublicRuntimeEnv = readPublicRuntimeEnv()): RuntimeDataSource {
  return env.EXPO_PUBLIC_RUNTIME_DATA_SOURCE === "supabase" ? "supabase" : "fixture";
}

function readPublicRuntimeEnv(): PublicRuntimeEnv {
  const runtimeEnv = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtimeEnv.process?.env || {};
}
