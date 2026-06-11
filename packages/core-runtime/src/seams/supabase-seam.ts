import { buildUnavailableRuntimeShellState, type RuntimeShellState } from "../runtime-fixture-reader.ts";
import type {
  RuntimeDataRepository,
  RuntimeContentRepository,
  RuntimeEntitlementRepository,
  RuntimeEntitlementSnapshot,
  RuntimeNotificationRepository,
  RuntimeNotificationSnapshot,
  RuntimeRepositoryContext,
  RuntimeScenarioRepository,
  RuntimeScenarioDescriptor
} from "../runtime-data-port.ts";

export type RuntimeServiceSeam = {
  name: string;
  product_key: string;
  status: "placeholder";
  connects: false;
  note: string;
};

export function describeSupabaseRuntimeSeam(productKey: string): RuntimeServiceSeam {
  return {
    name: "Supabase runtime data seam",
    product_key: productKey,
    status: "placeholder",
    connects: false,
    note: "Reserved for future product-scoped auth, user state, runtime config, and events."
  };
}

export type SupabaseRuntimeEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_PRODUCT_KEY?: string;
};

export const SUPABASE_RUNTIME_ENV_KEYS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_PRODUCT_KEY"
] as const;

type SupabaseRuntimeRepository = RuntimeContentRepository &
  RuntimeScenarioRepository &
  RuntimeEntitlementRepository &
  RuntimeNotificationRepository &
  RuntimeDataRepository;

export function createSupabaseRuntimeRepository(env: SupabaseRuntimeEnv = {}): SupabaseRuntimeRepository {
  return {
    sourceKind: "supabase",
    connects: false,
    loadContentState(context?: RuntimeRepositoryContext): RuntimeShellState {
      const productKey = resolveProductKey(env, context);
      const missingEnv = getMissingSupabaseEnv(env);
      if (missingEnv.length > 0) {
        return buildUnavailableRuntimeShellState({
          productKey,
          sourceKind: "supabase",
          sourceLabel: "Supabase runtime data seam",
          requestedScenarioId: context?.requestedScenarioId,
          reason: "missing_env",
          missingEnv,
          message:
            "Supabase runtime data source was selected, but no credential-bearing environment is configured. Fixture data is not substituted in Supabase mode."
        });
      }

      return buildUnavailableRuntimeShellState({
        productKey,
        sourceKind: "supabase",
        sourceLabel: "Supabase runtime data seam",
        requestedScenarioId: context?.requestedScenarioId,
        reason: "not_implemented",
        missingEnv: [],
        message:
          "Supabase environment placeholders are present, but the no-credential seam does not connect or query runtime data yet."
      });
    },
    loadScenario(context?: RuntimeRepositoryContext): RuntimeScenarioDescriptor {
      const productKey = resolveProductKey(env, context);
      const missingEnv = getMissingSupabaseEnv(env);
      return {
        status: "unavailable",
        productKey,
        product_key: productKey,
        scenarioId: "unavailable",
        sourceKind: "supabase",
        sourceLabel: "Supabase runtime data seam",
        message:
          missingEnv.length > 0
            ? `Supabase scenario data unavailable; missing env: ${missingEnv.join(", ")}.`
            : "Supabase scenario data unavailable; repository implementation is reserved for a future goal."
      };
    },
    loadEntitlementSnapshot(context?: RuntimeRepositoryContext): RuntimeEntitlementSnapshot {
      const productKey = resolveProductKey(env, context);
      return {
        status: "unavailable",
        productKey,
        product_key: productKey,
        sourceKind: "supabase",
        message: "Supabase entitlement snapshots are unavailable until RevenueCat sync and schema work are implemented."
      };
    },
    loadNotificationSnapshot(context?: RuntimeRepositoryContext): RuntimeNotificationSnapshot {
      const productKey = resolveProductKey(env, context);
      return {
        status: "unavailable",
        productKey,
        product_key: productKey,
        sourceKind: "supabase",
        message: "Supabase notification state is unavailable until notification schema and credential decisions are implemented."
      };
    }
  };
}

export function getMissingSupabaseEnv(env: SupabaseRuntimeEnv): string[] {
  return SUPABASE_RUNTIME_ENV_KEYS.filter((key) => !readString(env[key]));
}

function resolveProductKey(env: SupabaseRuntimeEnv, context?: RuntimeRepositoryContext): string {
  return context?.productKey || readString(env.EXPO_PUBLIC_PRODUCT_KEY) || "supabase_unconfigured";
}

function readString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
